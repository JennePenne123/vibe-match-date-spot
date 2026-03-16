import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Trophy, Star, TrendingUp } from 'lucide-react';
import { useUserPoints } from '@/hooks/useUserPoints';
import { useFriends } from '@/hooks/useFriends';
import { Skeleton } from '@/components/ui/skeleton';

const ProfileStats = () => {
  const { t } = useTranslation();
  const { points, loading: pointsLoading } = useUserPoints();
  const { friends } = useFriends();

  const totalPoints = points?.total_points || 0;
  const level = points?.level || 1;
  const friendsCount = friends.filter(f => f.friendship_status === 'accepted').length;
  const badgesCount = Array.isArray(points?.badges) ? points.badges.length : 0;

  const stats = [
    { label: t('profile.totalPoints'), value: totalPoints.toLocaleString(), icon: Trophy, gradient: 'from-yellow-500/20 to-orange-500/20', iconColor: 'text-yellow-500', borderColor: 'border-yellow-500/20' },
    { label: t('profile.level'), value: level.toString(), icon: Star, gradient: 'from-primary/20 to-violet-500/20', iconColor: 'text-primary', borderColor: 'border-primary/20' },
    { label: t('profile.friends'), value: friendsCount.toString(), icon: Users, gradient: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-500', borderColor: 'border-blue-500/20' },
    { label: t('profile.badges'), value: badgesCount.toString(), icon: TrendingUp, gradient: 'from-green-500/20 to-emerald-500/20', iconColor: 'text-green-500', borderColor: 'border-green-500/20' },
  ];

  if (pointsLoading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 p-3 text-center">
            <Skeleton className="h-5 w-5 mx-auto mb-2 rounded" />
            <Skeleton className="h-6 w-10 mx-auto mb-1" />
            <Skeleton className="h-3 w-14 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-2">
      {stats.map((stat, index) => (
        <div 
          key={stat.label} 
          className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${stat.gradient} border ${stat.borderColor} p-3 text-center backdrop-blur-sm hover:scale-[1.03] transition-all duration-300 animate-fade-in`}
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <stat.icon className={`w-4 h-4 mx-auto mb-1.5 ${stat.iconColor}`} />
          <p className="text-lg font-bold text-foreground leading-none mb-0.5">{stat.value}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

export default ProfileStats;
