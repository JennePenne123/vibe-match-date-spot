import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Lock } from 'lucide-react';
import { BADGE_DEFINITIONS, getBadgeInfo } from '@/services/pointsService';

interface BadgesCardProps {
  badges: string[];
}

export const BadgesCard: React.FC<BadgesCardProps> = ({ badges }) => {
  const earnedBadges = badges.map(getBadgeInfo);
  const allBadges = Object.keys(BADGE_DEFINITIONS);
  const lockedBadges = allBadges.filter(id => !badges.includes(id)).map(getBadgeInfo);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Award className="h-5 w-5 text-primary" />
          Achievements
          <Badge variant="secondary" className="ml-auto">
            {earnedBadges.length} / {allBadges.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Earned Badges */}
        {earnedBadges.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Unlocked</h3>
            <div className="grid grid-cols-2 gap-2">
              {earnedBadges.map((badge, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-background hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">{badge.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{badge.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locked Badges */}
        {lockedBadges.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">
              Locked
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {lockedBadges.slice(0, 4).map((badge, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-border bg-muted/30 opacity-60"
                >
                  <div className="flex items-start gap-2">
                    <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-muted-foreground truncate">
                        {badge.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {badge.requirement}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {earnedBadges.length === 0 && (
          <div className="text-center py-6">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-1">
              No badges yet
            </p>
            <p className="text-xs text-muted-foreground">
              Start rating dates to earn your first badge!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
