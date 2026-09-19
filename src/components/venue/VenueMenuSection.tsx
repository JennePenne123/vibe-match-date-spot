import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UtensilsCrossed, ExternalLink, AlertTriangle, Flag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { isPureFoodVenue, passesFoodIntentFilter } from '@/lib/situationalCategories';

interface VenueMenuSectionProps {
  venue: {
    id?: string | null;
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
  /** When the menu data was last touched – drives the "possibly outdated" hint. */
  menuUpdatedAt?: string | null;
}

const STALE_AFTER_DAYS = 90;

/**
 * "Speisekarte" block – only rendered for gastronomic venues.
 * Shows partner-maintained menu highlights, a freshness hint when the data is
 * older than 90 days, a link to the actual menu and a report dialog.
 */
export const VenueMenuSection: React.FC<VenueMenuSectionProps> = ({
  venue,
  menuHighlights,
  menuUrl,
  websiteUrl,
  googleMapsUrl,
  menuUpdatedAt,
}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportText, setReportText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isFoodVenue = isPureFoodVenue(venue) && passesFoodIntentFilter(venue);
  if (!isFoodVenue) return null;

  const highlights = (menuHighlights || []).filter(Boolean);
  const linkUrl = menuUrl || websiteUrl || googleMapsUrl;
  const linkLabel = menuUrl || websiteUrl ? t('venue.menu.viewMenu') : t('venue.menu.searchMenu');

  const updatedDate = menuUpdatedAt ? new Date(menuUpdatedAt) : null;
  const validDate = updatedDate && !Number.isNaN(updatedDate.getTime()) ? updatedDate : null;
  const ageDays = validDate ? (Date.now() - validDate.getTime()) / 86_400_000 : null;
  const isStale = highlights.length > 0 && (ageDays === null || ageDays > STALE_AFTER_DAYS);
  const formattedDate = validDate
    ? validDate.toLocaleDateString(i18n.language, { day: '2-digit', month: '2-digit', year: 'numeric' })
    : null;

  const handleReport = async () => {
    const trimmed = reportText.trim();
    if (!trimmed) {
      toast.error(t('venue.menu.report.validation'));
      return;
    }
    if (!user) {
      toast.error(t('venue.menu.report.loginRequired'));
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('support_tickets').insert({
      user_id: user.id,
      category: 'other',
      subject: `Speisekarte melden: ${venue.name ?? venue.id ?? 'Unbekannt'}`.slice(0, 200),
      message: `Venue-ID: ${venue.id ?? '-'}\n\n${trimmed}`.slice(0, 4000),
      contact_email: user.email ?? null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(t('venue.menu.report.error'));
      return;
    }
    setReportText('');
    setReportOpen(false);
    toast.success(t('venue.menu.report.success'));
  };

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

      {isStale && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-500">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            {formattedDate
              ? t('venue.menu.staleWithDate', { date: formattedDate })
              : t('venue.menu.stale')}
          </span>
        </div>
      )}

      <Button variant="outline" className="w-full h-11 gap-2" asChild>
        <a href={linkUrl} target="_blank" rel="noopener noreferrer">
          {linkLabel}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </Button>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" className="w-full h-11 gap-2 mt-2 text-muted-foreground">
            <Flag className="w-3.5 h-3.5" />
            {t('venue.menu.report.trigger')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('venue.menu.report.title')}</DialogTitle>
            <DialogDescription>{t('venue.menu.report.description')}</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reportText}
            onChange={(e) => setReportText(e.target.value)}
            placeholder={t('venue.menu.report.placeholder')}
            rows={5}
            maxLength={1000}
          />
          <DialogFooter>
            <Button onClick={handleReport} disabled={submitting} className="gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('venue.menu.report.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VenueMenuSection;
