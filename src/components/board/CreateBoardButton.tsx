import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  createSharedBoard,
  buildBoardShareUrl,
  type SharedBoardVenue,
} from '@/services/sharedBoardService';

interface CreateBoardButtonProps {
  venues: SharedBoardVenue[];
  defaultTitle?: string;
  city?: string | null;
  className?: string;
  size?: 'sm' | 'default';
}

const CreateBoardButton: React.FC<CreateBoardButtonProps> = ({
  venues,
  defaultTitle,
  city,
  className,
  size = 'sm',
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(defaultTitle || '');
  const [note, setNote] = useState('');
  const [creating, setCreating] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleOpen = () => {
    if (!user) {
      toast({ title: t('board.loginRequired') });
      return;
    }
    if (venues.length === 0) {
      toast({ title: t('board.noVenues') });
      return;
    }
    setTitle(defaultTitle || t('board.defaultTitle'));
    setOpen(true);
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const board = await createSharedBoard({
        title: title.trim() || t('board.defaultTitle'),
        city: city ?? null,
        note: note.trim() || null,
        venues,
        expiresInDays: 30,
      });
      setLink(buildBoardShareUrl(board.slug));
    } catch {
      toast({ title: t('board.createFailed'), variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleShare = async () => {
    if (!link) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: title || t('board.defaultTitle'), url: link });
        return;
      }
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: t('board.linkCopied') });
    } catch {
      /* user cancelled */
    }
  };

  const handleClose = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setLink(null);
      setNote('');
    }
  };

  return (
    <>
      <Button variant="outline" size={size} onClick={handleOpen} className={className}>
        <Share2 className="w-4 h-4 mr-2" />
        {t('board.createButton')}
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('board.dialogTitle')}</DialogTitle>
            <DialogDescription>{t('board.dialogDescription')}</DialogDescription>
          </DialogHeader>

          {!link ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="board-title" className="text-sm text-muted-foreground">
                  {t('board.titleLabel')}
                </label>
                <Input
                  id="board-title"
                  value={title}
                  maxLength={120}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="board-note" className="text-sm text-muted-foreground">
                  {t('board.noteLabel')}
                </label>
                <Textarea
                  id="board-note"
                  value={note}
                  maxLength={300}
                  placeholder={t('board.notePlaceholder')}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">{t('board.privacyHint')}</p>
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {t('board.createConfirm')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-sm break-all">
                {link}
              </div>
              <Button onClick={handleShare} className="w-full">
                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {t('board.shareNow')}
              </Button>
              <p className="text-xs text-muted-foreground">{t('board.expiryHint')}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateBoardButton;
