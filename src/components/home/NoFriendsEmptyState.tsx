
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Sparkles, Heart, UserPlus } from 'lucide-react';
import SafeComponent from '@/components/SafeComponent';

const NoFriendsEmptyState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <SafeComponent componentName="NoFriendsEmptyState">
      <Card className="bg-gradient-to-r from-orange-50 to-rose-50 border-orange-200">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="bg-datespot-gradient rounded-full p-4 shadow-md">
              <Heart className="w-12 h-12 text-white" fill="currentColor" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            Start Your Dating Journey
          </CardTitle>
          <p className="text-gray-600">
            Add friends to start planning amazing dates with AI-powered recommendations
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg border border-datespot-light-coral">
              <Users className="h-8 w-8 text-datespot-coral mx-auto mb-2" />
              <h3 className="font-medium text-gray-800 mb-1">Connect with Friends</h3>
              <p className="text-sm text-gray-600">Add friends to start planning dates together</p>
            </div>
            <div className="p-4 bg-white rounded-lg border border-datespot-light-coral">
              <Sparkles className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h3 className="font-medium text-gray-800 mb-1">AI-Powered Matching</h3>
              <p className="text-sm text-gray-600">Get personalized venue recommendations</p>
            </div>
          </div>
          
          <Button 
            onClick={() => navigate('/my-friends')}
            className="bg-datespot-gradient text-white hover:opacity-90"
            size="lg"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Friends to Get Started
          </Button>
        </CardContent>
      </Card>
    </SafeComponent>
  );
};

export default NoFriendsEmptyState;
