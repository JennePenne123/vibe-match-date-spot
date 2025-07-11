
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
    <div className="grid grid-cols-3 gap-3 mb-6">
      {stats.map((stat) => (
        <Card key={stat.label} className="text-center bg-white shadow-sm border-gray-100">
          <CardContent className="p-4">
            <stat.icon className="w-6 h-6 mx-auto mb-2 text-datespot-pink" />
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-600">{stat.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProfileStats;
