import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Crown, TrendingUp } from 'lucide-react';
import { getLeaderboard, type LeaderboardEntry } from '@/services/pointsService';
import { useAuth } from '@/contexts/AuthContext';

export const LeaderboardCard: React.FC = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    const data = await getLeaderboard(10);
    setLeaderboard(data);
    setLoading(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Crown className="h-5 w-5 text-yellow-500" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-6">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Be the first to earn points!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser = entry.user_id === user?.id;
              
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    isCurrentUser
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center font-bold text-sm">
                    {getRankIcon(rank)}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-10 w-10 border-2 border-background">
                    <AvatarImage src={entry.profile?.avatar_url} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {entry.profile?.name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Name and Level */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {entry.profile?.name || 'Anonymous'}
                      {isCurrentUser && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          You
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Level {entry.level}
                      {entry.streak_count > 0 && (
                        <span className="ml-2">
                          🔥 {entry.streak_count} day{entry.streak_count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Points */}
                  <div className="text-right">
                    <p className="font-bold text-sm text-primary">
                      {entry.total_points.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
