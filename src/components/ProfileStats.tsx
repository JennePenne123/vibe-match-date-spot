
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Users, MapPin } from 'lucide-react';

const ProfileStats = () => {
  const stats = [
    { label: 'Dates Planned', value: '0', icon: Heart },
    { label: 'Friends Connected', value: '0', icon: Users },
    { label: 'Areas Explored', value: '0', icon: MapPin }
  ];

  return (
    <div className="grid grid-cols-3 gap-component-md mb-layout-sm">
      {stats.map((stat) => (
        <Card key={stat.label} variant="elevated" className="text-center">
          <CardContent className="p-component-lg">
            <stat.icon className="w-6 h-6 mx-auto mb-component-xs text-primary" />
            <div className="text-heading-h3 font-heading-h3 text-foreground">{stat.value}</div>
            <div className="text-caption text-muted-foreground">{stat.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProfileStats;
