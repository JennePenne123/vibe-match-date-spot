import { useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { Star, MapPin, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface ShareCardData {
  type: 'venue' | 'date-experience';
  venueName: string;
  venueImage?: string;
  rating?: number;
  address?: string;
  tags?: string[];
  matchScore?: number;
  dateTitle?: string;
  dateMessage?: string;
}

interface ShareCardGeneratorProps {
  data: ShareCardData;
  onGenerated?: (blob: Blob) => void;
}

/**
 * Hidden card rendered off-screen, captured via html2canvas.
 * Call generateImage() via the returned ref to produce a Blob.
 */
export function useShareCardCapture() {
  const cardRef = useRef<HTMLDivElement>(null);

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        width: 400,
        height: 500,
      });
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
    } catch (err) {
      console.error('Share card generation failed:', err);
      return null;
    }
  }, []);

  return { cardRef, generateImage };
}

export default function ShareCard({ data }: ShareCardGeneratorProps) {
  const fallbackImage = 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=400&fit=crop';

  return (
    <div
      className="w-[400px] h-[500px] relative overflow-hidden rounded-2xl"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Background image */}
      <img
        src={data.venueImage || fallbackImage}
        alt={data.venueName}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = fallbackImage;
        }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

      {/* VybePulse branding top */}
      <div className="absolute top-5 left-5 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-white/90 font-semibold text-sm tracking-wide">VybePulse</span>
      </div>

      {/* Match score badge */}
      {data.matchScore && data.matchScore > 0 && (
        <div className="absolute top-5 right-5">
          <div className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full">
            {data.matchScore}% Match
          </div>
        </div>
      )}

      {/* Content bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
        {/* Type label */}
        <div className="text-primary text-xs font-semibold uppercase tracking-wider">
          {data.type === 'date-experience' ? '💜 Date-Erlebnis' : '📍 Venue-Empfehlung'}
        </div>

        {/* Date title if experience */}
        {data.type === 'date-experience' && data.dateTitle && (
          <p className="text-white/80 text-sm">{data.dateTitle}</p>
        )}

        {/* Venue name */}
        <h2 className="text-white text-2xl font-bold leading-tight">{data.venueName}</h2>

        {/* Rating + Address row */}
        <div className="flex items-center gap-4">
          {data.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-white font-semibold text-sm">{data.rating}</span>
            </div>
          )}
          {data.address && (
            <div className="flex items-center gap-1 text-white/70 text-sm">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate max-w-[220px]">{data.address}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Date message */}
        {data.type === 'date-experience' && data.dateMessage && (
          <p className="text-white/70 text-sm italic line-clamp-2">"{data.dateMessage}"</p>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-white/20">
          <p className="text-white/50 text-xs">Entdecke mehr auf vybepulse.app</p>
        </div>
      </div>
    </div>
  );
}