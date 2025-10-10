import React from 'react';
import { Trophy, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useUserPoints } from '@/hooks/useUserPoints';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export const PointsIndicator: React.FC = () => {
  const { points, loading } = useUserPoints();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-20" />
      </div>
    );
  }

  if (!points) return null;

  return (
    <button
      onClick={() => navigate('/profile')}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border border-primary/20 transition-all hover:shadow-md group"
    >
      <Trophy className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
      <div className="flex flex-col items-start">
        <span className="text-xs font-semibold text-primary leading-none">
          {points.total_points.toLocaleString()}
        </span>
        <span className="text-[10px] text-muted-foreground leading-none">
          Level {points.level}
        </span>
      </div>
      {points.streak_count > 0 && (
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
          🔥 {points.streak_count}
        </Badge>
      )}
    </button>
  );
};
