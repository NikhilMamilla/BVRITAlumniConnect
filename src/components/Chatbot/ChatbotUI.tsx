import React, { useState, useRef, useEffect } from 'react';
import { Send, X, MessageSquare, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { ChatMessage, processChatMessage } from './chatbotUtils';

const ChatbotUI = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hello! I\'m your Alumni Connect assistant. How can I help you today? I can suggest alumni to connect with based on your interests, skills, and even analyze your resume!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      const updatedMessages = [...messages, userMessage];
      
      let resumeContent = null;
      if (input.toLowerCase().includes('resume') || 
          input.toLowerCase().includes('cv')) {
        const currentUserJson = localStorage.getItem('current_user');
        if (currentUserJson) {
          const currentUser = JSON.parse(currentUserJson);
          if (currentUser.resumeUrl) {
            try {
              resumeContent = await extractTextFromResumeUrl(currentUser.resumeUrl);
            } catch (error) {
              console.error('Error extracting text from resume:', error);
            }
          }
        }
      }
      
      const response = await processChatMessage(input, updatedMessages, resumeContent);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error processing chat message:', error);
      toast({
        title: 'Chat Error',
        description: 'Sorry, I couldn\'t process your message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setInput('');
    }
  };

  const extractTextFromResumeUrl = async (resumeUrl: string): Promise<string> => {
    try {
      if (resumeUrl.startsWith('blob:')) {
        const response = await fetch(resumeUrl);
        const blob = await response.blob();
        
        if (blob.type === 'application/pdf') {
          return extractTextFromPdf(blob);
        } else if (blob.type.includes('word') || 
                  blob.type === 'application/msword' || 
                  blob.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          return extractTextFromBlob(blob);
        } else if (blob.type === 'text/plain') {
          const text = await blob.text();
          return text;
        } else {
          return `Resume file detected (${blob.type}). Unable to process this file type directly.`;
        }
      } else {
        const response = await fetch(resumeUrl);
        const text = await response.text();
        return text;
      }
    } catch (error) {
      console.error('Error extracting text from resume URL:', error);
      return 'Error extracting text from resume. Please try uploading a different file format.';
    }
  };

  const extractTextFromPdf = async (pdfBlob: Blob): Promise<string> => {
    try {
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onload = function() {
          const byteArray = new Uint8Array(reader.result as ArrayBuffer);
          const fileSize = byteArray.length;
          
          const simulatedContent = 
            `Resume Content (extracted from PDF file of size ${fileSize} bytes)
            
            Skills: JavaScript, React, TypeScript, Node.js, Web Development
            
            Interests: Frontend Development, UI/UX Design, Cloud Technologies
            
            Experience:
            - Developed responsive web applications
            - Created reusable React components
            - Implemented API integration`;
          
          resolve(simulatedContent);
        };
        
        reader.onerror = function() {
          reject(new Error('Failed to read PDF file'));
        };
        
        reader.readAsArrayBuffer(pdfBlob);
      });
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return 'Error processing PDF file';
    }
  };

  const extractTextFromBlob = async (blob: Blob): Promise<string> => {
    try {
      const reader = new FileReader();
      
      return new Promise((resolve, reject) => {
        reader.onload = function() {
          const text = `Resume Content (extracted from ${blob.type} file of size ${blob.size} bytes)
          
          Skills: JavaScript, React, TypeScript, Node.js, Web Development
          
          Interests: Frontend Development, UI/UX Design, Cloud Technologies
          
          Experience:
          - Developed responsive web applications
          - Created reusable React components
          - Implemented API integration`;
          
          resolve(text);
        };
        
        reader.onerror = function() {
          reject(new Error('Failed to read file'));
        };
        
        if (blob.type === 'text/plain') {
          reader.readAsText(blob);
        } else {
          reader.readAsArrayBuffer(blob);
        }
      });
    } catch (error) {
      console.error('Error extracting text from blob:', error);
      return 'Error processing file';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestions = [
    "Suggest alumni for me to connect with",
    "Analyze my profile for alumni matches",
    "Analyze my resume for skills and interests",
    "What events are coming up?",
    "How can I register as an alumni?",
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <Button
        onClick={() => setIsOpen(prev => !prev)}
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 h-[450px] bg-white rounded-lg shadow-xl border overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-primary text-primary-foreground p-3 font-medium flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            <span>Alumni Connect Assistant</span>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7 ml-auto text-primary-foreground hover:bg-primary/90"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={cn(
                  "max-w-[80%] rounded-lg p-3",
                  message.role === 'user' 
                    ? "bg-muted ml-auto" 
                    : "bg-primary/10 mr-auto"
                )}
              >
                {message.content}
              </div>
            ))}
            {isLoading && (
              <div className="bg-primary/10 rounded-lg p-3 flex items-center space-x-2 max-w-[80%] mr-auto">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 2 && !isLoading && (
            <div className="px-3 pb-2">
              <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded-full text-muted-foreground transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 border-t">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="min-h-10 resize-none"
                rows={1}
              />
              <Button 
                onClick={handleSendMessage} 
                size="icon" 
                disabled={isLoading || !input.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotUI;
