
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Users, MapPin } from 'lucide-react';
import { Heading, Text } from '@/design-system/components';

const ProfileStats = () => {
  const stats = [
    { label: 'Dates Planned', value: '0', icon: Heart },
    { label: 'Friends Connected', value: '0', icon: Users },
    { label: 'Areas Explored', value: '0', icon: MapPin }
  ];

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="text-center bg-white shadow-sm border-gray-100">
          <CardContent className="p-4">
            <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
            <Heading size="h1" className="text-center">{stat.value}</Heading>
            <Text size="xs" className="text-center text-muted-foreground">{stat.label}</Text>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProfileStats;
