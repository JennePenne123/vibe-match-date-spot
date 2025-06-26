
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Plus } from 'lucide-react';

const StartNewDateCard = () => {
  const navigate = useNavigate();

  return (
    <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200 shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-3">
          <div className="bg-gradient-to-r from-pink-400 to-rose-500 rounded-full p-3 shadow-md">
            <Heart className="w-8 h-8 text-white" fill="currentColor" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-gray-800">
          Start New Date
        </CardTitle>
        <CardDescription className="text-gray-600">
          Discover amazing places with AI-powered recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Button
          onClick={() => navigate('/preferences')}
          className="w-full h-12 bg-gradient-to-r from-pink-400 to-rose-500 text-white hover:from-pink-500 hover:to-rose-600 font-semibold shadow-md"
        >
          <Plus className="w-5 h-5 mr-2" />
          Find Perfect Spots
        </Button>
      </CardContent>
    </Card>
  );
};

export default StartNewDateCard;
