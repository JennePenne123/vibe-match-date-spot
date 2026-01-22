
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
      <Card className="bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-background border-primary/20 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full p-4 shadow-glow-primary/40">
              <Heart className="w-12 h-12 text-white" fill="currentColor" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            Start Your Dating Journey
          </CardTitle>
          <p className="text-muted-foreground">
            Add friends to start planning amazing dates with AI-powered recommendations
          </p>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-300">
              <Users className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
              <h3 className="font-medium text-foreground mb-1">Connect with Friends</h3>
              <p className="text-sm text-muted-foreground">Add friends to start planning dates together</p>
            </div>
            <div className="p-4 bg-card/50 backdrop-blur-sm rounded-lg border border-border/50 hover:border-primary/30 transition-all duration-300">
              <Sparkles className="h-8 w-8 text-violet-400 mx-auto mb-2" />
              <h3 className="font-medium text-foreground mb-1">AI-Powered Matching</h3>
              <p className="text-sm text-muted-foreground">Get personalized venue recommendations</p>
            </div>
          </div>
          
          <Button 
            onClick={() => navigate('/my-friends')}
            variant="default"
            size="lg"
            className="shadow-glow-primary/30 hover:shadow-glow-primary/50 transition-all duration-300"
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
