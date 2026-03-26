import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, Calendar, Heart, Camera, Brain, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VenueData {
  id: string;
  name: string;
  seasonal_specials?: any;
  best_times?: any;
  pair_friendly_features?: string[] | null;
  photos?: any[];
  tags?: string[] | null;
  has_separee?: boolean | null;
  capacity?: number | null;
}

interface VenueOptimizationNudgesProps {
  venues: VenueData[];
  onOpenVenue: (venueId: string, tab: string) => void;
}

interface Nudge {
  venueId: string;
  venueName: string;
  icon: typeof Calendar;
  title: string;
  description: string;
  impact: string;
  tab: string;
  priority: number;
}

export default function VenueOptimizationNudges({ venues, onOpenVenue }: VenueOptimizationNudgesProps) {
  const nudges: Nudge[] = [];

  for (const venue of venues) {
    // Check seasonal specials
    const specials = venue.seasonal_specials;
    const hasActiveSpecials = Array.isArray(specials) && specials.length > 0;
    if (!hasActiveSpecials) {
      nudges.push({
        venueId: venue.id,
        venueName: venue.name,
        icon: Calendar,
        title: 'Saisonale Specials fehlen',
        description: `Füge z.B. "Winterterrasse" oder "Sommergarten" für ${venue.name} hinzu`,
        impact: '+8% Matching-Boost',
        tab: 'seasonal',
        priority: 3,
      });
    }

    // Check pair-friendly features
    const pairFeatures = venue.pair_friendly_features || [];
    if (pairFeatures.length === 0 && !venue.has_separee) {
      nudges.push({
        venueId: venue.id,
        venueName: venue.name,
        icon: Heart,
        title: 'Paar-Features ausfüllen',
        description: `Separée, Kapazität und romantische Zeiten für ${venue.name} angeben`,
        impact: '+15% bei Date-Suchen',
        tab: 'besttimes',
        priority: 2,
      });
    }

    // Check photos with vibe tags
    const photos = Array.isArray(venue.photos) ? venue.photos : [];
    const photosWithVibes = photos.filter((p: any) => p?.vibeTags && p.vibeTags.length > 0);
    if (photos.length > 0 && photosWithVibes.length === 0) {
      nudges.push({
        venueId: venue.id,
        venueName: venue.name,
        icon: Camera,
        title: 'Foto-Vibes taggen',
        description: `${photos.length} Fotos von ${venue.name} haben noch keine Vibe-Tags`,
        impact: '+12% Atmosphären-Match',
        tab: 'photos',
        priority: 1,
      });
    }

    // Check AI tags
    const tags = venue.tags || [];
    if (tags.length < 3) {
      nudges.push({
        venueId: venue.id,
        venueName: venue.name,
        icon: Brain,
        title: 'Mehr Tags hinzufügen',
        description: `${venue.name} hat nur ${tags.length} Tags — mehr Tags = bessere Matches`,
        impact: 'Bessere Sichtbarkeit',
        tab: 'ai-tags',
        priority: 0,
      });
    }
  }

  // Sort by priority (highest first) and limit
  const topNudges = nudges.sort((a, b) => b.priority - a.priority).slice(0, 4);

  if (topNudges.length === 0) return null;

  return (
    <Card variant="glass" className="border-primary/20">
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-sm">Optimierungstipps</h3>
          <Badge variant="secondary" className="text-[10px]">{topNudges.length}</Badge>
        </div>

        <AnimatePresence>
          {topNudges.map((nudge, i) => (
            <motion.div
              key={`${nudge.venueId}-${nudge.tab}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <nudge.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{nudge.title}</p>
                <p className="text-xs text-muted-foreground truncate">{nudge.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="outline" className="text-[9px] hidden sm:inline-flex">{nudge.impact}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7"
                  onClick={() => onOpenVenue(nudge.venueId, nudge.tab)}
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
