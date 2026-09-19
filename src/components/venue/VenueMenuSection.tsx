import React from 'react';
import { useTranslation } from 'react-i18next';
import { UtensilsCrossed, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isPureFoodVenue, passesFoodIntentFilter } from '@/lib/situationalCategories';

interface VenueMenuSectionProps {
  venue: {
    name?: string | null;
    description?: string | null;
    cuisine_type?: string | null;
    tags?: string[] | null;
    venue_type?: string | null;
  };
  menuHighlights?: string[] | null;
  menuUrl?: string | null;
  websiteUrl?: string | null;
  googleMapsUrl: string;
}

/**
 * "Speisekarte" block – only rendered for gastronomic venues.
 * Shows partner-maintained menu highlights and a link to the actual menu
 * (venue menu URL → website → Google Maps entry as last resort).
 */
export const VenueMenuSection: React.FC<VenueMenuSectionProps> = ({
  venue,
  menuHighlights,
  menuUrl,
  websiteUrl,
  googleMapsUrl,
}) => {
  const { t } = useTranslation();

  const isFoodVenue = isPureFoodVenue(venue) && passesFoodIntentFilter(venue);
  if (!isFoodVenue) return null;

  const highlights = (menuHighlights || []).filter(Boolean);
  const linkUrl = menuUrl || websiteUrl || googleMapsUrl;
  const linkLabel = menuUrl || websiteUrl ? t('venue.menu.viewMenu') : t('venue.menu.searchMenu');

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-border/50 mb-4">
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <UtensilsCrossed className="w-4 h-4 text-primary" />
        {t('venue.menu.title')}
      </h3>

      {highlights.length > 0 ? (
        <ul className="space-y-2 mb-4">
          {highlights.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex items-start gap-2 rounded-lg border border-border/50 bg-background/40 px-3 py-2 text-sm text-foreground"
            >
              <span aria-hidden>🍴</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground mb-4">{t('venue.menu.empty')}</p>
      )}

      <Button variant="outline" className="w-full h-11 gap-2" asChild>
        <a href={linkUrl} target="_blank" rel="noopener noreferrer">
          {linkLabel}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </Button>
    </div>
  );
};

export default VenueMenuSection;
