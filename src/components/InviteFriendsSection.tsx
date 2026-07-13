import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Mail, MessageCircle, Send, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OfflineGuardButton } from '@/components/OfflineGuardButton';
import { useReferral } from '@/hooks/useReferral';

const InviteFriendsSection: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { referralLink, copyReferralLink } = useReferral();
  const [copied, setCopied] = useState(false);

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
    </div>
  );
};

export default InviteFriendsSection;