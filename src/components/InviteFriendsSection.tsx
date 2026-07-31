import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Mail, MessageCircle, Send, Copy, Check, Users, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { OfflineGuardButton } from '@/components/OfflineGuardButton';
import { useReferral } from '@/hooks/useReferral';

const InviteFriendsSection: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { referralLink, copyReferralLink } = useReferral();
  const [copied, setCopied] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkInput, setBulkInput] = useState('');

  const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/;
  const parsed = React.useMemo(() => {
    const tokens = bulkInput
      .split(/[\s,;\n]+/)
      .map(v => v.trim())
      .filter(Boolean);
    const valid: string[] = [];
    const invalid: string[] = [];
    tokens.forEach(tk => {
      const lower = tk.toLowerCase();
      if (EMAIL_RE.test(lower)) {
        if (!valid.includes(lower)) valid.push(lower);
      } else {
        invalid.push(tk);
      }
    });
    return { valid, invalid };
  }, [bulkInput]);

  const inviteLink = referralLink || window.location.origin;
  const inviteText = t('myFriends.inviteMessage', { link: inviteLink });

  const handleInviteEmail = () => {
    const subject = encodeURIComponent(t('myFriends.inviteEmailSubject', 'Komm zu H!Outz!'));
    const body = encodeURIComponent(inviteText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleInviteWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(inviteText)}`, '_blank', 'noopener,noreferrer');
  };

  const handleInviteTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(inviteText)}`, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = async () => {
    try {
      const success = referralLink ? await copyReferralLink() : false;
      if (!success) await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast({ title: t('myFriends.linkCopied') });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  const MAX_BULK = 50;

  const handleBulkInvite = () => {
    if (parsed.valid.length === 0) return;
    const recipients = parsed.valid.slice(0, MAX_BULK);
    const subject = encodeURIComponent(t('myFriends.inviteEmailSubject', 'Komm zu H!Outz!'));
    const body = encodeURIComponent(inviteText);
    window.location.href = `mailto:?bcc=${encodeURIComponent(recipients.join(','))}&subject=${subject}&body=${body}`;
    toast({
      title: t('myFriends.bulkInviteSent', { count: recipients.length }),
    });
  };

  const handleCopyBulkText = async () => {
    try {
      await navigator.clipboard.writeText(`${parsed.valid.join(', ')}\n\n${inviteText}`);
      toast({ title: t('myFriends.linkCopied') });
    } catch {
      toast({ title: t('common.error'), variant: 'destructive' });
    }
  };

  return (
    <div className="bg-muted/30 rounded-lg border border-border/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{t('myFriends.inviteMore')}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={handleInviteEmail} className="gap-1.5 text-xs">
          <Mail className="w-3.5 h-3.5" />
          E-Mail
        </Button>
        <OfflineGuardButton variant="outline" size="sm" onClick={handleInviteWhatsApp} className="gap-1.5 text-xs text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20">
          <MessageCircle className="w-3.5 h-3.5" />
          WhatsApp
        </OfflineGuardButton>
        <OfflineGuardButton variant="outline" size="sm" onClick={handleInviteTelegram} className="gap-1.5 text-xs text-blue-500 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20">
          <Send className="w-3.5 h-3.5" />
          Telegram
        </OfflineGuardButton>
        <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5 text-xs">
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? t('myFriends.copied') : t('myFriends.copyLink')}
        </Button>
      </div>

      <div className="mt-3 border-t border-border/50 pt-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setBulkOpen(o => !o)}
          className="w-full justify-between gap-1.5 text-xs"
        >
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-primary" />
            {t('myFriends.bulkInviteTitle', 'Mehrere auf einmal einladen')}
          </span>
          {bulkOpen ? <X className="w-3.5 h-3.5" /> : null}
        </Button>

        {bulkOpen && (
          <div className="mt-2 space-y-2">
            <Textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              rows={3}
              placeholder={t('myFriends.bulkInvitePlaceholder', 'anna@mail.de, ben@mail.de ...')}
              className="text-sm"
            />
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="secondary" className="text-[10px]">
                {t('myFriends.bulkInviteValid', { count: parsed.valid.length })}
              </Badge>
              {parsed.invalid.length > 0 && (
                <Badge variant="destructive" className="text-[10px]">
                  {t('myFriends.bulkInviteInvalid', { count: parsed.invalid.length })}
                </Badge>
              )}
              {parsed.valid.length > MAX_BULK && (
                <span className="text-[10px] text-muted-foreground">
                  {t('myFriends.bulkInviteMax', { count: MAX_BULK })}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="wellness"
                size="sm"
                disabled={parsed.valid.length === 0}
                onClick={handleBulkInvite}
                className="gap-1.5 text-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                {t('myFriends.bulkInviteSend', 'Alle einladen')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={parsed.valid.length === 0}
                onClick={handleCopyBulkText}
                className="gap-1.5 text-xs"
              >
                <Copy className="w-3.5 h-3.5" />
                {t('myFriends.bulkInviteCopy', 'Liste + Text kopieren')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteFriendsSection;