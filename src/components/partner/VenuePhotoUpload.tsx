import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Camera, X, Upload, Loader2 } from 'lucide-react';
import { PhotoVibeTagSelector } from './PhotoVibeTagSelector';

interface VenuePhoto {
  url: string;
  width: number;
  height: number;
  isGooglePhoto: boolean;
  vibeTags?: string[];
}

interface VenuePhotoUploadProps {
  venueId: string;
  existingPhotos: Array<VenuePhoto>;
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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pendingVibeTags, setPendingVibeTags] = useState<string[]>([]);

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
          vibeTags: [],
        });
      }

      const { error: updateError } = await supabase
        .from('venues')
        .update({ photos: newPhotos as any, image_url: newPhotos[0]?.url || null })
        .eq('id', venueId);

      if (updateError) throw updateError;

      toast({ title: 'Fotos hochgeladen', description: 'Taggen Sie jetzt die Atmosphäre für besseres KI-Matching.' });
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

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setPendingVibeTags(existingPhotos[index]?.vibeTags || []);
  };

  const saveVibeTags = async () => {
    if (editingIndex === null) return;
    try {
      const updatedPhotos = existingPhotos.map((p, i) =>
        i === editingIndex ? { ...p, vibeTags: pendingVibeTags } : p
      );
      const { error } = await supabase
        .from('venues')
        .update({ photos: updatedPhotos as any })
        .eq('id', venueId);

      if (error) throw error;
      toast({ title: 'Atmosphäre-Tags gespeichert', description: 'KI-Matching wird dadurch verbessert.' });
      setEditingIndex(null);
      onPhotosUpdated();
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Venue-Fotos & Atmosphäre
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
            <div
              key={index}
              className={`relative group aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer ${
                editingIndex === index ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => !photo.isGooglePhoto && startEditing(index)}
            >
              <img src={photo.url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
              {/* Vibe tag indicator */}
              {photo.vibeTags && photo.vibeTags.length > 0 && (
                <div className="absolute top-1 left-1 bg-primary/80 text-primary-foreground rounded-full px-1.5 py-0.5 text-[9px] font-medium">
                  📸 {photo.vibeTags.length}
                </div>
              )}
              {!photo.isGooglePhoto && !photo.vibeTags?.length && (
                <div className="absolute bottom-0 left-0 right-0 bg-amber-500/80 text-white text-[9px] px-1 py-0.5 text-center">
                  Tippen zum Taggen
                </div>
              )}
              {!photo.isGooglePhoto && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(index); }}
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

      {/* Vibe Tag Editor for selected photo */}
      {editingIndex !== null && (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Foto {editingIndex + 1} — Atmosphäre</p>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditingIndex(null)} className="text-xs h-7">
                Abbrechen
              </Button>
              <Button size="sm" onClick={saveVibeTags} className="text-xs h-7">
                Speichern
              </Button>
            </div>
          </div>
          <PhotoVibeTagSelector
            selectedTags={pendingVibeTags}
            onTagsChange={setPendingVibeTags}
          />
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {partnerPhotos.length} eigene · {externalPhotos.length} externe Fotos · {
          partnerPhotos.filter(p => p.vibeTags && p.vibeTags.length > 0).length
        } getaggt
      </p>
    </div>
  );
};

export default VenuePhotoUpload;
