import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Clock } from 'lucide-react';
import { VenuePhotoUpload } from './VenuePhotoUpload';
import { VenueDetailsEditor } from './VenueDetailsEditor';
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
      .select('photos, opening_hours, menu_highlights')
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
          <Tabs defaultValue="photos" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="photos" className="gap-1.5 text-xs">
                <Camera className="w-3.5 h-3.5" />
                Fotos
              </TabsTrigger>
              <TabsTrigger value="details" className="gap-1.5 text-xs">
                <Clock className="w-3.5 h-3.5" />
                Zeiten & Karte
              </TabsTrigger>
            </TabsList>
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
