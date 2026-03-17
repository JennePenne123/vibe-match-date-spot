import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Lock } from 'lucide-react';
import { BADGE_DEFINITIONS, getBadgeInfo } from '@/services/pointsService';

interface BadgesCardProps {
  badges: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  rating: 'Bewertungen',
  exploration: 'Entdecken',
  engagement: 'Engagement',
  social: 'Social',
  referral: 'Einladungen',
};

const CATEGORY_ORDER = ['rating', 'exploration', 'engagement', 'social', 'referral'];

export const BadgesCard: React.FC<BadgesCardProps> = ({ badges }) => {
  const allBadgeIds = Object.keys(BADGE_DEFINITIONS);
  const earnedSet = new Set(badges);

  // Group all badges by category
  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    label: CATEGORY_LABELS[cat] || cat,
    badges: allBadgeIds
      .filter(id => BADGE_DEFINITIONS[id].category === cat)
      .map(id => ({ id, ...BADGE_DEFINITIONS[id], earned: earnedSet.has(id) })),
  })).filter(g => g.badges.length > 0);

  const earnedCount = badges.filter(b => BADGE_DEFINITIONS[b]).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Award className="h-5 w-5 text-primary" />
          Achievements
          <Badge variant="secondary" className="ml-auto">
            {earnedCount} / {allBadgeIds.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {grouped.map(group => (
          <div key={group.category}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {group.label}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {group.badges.map(badge => (
                <div
                  key={badge.id}
                  className={
                    badge.earned
                      ? 'p-3 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-background hover:shadow-md transition-shadow'
                      : 'p-3 rounded-lg border border-border bg-muted/30 opacity-50'
                  }
                >
                  <div className="flex items-start gap-2">
                    {badge.earned ? (
                      <span className="text-2xl">{badge.icon}</span>
                    ) : (
                      <Lock className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate ${!badge.earned ? 'text-muted-foreground' : ''}`}>
                        {badge.name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {badge.earned ? badge.description : badge.requirement}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Empty State */}
        {earnedCount === 0 && (
          <div className="text-center py-4">
            <Award className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Starte mit deinem ersten Date um Badges zu verdienen!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};