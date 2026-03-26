import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Clock, Info, Sparkles, Heart, Brain, Calendar } from 'lucide-react';
import { VenuePhotoUpload } from './VenuePhotoUpload';
import { VenueDetailsEditor } from './VenueDetailsEditor';
import { VenueInfoEditor } from './VenueInfoEditor';
import VenuePersonalityWizard from './VenuePersonalityWizard';
import VenueBestTimesEditor from './VenueBestTimesEditor';
import AITagSuggestions from './AITagSuggestions';
import SeasonalSpecialsEditor from './SeasonalSpecialsEditor';
import LoadingSpinner from '@/components/LoadingSpinner';

interface VenueManagementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueId: string;
  venueName: string;
  onUpdated: () => void;
}

export const VenueManagementSheet: React.FC<VenueManagementSheetProps> = ({
  open,
  onOpenChange,
  venueId,
  venueName,
  onUpdated,
}) => {
  const [venueData, setVenueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchVenueData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('venues')
      .select('photos, opening_hours, menu_highlights, description, cuisine_type, price_range, website, phone, address, tags, best_times, capacity, has_separee, pair_friendly_features, seasonal_specials')
      .eq('id', venueId)
      .maybeSingle();
    setVenueData(data);
    setLoading(false);
  };

  useEffect(() => {
    if (open && venueId) {
      fetchVenueData();
    }
  }, [open, venueId]);

  const handleUpdated = () => {
    fetchVenueData();
    onUpdated();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">{venueName} verwalten</SheetTitle>
        </SheetHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <Tabs defaultValue="info" className="mt-4">
            <div className="overflow-x-auto -mx-1 px-1">
              <TabsList className="inline-flex w-auto min-w-full">
                <TabsTrigger value="info" className="gap-1 text-[10px] sm:text-xs">
                  <Info className="w-3 h-3" />
                  Info
                </TabsTrigger>
                <TabsTrigger value="personality" className="gap-1 text-[10px] sm:text-xs">
                  <Sparkles className="w-3 h-3" />
                  KI
                </TabsTrigger>
                <TabsTrigger value="ai-tags" className="gap-1 text-[10px] sm:text-xs">
                  <Brain className="w-3 h-3" />
                  Tags
                </TabsTrigger>
                <TabsTrigger value="seasonal" className="gap-1 text-[10px] sm:text-xs">
                  <Calendar className="w-3 h-3" />
                  Saison
                </TabsTrigger>
                <TabsTrigger value="besttimes" className="gap-1 text-[10px] sm:text-xs">
                  <Heart className="w-3 h-3" />
                  Zeiten
                </TabsTrigger>
                <TabsTrigger value="photos" className="gap-1 text-[10px] sm:text-xs">
                  <Camera className="w-3 h-3" />
                  Fotos
                </TabsTrigger>
                <TabsTrigger value="details" className="gap-1 text-[10px] sm:text-xs">
                  <Clock className="w-3 h-3" />
                  Details
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="info" className="mt-4">
              <VenueInfoEditor
                venueId={venueId}
                currentData={{
                  description: venueData?.description,
                  cuisine_type: venueData?.cuisine_type,
                  price_range: venueData?.price_range,
                  website: venueData?.website,
                  phone: venueData?.phone,
                  address: venueData?.address,
                  tags: venueData?.tags,
                }}
                onUpdated={handleUpdated}
              />
            </TabsContent>
            <TabsContent value="personality" className="mt-4">
              <VenuePersonalityWizard
                venueId={venueId}
                existingTags={venueData?.tags || []}
                existingDescription={venueData?.description}
                onComplete={handleUpdated}
              />
            </TabsContent>
            <TabsContent value="ai-tags" className="mt-4">
              <AITagSuggestions
                venueId={venueId}
                venueName={venueName}
                existingTags={venueData?.tags || []}
                onTagsUpdated={handleUpdated}
              />
            </TabsContent>
            <TabsContent value="besttimes" className="mt-4">
              <VenueBestTimesEditor
                venueId={venueId}
                currentBestTimes={venueData?.best_times}
                currentCapacity={venueData?.capacity}
                currentHasSeparee={venueData?.has_separee}
                currentPairFeatures={venueData?.pair_friendly_features}
                onUpdated={handleUpdated}
              />
            </TabsContent>
            <TabsContent value="photos" className="mt-4">
              <VenuePhotoUpload
                venueId={venueId}
                existingPhotos={Array.isArray(venueData?.photos) ? venueData.photos : []}
                onPhotosUpdated={handleUpdated}
              />
            </TabsContent>
            <TabsContent value="details" className="mt-4">
              <VenueDetailsEditor
                venueId={venueId}
                currentHours={venueData?.opening_hours}
                currentMenuHighlights={venueData?.menu_highlights}
                onUpdated={handleUpdated}
              />
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default VenueManagementSheet;
