import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Clock, Info, Sparkles, Heart } from 'lucide-react';
import { VenuePhotoUpload } from './VenuePhotoUpload';
import { VenueDetailsEditor } from './VenueDetailsEditor';
import { VenueInfoEditor } from './VenueInfoEditor';
import VenuePersonalityWizard from './VenuePersonalityWizard';
import VenueBestTimesEditor from './VenueBestTimesEditor';
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
      .select('photos, opening_hours, menu_highlights, description, cuisine_type, price_range, website, phone, address, tags')
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info" className="gap-1.5 text-xs">
                <Info className="w-3.5 h-3.5" />
                Info
              </TabsTrigger>
              <TabsTrigger value="personality" className="gap-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                KI-Profil
              </TabsTrigger>
              <TabsTrigger value="photos" className="gap-1.5 text-xs">
                <Camera className="w-3.5 h-3.5" />
                Fotos
              </TabsTrigger>
              <TabsTrigger value="details" className="gap-1.5 text-xs">
                <Clock className="w-3.5 h-3.5" />
                Zeiten
              </TabsTrigger>
            </TabsList>
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
