
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Users, Brain, ArrowRight } from 'lucide-react';

const SmartDatePlanningCTA: React.FC = () => {
  const navigate = useNavigate();

  const handleStartPlanning = () => {
    navigate('/plan-date');
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="bg-purple-100 p-2 rounded-full">
            <Sparkles className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI-Powered Date Planning</h2>
            <p className="text-sm text-gray-600 font-normal">Let AI find the perfect match for you and your friends</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Collaborative</h3>
              <p className="text-xs text-gray-600">Plan together with friends</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full">
              <Brain className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Smart Matching</h3>
              <p className="text-xs text-gray-600">AI finds perfect venues</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-pink-100 p-2 rounded-full">
              <Sparkles className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Personalized</h3>
              <p className="text-xs text-gray-600">Based on your preferences</p>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleStartPlanning}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          size="lg"
        >
          Start Smart Planning
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default SmartDatePlanningCTA;
