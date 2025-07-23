import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFriends } from '@/hooks/useFriends';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Users, Brain, ArrowRight, UserPlus } from 'lucide-react';
const SmartDatePlanningCTA: React.FC = () => {
  const navigate = useNavigate();
  const {
    friends
  } = useFriends();
  const handleStartPlanning = () => {
    navigate('/plan-date');
  };
  const handleAddFriends = () => {
    navigate('/my-friends');
  };
  const hasFriends = friends.length > 0;
  if (!hasFriends) {
    return <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-full">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Start Your Dating Journey</h2>
              <p className="text-sm text-gray-600 font-normal">AI-powered date planning with friends</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Collaborative</h3>
                <p className="text-xs text-gray-600">Plan with friends</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-full">
                <Brain className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI-Powered</h3>
                <p className="text-xs text-gray-600">Smart recommendations</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-purple-100">
            <p className="text-sm text-gray-600 mb-3">
              You can start planning even without friends added yet. The AI will help you find the perfect date spot!
            </p>
            <div className="flex gap-2">
              <Button onClick={handleStartPlanning} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white" size="lg">
                Start Planning
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button onClick={handleAddFriends} variant="outline" size="lg" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card>
      
      <CardContent className="space-y-4">
        
        
        <Button onClick={handleStartPlanning} size="lg" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-[9px] my-[14px] px-[9px] mx-0">
          Start Smart Planning
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>;
};
export default SmartDatePlanningCTA;