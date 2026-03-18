import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, X, Upload, Loader2 } from 'lucide-react';

interface VenuePhotoUploadProps {
  venueId: string;
  existingPhotos: Array<{ url: string; width: number; height: number; isGooglePhoto: boolean }>;
  onPhotosUpdated: () => void;
}

export const VenuePhotoUpload: React.FC<VenuePhotoUploadProps> = ({
  venueId,
  existingPhotos,
  onPhotosUpdated,
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  const partnerPhotos = existingPhotos.filter(p => !p.isGooglePhoto);
  const externalPhotos = existingPhotos.filter(p => p.isGooglePhoto);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const newPhotos = [...existingPhotos];

      for (const file of Array.from(files)) {
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: 'Datei zu groß', description: `${file.name} ist größer als 5MB`, variant: 'destructive' });
          continue;
        }

        const ext = file.name.split('.').pop();
        const fileName = `${venueId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('venue-photos')
          .upload(fileName, file, { contentType: file.type });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('venue-photos')
          .getPublicUrl(fileName);

        newPhotos.push({
          url: publicUrl,
          width: 800,
          height: 600,
          isGooglePhoto: false,
        });
      }

      const { error: updateError } = await supabase
        .from('venues')
        .update({ photos: newPhotos as any, image_url: newPhotos[0]?.url || null })
        .eq('id', venueId);

      if (updateError) throw updateError;

      toast({ title: 'Fotos hochgeladen', description: 'Ihre Venue-Fotos wurden aktualisiert.' });
      onPhotosUpdated();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Fehler', description: error.message || 'Upload fehlgeschlagen', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (index: number) => {
    setDeletingIndex(index);
    try {
      const photo = existingPhotos[index];
      // Try to delete from storage if it's our photo
      if (!photo.isGooglePhoto && photo.url.includes('venue-photos')) {
        const path = photo.url.split('/venue-photos/')[1];
        if (path) {
          await supabase.storage.from('venue-photos').remove([path]);
        }
      }

      const updatedPhotos = existingPhotos.filter((_, i) => i !== index);
      const { error } = await supabase
        .from('venues')
        .update({ photos: updatedPhotos as any, image_url: updatedPhotos[0]?.url || null })
        .eq('id', venueId);

      if (error) throw error;
      toast({ title: 'Foto gelöscht' });
      onPhotosUpdated();
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
      setDeletingIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Venue-Fotos
        </h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="gap-1.5"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploading ? 'Lädt...' : 'Hochladen'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {existingPhotos.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <Camera className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Klicken Sie hier, um Fotos hochzuladen</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Max. 5MB pro Foto · JPG, PNG, WebP</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {existingPhotos.map((photo, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
              <img src={photo.url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
              {!photo.isGooglePhoto && (
                <button
                  onClick={() => handleDelete(index)}
                  disabled={deletingIndex === index}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {deletingIndex === index ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                </button>
              )}
              {photo.isGooglePhoto && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1 py-0.5 text-center">
                  Google
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {partnerPhotos.length} eigene · {externalPhotos.length} externe Fotos
      </p>
    </div>
  );
};

export default VenuePhotoUpload;
