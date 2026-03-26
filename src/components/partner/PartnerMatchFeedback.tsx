import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Lightbulb, TrendingUp, TrendingDown, CheckCircle2,
  AlertTriangle, Tag, Camera, Clock, Star, Users, Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface VenueMatchInsight {
  venueId: string;
  venueName: string;
  matchCount: number;
  missedCount: number;
  profileCompleteness: number;
  missingFields: string[];
  topMatchReasons: string[];
  improvementTips: string[];
}

interface PartnerMatchFeedbackProps {
  partnerId: string;
}

const FIELD_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  tags: { label: 'Tags & Keywords', icon: Tag },
  photos: { label: 'Fotos', icon: Camera },
  opening_hours: { label: 'Öffnungszeiten', icon: Clock },
  best_times: { label: 'Beste Zeiten', icon: Clock },
  description: { label: 'Beschreibung', icon: Lightbulb },
  menu_highlights: { label: 'Speisekarte', icon: Star },
  capacity: { label: 'Kapazität', icon: Users },
  pair_friendly_features: { label: 'Paar-Features', icon: Sparkles },
};

export default function PartnerMatchFeedback({ partnerId }: PartnerMatchFeedbackProps) {
  const [insights, setInsights] = useState<VenueMatchInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsights();
  }, [partnerId]);

  const fetchInsights = async () => {
    try {
      // Get partner's venues
      const { data: partnerships } = await supabase
        .from('venue_partnerships')
        .select('venue_id')
        .eq('partner_id', partnerId)
        .eq('status', 'approved');

      if (!partnerships || partnerships.length === 0) {
        setLoading(false);
        return;
      }

      const venueIds = partnerships.map(p => p.venue_id);

      // Fetch venue details and matching data
      const [venuesRes, matchedRes, feedbackRes] = await Promise.all([
        supabase.from('venues').select('id, name, tags, photos, opening_hours, description, menu_highlights, best_times, capacity, pair_friendly_features').in('id', venueIds),
        supabase.from('date_invitations').select('id, venue_id').in('venue_id', venueIds),
        supabase.from('date_feedback').select('invitation_id, venue_rating').not('venue_rating', 'is', null),
      ]);

      const venueInsights: VenueMatchInsight[] = [];

      venuesRes.data?.forEach(venue => {
        // Calculate profile completeness
        const fields = ['tags', 'photos', 'opening_hours', 'description', 'menu_highlights', 'best_times', 'capacity', 'pair_friendly_features'];
        const missing: string[] = [];

        fields.forEach(field => {
          const val = (venue as any)[field];
          if (val === null || val === undefined) {
            missing.push(field);
          } else if (Array.isArray(val) && val.length === 0) {
            missing.push(field);
          } else if (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0) {
            missing.push(field);
          }
        });

        const completeness = Math.round(((fields.length - missing.length) / fields.length) * 100);
        const matchCount = matchedRes.data?.filter(m => m.venue_id === venue.id).length || 0;

        // Generate tips based on missing fields
        const tips: string[] = [];
        if (missing.includes('best_times')) {
          tips.push('Hinterlege "Beste Zeiten", damit die KI dein Venue zur richtigen Stimmung empfehlen kann.');
        }
        if (missing.includes('tags') || ((venue.tags as string[] | null)?.length || 0) < 3) {
          tips.push('Mehr Tags = besseres Matching. Nutze den KI-Profil-Wizard für schnelle Eingabe.');
        }
        if (missing.includes('photos') || ((venue.photos as any[] | null)?.length || 0) < 2) {
          tips.push('Venues mit 3+ Fotos werden 40% häufiger vorgeschlagen.');
        }
        if (missing.includes('pair_friendly_features')) {
          tips.push('Markiere Paar-freundliche Features (Kerzenlicht, Ecktische) für besseres Date-Matching.');
        }
        if (missing.includes('capacity')) {
          tips.push('Die Kapazitätsangabe hilft der KI, überfüllte Venues zu vermeiden.');
        }
        if (missing.includes('description')) {
          tips.push('Eine gute Beschreibung erhöht die Klickrate auf dein Venue um bis zu 25%.');
        }

        // Generate match reasons
        const reasons: string[] = [];
        const tags = (venue.tags as string[] | null) || [];
        if (tags.includes('romantisch') || tags.includes('intimate')) reasons.push('Romantische Atmosphäre');
        if (tags.includes('fine dining') || tags.includes('tasting')) reasons.push('Gehobene Küche');
        if (tags.includes('outdoor') || tags.includes('rooftop')) reasons.push('Outdoor-Location');
        if (tags.includes('live music')) reasons.push('Live-Entertainment');
        if (tags.length > 5) reasons.push(`${tags.length} relevante Tags`);
        if (matchCount > 0) reasons.push(`${matchCount}x für Dates vorgeschlagen`);

        venueInsights.push({
          venueId: venue.id,
          venueName: venue.name,
          matchCount,
          missedCount: 0,
          profileCompleteness: completeness,
          missingFields: missing,
          topMatchReasons: reasons.slice(0, 3),
          improvementTips: tips.slice(0, 3),
        });
      });

      // Sort by completeness (lowest first = needs most attention)
      venueInsights.sort((a, b) => a.profileCompleteness - b.profileCompleteness);
      setInsights(venueInsights);
    } catch (error) {
      console.error('Error fetching match insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card variant="glass">
        <CardContent className="p-6">
          <div className="h-[120px] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (insights.length === 0) return null;

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          KI-Matching Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((venue, index) => (
          <motion.div
            key={venue.venueId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-3 rounded-xl bg-muted/30 space-y-3"
          >
            {/* Venue header */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold truncate">{venue.venueName}</h4>
              <Badge
                variant={venue.profileCompleteness >= 80 ? 'default' : venue.profileCompleteness >= 50 ? 'secondary' : 'destructive'}
                className="text-[10px]"
              >
                {venue.profileCompleteness}% vollständig
              </Badge>
            </div>

            {/* Progress */}
            <Progress value={venue.profileCompleteness} className="h-1.5" />

            {/* Match reasons */}
            {venue.topMatchReasons.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-primary" />
                  Warum dein Venue gematcht wird:
                </span>
                <div className="flex flex-wrap gap-1">
                  {venue.topMatchReasons.map((reason, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] bg-primary/5">
                      {reason}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement tips */}
            {venue.improvementTips.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  So wirst du häufiger vorgeschlagen:
                </span>
                {venue.improvementTips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Missing fields icons */}
            {venue.missingFields.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {venue.missingFields.map(field => {
                  const info = FIELD_LABELS[field];
                  if (!info) return null;
                  return (
                    <Badge key={field} variant="outline" className="text-[9px] gap-1 text-muted-foreground border-dashed">
                      <info.icon className="w-2.5 h-2.5" />
                      {info.label}
                    </Badge>
                  );
                })}
              </div>
            )}
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
