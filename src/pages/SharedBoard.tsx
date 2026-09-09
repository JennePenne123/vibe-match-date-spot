import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Heart, MapPin, Sparkles, Share2, Check, Eye, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { getVenueFallbackImage } from '@/utils/venueImageFallback';
import {
  fetchSharedBoard,
  fetchBoardVotes,
  castBoardVote,
  withdrawBoardVote,
  registerBoardView,
  getVoterKey,
  getVoterName,
  setVoterName,
  buildBoardUrl,
  type SharedBoard as SharedBoardType,
  type SharedBoardVote,
} from '@/services/sharedBoardService';

const SharedBoard: React.FC = () => {
  const { slug = '' } = useParams<{ slug: string }>();
  const { t } = useTranslation();

  const [board, setBoard] = useState<SharedBoardType | null>(null);
  const [votes, setVotes] = useState<SharedBoardVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(getVoterName());
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const voterKey = useMemo(() => getVoterKey(), []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const found = await fetchSharedBoard(slug);
        if (cancelled) return;
        setBoard(found);
        if (found) {
          void registerBoardView(slug);
          const boardVotes = await fetchBoardVotes(found.id);
          if (!cancelled) setVotes(boardVotes);
        }
      } catch {
        if (!cancelled) setBoard(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (slug) void load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const votesByVenue = useMemo(() => {
    const map = new Map<string, SharedBoardVote[]>();
    votes.forEach((vote) => {
      const list = map.get(vote.venue_key) || [];
      list.push(vote);
      map.set(vote.venue_key, list);
    });
    return map;
  }, [votes]);

  const handleVote = async (venueKey: string) => {
    if (!board) return;
    const mine = votesByVenue.get(venueKey)?.some((v) => v.voter_key === voterKey);
    setBusyKey(venueKey);
    try {
      if (mine) {
        await withdrawBoardVote({ boardId: board.id, venueKey });
      } else {
        if (name.trim()) setVoterName(name.trim());
        await castBoardVote({ boardId: board.id, venueKey, voterName: name.trim() || undefined });
      }
      setVotes(await fetchBoardVotes(board.id));
    } catch {
      toast({ title: t('board.voteFailed'), variant: 'destructive' });
    } finally {
      setBusyKey(null);
    }
  };

  const handleShare = async () => {
    const url = buildBoardUrl(slug);
    const shareData = {
      title: board?.title || t('board.defaultTitle'),
      text: t('board.shareText', { title: board?.title || '' }),
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: t('board.linkCopied') });
    } catch {
      /* user cancelled */
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <EmptyState
          icon={Sparkles}
          title={t('board.notFoundTitle')}
          description={t('board.notFoundDescription')}
          actionLabel={t('board.discoverCta')}
          onAction={() => { window.location.href = '/'; }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-border/60">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
            <span className="text-primary">H!</span>Outz
          </Link>
          <Button size="sm" variant="outline" onClick={handleShare} className="gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {t('board.share')}
          </Button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-foreground">{board.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            {board.city && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {board.city}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {t('board.views', { count: board.view_count })}
            </span>
          </div>
          {board.note && <p className="mt-3 text-sm text-foreground/80">{board.note}</p>}
        </motion.section>

        <div className="mb-5">
          <label htmlFor="board-voter-name" className="text-sm text-muted-foreground">
            {t('board.nameLabel')}
          </label>
          <Input
            id="board-voter-name"
            value={name}
            maxLength={40}
            placeholder={t('board.namePlaceholder')}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>

        <ul className="space-y-4">
          {board.venues.map((venue, index) => {
            const venueVotes = votesByVenue.get(venue.key) || [];
            const mine = venueVotes.some((v) => v.voter_key === voterKey);
            const voterNames = venueVotes
              .map((v) => v.voter_name)
              .filter((n): n is string => Boolean(n));

            return (
              <motion.li
                key={venue.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl overflow-hidden border border-border/60 bg-card"
              >
                <img
                  src={venue.image || getVenueFallbackImage({ id: venue.key, name: venue.name, cuisine_type: venue.cuisine })}
                  alt={venue.name}
                  loading="lazy"
                  className="h-40 w-full object-cover"
                />
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold text-foreground">{venue.name}</h2>
                      {venue.address && (
                        <p className="text-sm text-muted-foreground">{venue.address}</p>
                      )}
                    </div>
                    {typeof venue.score === 'number' && (
                      <span className="shrink-0 rounded-full bg-primary/15 text-primary text-xs font-semibold px-2.5 py-1">
                        {Math.round(venue.score)}%
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {venue.cuisine && <span>{venue.cuisine}</span>}
                    {venue.priceRange && <span>{venue.priceRange}</span>}
                    {typeof venue.rating === 'number' && (
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-accent" />
                        {venue.rating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {venue.reason && <p className="text-sm text-foreground/75">{venue.reason}</p>}

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <Button
                      size="sm"
                      variant={mine ? 'default' : 'outline'}
                      disabled={busyKey === venue.key}
                      onClick={() => handleVote(venue.key)}
                      className="gap-2"
                    >
                      <Heart className={`w-4 h-4 ${mine ? 'fill-current' : ''}`} />
                      {mine ? t('board.voted') : t('board.vote')}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {t('board.voteCount', { count: venueVotes.length })}
                      {voterNames.length > 0 && ` · ${voterNames.slice(0, 3).join(', ')}`}
                    </span>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>

        <div className="mt-8 rounded-2xl border border-border/60 bg-card p-5 text-center">
          <p className="text-sm text-muted-foreground">{t('board.ctaText')}</p>
          <Button asChild className="mt-3">
            <Link to="/">{t('board.ctaButton')}</Link>
          </Button>
        </div>
      </main>
    </div>
  );
};

export default SharedBoard;
