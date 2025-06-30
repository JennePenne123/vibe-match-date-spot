
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, ArrowRight, Zap, Users } from 'lucide-react';
import SafeComponent from '@/components/SafeComponent';

const SmartDatePlanningCTA: React.FC = () => {
  const navigate = useNavigate();

  return (
    <SafeComponent componentName="SmartDatePlanningCTA">
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-500" />
            Smart Date Planning
          </CardTitle>
          <p className="text-sm text-gray-600">
            Let AI help you plan the perfect date with collaborative preferences and smart matching
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 text-sm text-indigo-700">
                <Users className="h-4 w-4" />
                <span>Collaborative preference setting</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-indigo-700">
                <Sparkles className="h-4 w-4" />
                <span>Real-time compatibility scoring</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-indigo-700">
                <ArrowRight className="h-4 w-4" />
                <span>AI-curated venue recommendations</span>
              </div>
            </div>
            
            <div className="flex-shrink-0">
              <Button 
                onClick={() => navigate('/plan-date')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                size="lg"
              >
                Plan Smart Date
                <Zap className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </SafeComponent>
  );
};

export default SmartDatePlanningCTA;
