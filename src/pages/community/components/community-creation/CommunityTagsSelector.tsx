// CommunityTagsSelector.tsx
import React, { useState, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface CommunityTagsSelectorProps {
  tags: string[];
  setTags: (tags: string[]) => void;
  maxTags?: number;
}

export const CommunityTagsSelector: React.FC<CommunityTagsSelectorProps> = ({ tags, setTags, maxTags = 10 }) => {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const newTag = inputValue.trim().toLowerCase();
    if (newTag && !tags.includes(newTag)) {
      if (tags.length >= maxTags) {
        toast.warning(`You can add a maximum of ${maxTags} tags.`);
        return;
      }
      if (newTag.length > 25) {
        toast.warning(`Tags cannot be longer than 25 characters.`);
        return;
      }
      setTags([...tags, newTag]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="tags-input" className="block text-sm font-medium text-muted-foreground mb-1">
          Community Tags
        </label>
        <div className="flex items-center gap-2">
          <Input
            id="tags-input"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder="Add a tag and press Enter"
            className="flex-grow"
          />
          <Button type="button" onClick={addTag}>Add</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Help others find your community by adding relevant tags.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="rounded-full hover:bg-muted"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
};
