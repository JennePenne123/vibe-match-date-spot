import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UtensilsCrossed, ExternalLink, AlertTriangle, Flag, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { isPureFoodVenue, passesFoodIntentFilter } from '@/lib/situationalCategories';

interface VenueMenuSectionProps {
  venueId?: string;
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
  /** ISO timestamp of the last venue data update */
  lastUpdated?: string | null;
}

/** Menu data older than this is flagged as possibly outdated */
const STALE_AFTER_DAYS = 120;

const REPORT_REASONS = [
  { value: 'prices', labelKey: 'venue.menu.report.reasonPrices' },
  { value: 'dishes', labelKey: 'venue.menu.report.reasonDishes' },
  { value: 'missing', labelKey: 'venue.menu.report.reasonMissing' },
  { value: 'other', labelKey: 'venue.menu.report.reasonOther' },
];

/**
 * "Speisekarte" block – only rendered for gastronomic venues.
 * Shows menu highlights, a freshness hint when the data is old and lets
 * users report wrong or changed menu information.
 */
export const VenueMenuSection: React.FC<VenueMenuSectionProps> = ({
  venueId,
  venue,
  menuHighlights,
  menuUrl,
  websiteUrl,
  googleMapsUrl,
  lastUpdated,
}) => {
  const { t, i18n } = useTranslation();
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState<string>('prices');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isFoodVenue = isPureFoodVenue(venue) && passesFoodIntentFilter(venue);
  if (!isFoodVenue) return null;

  const highlights = (menuHighlights || []).filter(Boolean);
  const linkUrl = menuUrl || websiteUrl || googleMapsUrl;
  const linkLabel = menuUrl || websiteUrl ? t('venue.menu.viewMenu') : t('venue.menu.searchMenu');

  const updatedDate = lastUpdated ? new Date(lastUpdated) : null;
  const ageDays = updatedDate ? (Date.now() - updatedDate.getTime()) / 86_400_000 : null;
  const isStale = highlights.length > 0 && ageDays !== null && ageDays > STALE_AFTER_DAYS;
  const updatedLabel = updatedDate
    ? updatedDate.toLocaleDateString(i18n.language, { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

  const submitReport = async () => {
    setSubmitting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        toast.error(t('venue.menu.report.loginRequired'));
        return;
      }
      const reasonLabel = t(REPORT_REASONS.find(r => r.value === reason)?.labelKey || '');
      const { error } = await supabase.from('support_tickets').insert({
        user_id: auth.user.id,
        category: 'other',
        subject: `Speisekarte melden: ${venue.name ?? 'Venue'}`.slice(0, 200),
        message: [
          `Venue: ${venue.name ?? '-'} (${venueId ?? '-'})`,
          `Grund: ${reasonLabel}`,
          details ? `Details: ${details}` : null,
        ]
          .filter(Boolean)
          .join('\n')
          .slice(0, 4000),
      });
      if (error) throw error;
      toast.success(t('venue.menu.report.success'));
      setReportOpen(false);
      setDetails('');
      setReason('prices');
    } catch {
      toast.error(t('venue.menu.report.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-border/50 mb-4">
      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <UtensilsCrossed className="w-4 h-4 text-primary" />
        {t('venue.menu.title')}
      </h3>

      {highlights.length > 0 ? (
        <ul className="space-y-2 mb-3">
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
        <p className="text-sm text-muted-foreground mb-3">{t('venue.menu.empty')}</p>
      )}

      {/* Freshness hint */}
      {isStale ? (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            {t('venue.menu.staleHint')}
            {updatedLabel ? ` ${t('venue.menu.lastUpdated', { date: updatedLabel })}` : ''}
          </span>
        </div>
      ) : (
        <p className="mb-4 text-xs text-muted-foreground">
          {updatedLabel ? t('venue.menu.lastUpdated', { date: updatedLabel }) : t('venue.menu.freshnessNote')}
        </p>
      )}

      <div className="space-y-2">
        <Button variant="outline" className="w-full h-11 gap-2" asChild>
          <a href={linkUrl} target="_blank" rel="noopener noreferrer">
            {linkLabel}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </Button>

        <Dialog open={reportOpen} onOpenChange={setReportOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="w-full h-10 gap-2 text-xs text-muted-foreground">
              <Flag className="w-3.5 h-3.5" />
              {t('venue.menu.report.cta')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{t('venue.menu.report.title')}</DialogTitle>
              <DialogDescription>{t('venue.menu.report.description')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">{t('venue.menu.report.reasonLabel')}</Label>
                <div className="grid gap-2">
                  {REPORT_REASONS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setReason(option.value)}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        reason === option.value
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-background/40 text-muted-foreground hover:bg-muted/40'
                      }`}
                    >
                      {t(option.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="menu-report-details" className="text-sm">
                  {t('venue.menu.report.detailsLabel')}
                </Label>
                <Textarea
                  id="menu-report-details"
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder={t('venue.menu.report.detailsPlaceholder')}
                  className="text-sm"
                />
              </div>

              <Button onClick={submitReport} disabled={submitting} className="w-full gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('venue.menu.report.submit')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default VenueMenuSection;
