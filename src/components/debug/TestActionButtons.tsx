import { Button } from '@/components/ui/button';

interface TestActionButtonsProps {
  loading: boolean;
  onTestGooglePlaces: () => void;
  onTestVenueScoring: () => void;
  onTestFullFlow: () => void;
}

export const TestActionButtons = ({
  loading,
  onTestGooglePlaces,
  onTestVenueScoring,
  onTestFullFlow
}: TestActionButtonsProps) => {
  return (
    <div className="flex gap-2 flex-wrap">
      <Button 
        onClick={onTestGooglePlaces} 
        disabled={loading}
        variant="outline"
      >
        Test Google Places API
      </Button>
      <Button 
        onClick={onTestVenueScoring} 
        disabled={loading}
        variant="outline"
      >
        Test Venue Scoring
      </Button>
      <Button 
        onClick={onTestFullFlow} 
        disabled={loading}
        variant="default"
      >
        Test Full Flow
      </Button>
    </div>
  );
};