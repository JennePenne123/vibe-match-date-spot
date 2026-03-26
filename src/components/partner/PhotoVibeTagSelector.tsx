import React from 'react';
import { PHOTO_VIBE_LABELS, AVAILABLE_PHOTO_VIBES } from '@/services/aiVenueService/photoVibeScoring';
import { Badge } from '@/components/ui/badge';

interface PhotoVibeTagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export const PhotoVibeTagSelector: React.FC<PhotoVibeTagSelectorProps> = ({
  selectedTags,
  onTagsChange,
}) => {
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground font-medium">
        📸 Foto-Atmosphäre taggen (verbessert KI-Matching)
      </p>
      <div className="flex flex-wrap gap-1.5">
        {AVAILABLE_PHOTO_VIBES.map(tag => {
          const info = PHOTO_VIBE_LABELS[tag];
          const isSelected = selectedTags.includes(tag);
          return (
            <Badge
              key={tag}
              variant={isSelected ? 'default' : 'outline'}
              className={`cursor-pointer text-[10px] transition-all ${
                isSelected
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              onClick={() => toggleTag(tag)}
            >
              {info?.emoji} {info?.label || tag}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};

export default PhotoVibeTagSelector;
