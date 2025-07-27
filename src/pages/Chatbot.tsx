import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  X, 
  Bot, 
  User, 
  Loader, 
  RefreshCw,
  BookOpen,
  Users,
  Briefcase,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('bvrit-chat-messages');
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsedMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error('Error loading chat history:', error);
        // Set default message if loading fails
        setDefaultMessage();
      }
    } else {
      setDefaultMessage();
    }
  }, []);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('bvrit-chat-messages', JSON.stringify(messages));
    }
  }, [messages]);

  const setDefaultMessage = () => {
    setMessages([{
      id: 1,
      text: "Hi! I'm your BVRIT Alumni Connect assistant. How can I help you today?",
      isBot: true,
      timestamp: new Date()
    }]);
  };
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Note: In production, store API keys securely on your backend
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  // Educational system prompt for BVRIT context
  const SYSTEM_PROMPT = `You are BVRIT Alumni Connect assistant. Give direct, concise answers (2-3 sentences max). 

TOPICS: Platform navigation, career advice, mentorship, academic support, networking, job search.

RULES:
- Answer only what's asked
- Be brief and specific
- No extra explanations unless requested
- Professional but friendly tone
- If unclear, ask one clarifying question

CONTEXT: BVRIT is an engineering college. Platform has Alumni Directory, Job Board, Mentorship Program, Events.`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickSuggestions = [
    {
      icon: <GraduationCap className="h-4 w-4" />,
      text: "How to find mentors?",
      color: "bg-blue-50 text-blue-700 border-blue-200"
    },
    {
      icon: <Briefcase className="h-4 w-4" />,
      text: "Career guidance tips",
      color: "bg-green-50 text-green-700 border-green-200"
    },
    {
      icon: <Users className="h-4 w-4" />,
      text: "Networking strategies",
      color: "bg-purple-50 text-purple-700 border-purple-200"
    },
    {
      icon: <BookOpen className="h-4 w-4" />,
      text: "Study techniques",
      color: "bg-orange-50 text-orange-700 border-orange-200"
    }
  ];

  // Context-aware fallback responses
  const getContextAwareFallback = (userMessage, conversationHistory) => {
    const message = userMessage.toLowerCase();
    const recentMessages = conversationHistory.slice(-5);
    
    // Check if user is asking follow-up questions
    const isFollowUp = message.includes('how') || message.includes('what') || 
                      message.includes('can you') || message.includes('tell me more');
    
    // Check conversation context
    const previousTopics = recentMessages.map(msg => msg.text.toLowerCase()).join(' ');
    
    if (message.includes('mentor') || previousTopics.includes('mentor')) {
      if (isFollowUp) {
        return `Send a brief message mentioning your field, year, and specific goals. Keep it professional and concise.`;
      }
      return `Use Alumni Directory to filter by your field, then send personalized connection requests mentioning your goals.`;
    }
    
    if (message.includes('career') || message.includes('job') || previousTopics.includes('career')) {
      if (isFollowUp) {
        return `Focus on technical skills relevant to your field, build projects, and practice coding/problem-solving daily.`;
      }
      return `Check the Job Board for exclusive postings, optimize your LinkedIn, and connect with alumni in your target companies.`;
    }
    
    if (message.includes('network') || message.includes('connect') || previousTopics.includes('network')) {
      if (isFollowUp) {
        return `Comment meaningfully on their posts, share relevant content, and offer help before asking for favors.`;
      }
      return `Attend platform events, join technical communities, and engage with alumni posts before reaching out.`;
    }
    
    if (message.includes('study') || message.includes('academic') || previousTopics.includes('study')) {
      if (isFollowUp) {
        return `Try the Feynman technique - explain concepts in simple terms to identify knowledge gaps.`;
      }
      return `Form study groups, practice active learning, and ask seniors for subject-specific tips.`;
    }
    
    if (message.includes('resume') || previousTopics.includes('resume')) {
      if (isFollowUp) {
        return `Use action verbs, quantify achievements, and customize for each job application.`;
      }
      return `Highlight projects, internships, and technical skills. Keep it 1-2 pages and tailor for each application.`;
    }
    
    // Handle common follow-up phrases
    if (message.includes('how') || message.includes('what about') || message.includes('can you explain')) {
      return `Could you be more specific about what aspect you'd like me to explain?`;
    }
    
    return `I can help with mentorship, career guidance, networking, academics, or platform navigation. What specifically do you need?`;
  };

  const handleSendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: messageText.trim(),
      isBot: false,
      timestamp: new Date()
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build conversation context from recent messages (last 10 for efficiency)
      const recentMessages = updatedMessages.slice(-10);
      const conversationContext = recentMessages
        .map(msg => `${msg.isBot ? 'Assistant' : 'User'}: ${msg.text}`)
        .join('\n');

      const requestPayload = {
        contents: [{
          parts: [{
            text: `${SYSTEM_PROMPT}\n\nConversation History:\n${conversationContext}\n\nPlease respond to the latest user message considering the conversation context.`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 150,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      console.log('Sending request to Gemini API...', requestPayload);

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('Parsed response:', data);

      let botResponse = '';
      
      if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
        botResponse = data.candidates[0].content.parts[0].text;
      } else if (data.error) {
        console.error('API Error:', data.error);
        throw new Error(data.error.message || 'API Error');
      } else {
        throw new Error('Invalid response format');
      }

      const botMessage = {
        id: Date.now() + 1,
        text: botResponse.trim(),
        isBot: true,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Error calling Gemini API:', error);
      
      // Use context-aware fallback response
      const fallbackResponse = getContextAwareFallback(messageText, messages);
      
      const botMessage = {
        id: Date.now() + 1,
        text: fallbackResponse,
        isBot: true,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickSuggestion = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const clearChat = () => {
    const defaultMessage = {
      id: 1,
      text: "Hi! I'm your BVRIT Alumni Connect assistant. How can I help you today?",
      isBot: true,
      timestamp: new Date()
    };
    setMessages([defaultMessage]);
    localStorage.setItem('bvrit-chat-messages', JSON.stringify([defaultMessage]));
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-blue-600 hover:bg-blue-700 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center group"
            style={{
              animation: 'bounce-gentle 2s infinite'
            }}
          >
            <MessageCircle className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="fixed bottom-8 right-8 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col"
          style={{
            animation: 'slide-up 0.3s ease-out forwards'
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">BVRIT Assistant</h3>
                <p className="text-xs text-blue-100">Online • Ready to help</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearChat}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Clear chat"
              >
                <RefreshCw className="h-4 w-4 text-white" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.isBot ? 'justify-start' : 'justify-end'
                }`}
              >
                {message.isBot && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.isBot
                      ? 'bg-white border border-gray-200 text-gray-800'
                      : 'bg-blue-600 text-white'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.text}
                  </p>
                  <p
                    className={`text-xs mt-2 ${
                      message.isBot ? 'text-gray-500' : 'text-blue-100'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>

                {!message.isBot && (
                  <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-white border border-gray-200 p-3 rounded-2xl">
                  <div className="flex items-center space-x-2">
                    <Loader className="h-4 w-4 text-blue-600 animate-spin" />
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length === 1 && (
            <div className="p-4 border-t border-gray-200 bg-white">
              <p className="text-xs text-gray-500 mb-3">Quick suggestions:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuickSuggestion(suggestion.text)}
                    className={`flex items-center space-x-2 p-2 rounded-lg border transition-all duration-200 hover:scale-105 text-xs ${suggestion.color}`}
                  >
                    {suggestion.icon}
                    <span>{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <textarea
                  placeholder="Ask me anything about BVRIT..."
                  className="w-full p-2 border rounded-md"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  rows={2}
                />
              </div>
              <Button onClick={() => handleSendMessage()} className="ml-2">
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;