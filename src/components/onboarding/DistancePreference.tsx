import React from 'react';
import { MapPin } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface DistancePreferenceProps {
  distanceKm: number;
  onChange: (km: number) => void;
}

const distanceLabels: Record<number, string> = {
  1: 'Direkt um die Ecke',
  2: 'Kurzer Spaziergang',
  3: 'Gemütlich erreichbar',
  5: 'Gerne auch etwas weiter',
  8: 'Kein Problem, etwas zu fahren',
  10: 'Die Reise gehört dazu',
  15: 'Für gutes Essen fahr ich weit',
  20: 'Stadtweit & darüber hinaus',
};

function getClosestLabel(km: number): string {
  const keys = Object.keys(distanceLabels).map(Number).sort((a, b) => a - b);
  let closest = keys[0];
  for (const k of keys) {
    if (Math.abs(k - km) < Math.abs(closest - km)) {
      closest = k;
    }
  }
  return distanceLabels[closest];
}

const DistancePreference: React.FC<DistancePreferenceProps> = ({ distanceKm, onChange }) => {
  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-foreground mb-1.5">
          Wie weit fährst du?
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Damit die KI dir Venues in der richtigen Entfernung empfiehlt.
        </p>
      </div>

      <div className="flex flex-col items-center py-4">
        {/* Distance visualization */}
        <div className="relative w-32 h-32 mb-6">
          <div
            className="absolute inset-0 rounded-full border-2 border-primary/20 transition-all duration-500"
            style={{
              transform: `scale(${0.4 + (distanceKm / 20) * 0.6})`,
            }}
          />
          <div
            className="absolute inset-0 rounded-full bg-primary/5 transition-all duration-500"
            style={{
              transform: `scale(${0.4 + (distanceKm / 20) * 0.6})`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-6 h-6 text-primary mx-auto mb-1" />
              <span className="text-2xl font-bold text-foreground">{distanceKm}</span>
              <span className="text-xs text-muted-foreground block">km</span>
            </div>
          </div>
        </div>

        {/* Label */}
        <p className="text-sm font-medium text-primary/80 mb-6 h-5 transition-all duration-300">
          {getClosestLabel(distanceKm)}
        </p>

        {/* Slider */}
        <div className="w-full max-w-[280px] px-2">
          <Slider
            value={[distanceKm]}
            onValueChange={([val]) => onChange(val)}
            min={1}
            max={20}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>1 km</span>
            <span>20 km</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistancePreference;
