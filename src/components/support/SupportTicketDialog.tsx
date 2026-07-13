import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { LifeBuoy, Loader2, Send } from 'lucide-react';

const CATEGORIES = ['general', 'bug', 'account', 'payment', 'partner', 'feature', 'other'] as const;
type Category = (typeof CATEGORIES)[number];

interface SupportTicketDialogProps {
  trigger?: React.ReactNode;
}

const SupportTicketDialog: React.FC<SupportTicketDialogProps> = ({ trigger }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setCategory('general');
    setSubject('');
    setMessage('');
  };

  const handleSubmit = async () => {
    if (!user) return;
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    if (!trimmedSubject || !trimmedMessage) {
      toast({
        title: t('support.ticket.validationTitle', 'Bitte alle Felder ausfüllen'),
        description: t('support.ticket.validationDesc', 'Betreff und Nachricht dürfen nicht leer sein.'),
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('support_tickets').insert({
      user_id: user.id,
      category,
      subject: trimmedSubject.slice(0, 200),
      message: trimmedMessage.slice(0, 4000),
      contact_email: user.email ?? null,
    });
    setSubmitting(false);

    if (error) {
      toast({
        title: t('support.ticket.errorTitle', 'Ticket konnte nicht gesendet werden'),
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    // Fire-and-forget: notify the support inbox about the new ticket.
    // Never block the user flow or surface errors — the ticket is already saved.
    supabase.functions
      .invoke('send-transactional-email', {
        body: {
          templateName: 'support-ticket-notification',
          templateData: {
            category,
            subject: trimmedSubject.slice(0, 200),
            message: trimmedMessage.slice(0, 4000),
            contactEmail: user.email ?? null,
            createdAt: new Date().toLocaleString('de-DE', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            }),
          },
        },
      })
      .catch((err) => console.error('Support notification email failed:', err));

    toast({
      title: t('support.ticket.successTitle', 'Ticket gesendet'),
      description: t('support.ticket.successDesc', 'Wir melden uns so schnell wie möglich bei dir.'),
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" className="w-full border-border text-foreground hover:bg-accent/50">
            <LifeBuoy className="w-4 h-4 mr-2" />
            {t('support.ticket.openButton', 'Ticket erstellen')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-primary" />
            {t('support.ticket.title', 'Support-Ticket')}
          </DialogTitle>
          <DialogDescription>
            {t('support.ticket.desc', 'Beschreibe dein Anliegen – wir kümmern uns darum.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm">{t('support.ticket.categoryLabel', 'Kategorie')}</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {t(`support.ticket.categories.${c}`, c)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">{t('support.ticket.subjectLabel', 'Betreff')}</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              placeholder={t('support.ticket.subjectPlaceholder', 'Kurze Zusammenfassung')}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">{t('support.ticket.messageLabel', 'Nachricht')}</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={4000}
              rows={5}
              placeholder={t('support.ticket.messagePlaceholder', 'Beschreibe dein Anliegen möglichst genau …')}
            />
            <p className="text-xs text-muted-foreground text-right">{message.length}/4000</p>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto">
            {submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {t('support.ticket.submit', 'Ticket senden')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SupportTicketDialog;