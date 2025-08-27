import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles } from 'lucide-react';

interface SmartDatePlannerAuthProps {
  onSignIn: () => void;
}

const SmartDatePlannerAuth: React.FC<SmartDatePlannerAuthProps> = ({ onSignIn }) => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with premium gradients */}
      <div className="absolute inset-0 bg-gradient-romantic opacity-90" />
      <div className="absolute inset-0 bg-gradient-dreamy opacity-30" />
      
      {/* Floating elements for visual interest */}
      <div className="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary/20 blur-xl animate-pulse" />
      <div className="absolute bottom-32 right-16 w-32 h-32 rounded-full bg-secondary/15 blur-2xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/4 w-16 h-16 rounded-full bg-accent/25 blur-lg animate-pulse delay-500" />
      
      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md mx-auto">
          {/* Premium card with glass effect */}
          <div className="bg-card/80 backdrop-blur-xl border border-border/20 rounded-2xl p-8 text-center" 
               style={{ boxShadow: 'var(--shadow-elegant)' }}>
            
            {/* Icon */}
            <div className="mb-6 flex justify-center">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                  <Heart className="w-8 h-8 text-primary-foreground" />
                </div>
                <Sparkles className="w-6 h-6 text-primary absolute -top-1 -right-1 animate-pulse" />
              </div>
            </div>
            
            {/* Heading */}
            <h1 className="text-3xl font-display font-bold text-foreground mb-3 bg-gradient-primary bg-clip-text text-transparent">
              Authentication Required
            </h1>
            
            {/* Subtitle */}
            <p className="text-muted-foreground mb-8 text-lg leading-relaxed">
              Please sign in to unlock the magic of our Smart Date Planner and create unforgettable moments.
            </p>
            
            {/* Premium button */}
            <Button 
              onClick={onSignIn}
              size="lg"
              className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold py-3 px-8 rounded-xl transition-all duration-300 hover:scale-105"
              style={{ boxShadow: 'var(--shadow-romantic)' }}
            >
              <Heart className="w-5 h-5 mr-2" />
              Sign In to Continue
            </Button>
            
            {/* Decorative element */}
            <div className="mt-6 flex items-center justify-center space-x-2 text-muted-foreground/60">
              <div className="w-8 h-px bg-gradient-primary opacity-30" />
              <Sparkles className="w-4 h-4" />
              <div className="w-8 h-px bg-gradient-primary opacity-30" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartDatePlannerAuth;