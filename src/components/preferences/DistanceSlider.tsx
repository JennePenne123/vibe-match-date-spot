
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { MapPin } from 'lucide-react';

interface DistanceSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const DistanceSlider: React.FC<DistanceSliderProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-red-500" />
        <h3 className="font-medium text-gray-900">Maximum Distance</h3>
      </div>
      
      <div className="space-y-2">
        <Slider
          value={[value]}
          onValueChange={(newValue) => onChange(newValue[0])}
          max={50}
          min={1}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500">
          <span>1 mile</span>
          <span className="font-medium">{value} miles</span>
          <span>50 miles</span>
        </div>
      </div>
    </div>
  );
};

export default DistanceSlider;
