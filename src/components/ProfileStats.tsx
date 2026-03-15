import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Trophy, Star, TrendingUp } from 'lucide-react';
import { Heading, Text } from '@/design-system/components';
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
    { label: t('profile.totalPoints'), value: totalPoints.toLocaleString(), icon: Trophy, color: 'text-yellow-500' },
    { label: t('profile.level'), value: level.toString(), icon: Star, color: 'text-primary' },
    { label: t('profile.friends'), value: friendsCount.toString(), icon: Users, color: 'text-blue-500' },
    { label: t('profile.badges'), value: badgesCount.toString(), icon: TrendingUp, color: 'text-green-500' },
  ];

  if (pointsLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-white shadow-sm border-gray-100">
            <CardContent className="p-4">
              <Skeleton className="h-6 w-6 mx-auto mb-2 rounded" />
              <Skeleton className="h-8 w-16 mx-auto mb-1" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="text-center bg-white shadow-sm border-gray-100 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
            <Heading size="h1" className="text-center">{stat.value}</Heading>
            <Text size="xs" className="text-center text-muted-foreground">{stat.label}</Text>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProfileStats;
