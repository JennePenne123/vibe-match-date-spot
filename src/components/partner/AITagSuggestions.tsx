import React, { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Check, X, Loader2, Brain, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TagSuggestion {
  tag: string;
  confidence: number;
  reason: string;
  sourceCount: number;
}

interface AITagSuggestionsProps {
  venueId: string;
  venueName: string;
  existingTags: string[];
  onTagsUpdated: () => void;
}

export default function AITagSuggestions({ venueId, venueName, existingTags, onTagsUpdated }: AITagSuggestionsProps) {
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [stats, setStats] = useState<{ analyzedUsers: number; analyzedDates: number } | null>(null);
  const [acceptingTag, setAcceptingTag] = useState<string | null>(null);
  const [dismissedTags, setDismissedTags] = useState<Set<string>>(new Set());

  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Nicht eingeloggt');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/learn-venue-tags`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ venue_id: venueId }),
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Analyse fehlgeschlagen');
      }

      const data = await response.json();
      setSuggestions(data.suggestions || []);
      setStats({ analyzedUsers: data.analyzedUsers || 0, analyzedDates: data.analyzedDates || 0 });
      setAnalyzed(true);

      if (data.suggestions?.length === 0) {
        toast({ title: 'Keine neuen Vorschläge', description: data.message || 'Alle relevanten Tags sind bereits gesetzt.' });
      }
    } catch (error: any) {
      console.error('Tag learning error:', error);
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [venueId, toast]);

  const acceptTag = async (tag: string) => {
    setAcceptingTag(tag);
    try {
      const updatedTags = [...existingTags, tag];
      const { error } = await supabase
        .from('venues')
        .update({ tags: updatedTags })
        .eq('id', venueId);

      if (error) throw error;

      setSuggestions(prev => prev.filter(s => s.tag !== tag));
      toast({ title: 'Tag hinzugefügt', description: `"${tag}" wurde zu ${venueName} hinzugefügt.` });
      onTagsUpdated();
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
      setAcceptingTag(null);
    }
  };

  const dismissTag = (tag: string) => {
    setDismissedTags(prev => new Set([...prev, tag]));
    setSuggestions(prev => prev.filter(s => s.tag !== tag));
  };

  const visibleSuggestions = suggestions.filter(s => !dismissedTags.has(s.tag));

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Brain className="w-4 h-4 text-primary" />
            KI-Tag-Vorschläge
          </CardTitle>
          <Button
            size="sm"
            variant={analyzed ? 'outline' : 'default'}
            onClick={fetchSuggestions}
            disabled={loading}
            className="text-xs h-7 gap-1.5"
          >
            {loading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            {loading ? 'Analysiere...' : analyzed ? 'Erneut prüfen' : 'Feedback analysieren'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!analyzed && !loading && (
          <p className="text-xs text-muted-foreground">
            Analysiert Feedback zufriedener Gäste und schlägt neue Tags vor, die dein KI-Matching verbessern.
          </p>
        )}

        {stats && (
          <div className="flex gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {stats.analyzedDates} Dates analysiert
            </span>
            <span>{stats.analyzedUsers} zufriedene Gäste</span>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {visibleSuggestions.map((suggestion) => (
            <motion.div
              key={suggestion.tag}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, height: 0 }}
              className="flex items-start gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/50"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {suggestion.tag}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {Math.round(suggestion.confidence * 100)}% Konfidenz
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {suggestion.reason}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-primary hover:bg-primary/10"
                  onClick={() => acceptTag(suggestion.tag)}
                  disabled={acceptingTag === suggestion.tag}
                >
                  {acceptingTag === suggestion.tag ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => dismissTag(suggestion.tag)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {analyzed && visibleSuggestions.length === 0 && (
          <div className="text-center py-3">
            <Check className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Alle Tags sind aktuell!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
