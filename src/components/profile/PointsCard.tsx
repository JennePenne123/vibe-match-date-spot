import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, TrendingUp, Zap } from 'lucide-react';
import { getLevelProgress, getPointsForNextLevel } from '@/services/pointsService';

interface PointsCardProps {
  totalPoints: number;
  level: number;
  streakCount: number;
}

export const PointsCard: React.FC<PointsCardProps> = ({
  totalPoints,
  level,
  streakCount
}) => {
  const progress = getLevelProgress(totalPoints, level);
  const nextLevelPoints = getPointsForNextLevel(level);
  const pointsNeeded = nextLevelPoints - totalPoints;

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-primary" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Points and Level */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-primary">{totalPoints}</p>
            <p className="text-sm text-muted-foreground">Total Points</p>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="text-lg px-3 py-1">
              Level {level}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {pointsNeeded} to next
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Level Progress
            </span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Streak */}
        {streakCount > 0 && (
          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-200/50 dark:border-orange-800/50">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
              <Zap className="h-5 w-5 text-white fill-white" />
            </div>
            <div>
              <p className="font-semibold text-sm">
                {streakCount} Day Streak! 🔥
              </p>
              <p className="text-xs text-muted-foreground">
                Keep rating to maintain your streak
              </p>
            </div>
          </div>
        )}

        {/* Motivational Message */}
        {level < 5 && (
          <p className="text-xs text-center text-muted-foreground italic">
            Keep rating dates to level up and unlock exclusive badges!
          </p>
        )}
      </CardContent>
    </Card>
  );
};
