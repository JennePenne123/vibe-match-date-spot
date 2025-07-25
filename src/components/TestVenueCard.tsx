import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Clock, List, Users } from 'lucide-react';
import { Venue } from '@/types';

interface TestVenueCardProps {
  venue: Venue;
  partnerNames?: string[];
  partnerAvatars?: string[];
  dateType?: string;
  dateTime?: string;
  category?: string;
}

const TestVenueCard = ({ 
  venue, 
  partnerNames = ["Pauline", "John"],
  partnerAvatars = [],
  dateType = "Double date",
  dateTime = "Today, 18:00",
  category = "Drinks & Fun"
}: TestVenueCardProps) => {
  
  return (
    <div className="venue-card p-4 max-w-sm">
      {/* Header with names and date type */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-col">
          <h3 className="font-semibold text-foreground text-lg">
            {partnerNames.join(" and ")}
          </h3>
          <Badge 
            variant="secondary" 
            className="w-fit mt-1 bg-muted/50 text-muted-foreground hover:bg-muted/70"
          >
            <Users className="w-3 h-3 mr-1" />
            {dateType}
          </Badge>
        </div>
        
        {/* Partner avatars */}
        <div className="flex -space-x-2">
          {partnerAvatars.length > 0 ? (
            partnerAvatars.map((avatar, index) => (
              <Avatar key={index} className="w-12 h-12 border-2 border-background">
                <AvatarImage src={avatar} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {partnerNames[index]?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
            ))
          ) : (
            partnerNames.map((name, index) => (
              <Avatar key={index} className="w-12 h-12 border-2 border-background">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {name[0]}
                </AvatarFallback>
              </Avatar>
            ))
          )}
        </div>
      </div>

      {/* Venue information */}
      <div className="space-y-2">
        {/* Venue name with rating */}
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-foreground flex-1">
            {venue.name}
          </h4>
          {venue.rating && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-muted-foreground">{venue.rating}</span>
            </div>
          )}
        </div>

        {/* Date and time */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{dateTime}</span>
        </div>

        {/* Category */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <List className="w-4 h-4" />
          <span>{category}</span>
        </div>
      </div>
    </div>
  );
};

export default TestVenueCard;