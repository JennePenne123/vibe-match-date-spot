
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, ArrowRight, Loader2, User, UsersIcon, Mail, MessageCircle, Send, Copy, Check, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useReferral } from '@/hooks/useReferral';
import { useToast } from '@/hooks/use-toast';

interface Friend {
  id: string;
  name: string;
}

interface PartnerSelectionProps {
  friends: Friend[];
  selectedPartnerId: string;
  selectedPartnerIds: string[];
  dateMode: 'single' | 'group';
  loading: boolean;
  onPartnerChange: (partnerId: string) => void;
  onPartnerIdsChange: (partnerIds: string[]) => void;
  onDateModeChange: (mode: 'single' | 'group') => void;
  onContinue: () => void;
}

const PartnerSelection: React.FC<PartnerSelectionProps> = ({
  friends,
  selectedPartnerId,
  selectedPartnerIds,
  dateMode,
  loading,
  onPartnerChange,
  onPartnerIdsChange,
  onDateModeChange,
  onContinue
}) => {
  const { t } = useTranslation();
  const { referralLink, copyReferralLink } = useReferral();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handlePartnerToggle = (friendId: string, checked: boolean) => {
    if (checked) {
      onPartnerIdsChange([...selectedPartnerIds, friendId]);
    } else {
      onPartnerIdsChange(selectedPartnerIds.filter(id => id !== friendId));
    }
  };

  const maxGroupSize = 5;
  
  const isValidSelection = dateMode === 'single' 
    ? selectedPartnerId 
    : selectedPartnerIds.length > 0 && selectedPartnerIds.length <= maxGroupSize;

  const selectedCount = selectedPartnerIds.length;

  const inviteLink = referralLink || window.location.origin;
  const inviteText = t('myFriends.inviteMessage', { link: inviteLink });

  const handleInviteEmail = () => {
    const subject = encodeURIComponent(t('myFriends.inviteEmailSubject', 'Komm zu HiOutz!'));
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
    <Card variant="elegant" className="border-sage-200/40 dark:border-sage-800/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-sage-100 dark:bg-sage-900/20">
              <Users className="h-5 w-5 text-sage-600 dark:text-sage-400" />
            </div>
            <CardTitle className="text-xl font-semibold">
              {dateMode === 'single' ? t('datePlanning.choosePartner') : t('datePlanning.chooseGroup')}
            </CardTitle>
          </div>
          <Toggle 
            pressed={dateMode === 'group'} 
            onPressedChange={(pressed) => onDateModeChange(pressed ? 'group' : 'single')}
            className="rounded-full px-3 py-1.5 text-xs font-medium data-[state=on]:bg-sage-100 data-[state=on]:text-sage-700 dark:data-[state=on]:bg-sage-900/30 dark:data-[state=on]:text-sage-300 data-[state=off]:bg-muted data-[state=off]:text-muted-foreground hover:bg-sage-50 dark:hover:bg-sage-900/20"
          >
            {dateMode === 'single' ? (
              <>
                <User className="h-3.5 w-3.5 mr-1.5" />
                {t('datePlanning.single')}
              </>
            ) : (
              <>
                <UsersIcon className="h-3.5 w-3.5 mr-1.5" />
                {t('datePlanning.group')}
              </>
            )}
          </Toggle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-2">
        <div className="text-sm text-muted-foreground mb-3">
          {dateMode === 'single' 
            ? t('datePlanning.selectFriend') 
            : t('datePlanning.selectGroupFriends', { count: selectedCount })}
        </div>
        {dateMode === 'single' ? (
          <Select value={selectedPartnerId} onValueChange={onPartnerChange}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder={t('datePlanning.chooseFriend')} />
            </SelectTrigger>
            <SelectContent>
              {friends.map((friend) => (
                <SelectItem key={friend.id} value={friend.id}>
                  {friend.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 max-h-48 overflow-y-auto pr-2">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-sage-50/50 dark:hover:bg-sage-900/10 transition-colors border border-transparent hover:border-sage-200/50 dark:hover:border-sage-800/30">
                  <Checkbox
                    id={friend.id}
                    checked={selectedPartnerIds.includes(friend.id)}
                    disabled={!selectedPartnerIds.includes(friend.id) && selectedPartnerIds.length >= maxGroupSize}
                    onCheckedChange={(checked) => handlePartnerToggle(friend.id, checked as boolean)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label 
                    htmlFor={friend.id} 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    {friend.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite friends section */}
        <div className="border-t border-border/50 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-full bg-primary/10">
              <UserPlus className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">{t('myFriends.inviteMore')}</span>
              <p className="text-xs text-muted-foreground">Teile deinen Link & sammle Punkte</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={handleInviteWhatsApp}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 transition-all hover:scale-105 active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center shadow-sm">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-medium text-foreground">WhatsApp</span>
            </button>

            <button
              onClick={handleInviteTelegram}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/20 transition-all hover:scale-105 active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-[#0088cc] flex items-center justify-center shadow-sm">
                <Send className="w-5 h-5 text-white" />
              </div>
              <span className="text-[10px] font-medium text-foreground">Telegram</span>
            </button>

            <button
              onClick={handleInviteEmail}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/50 hover:bg-muted border border-border/50 transition-all hover:scale-105 active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-muted-foreground/15 flex items-center justify-center shadow-sm">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>
              <span className="text-[10px] font-medium text-foreground">E-Mail</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-all hover:scale-105 active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shadow-sm">
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-primary" />}
              </div>
              <span className="text-[10px] font-medium text-foreground">{copied ? '✓ Kopiert' : 'Link'}</span>
            </button>
          </div>
        </div>
        
        <Button 
          onClick={onContinue}
          disabled={!isValidSelection || loading}
          variant="wellness"
          className="w-full h-12"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {t('datePlanning.creatingSession')}
            </>
          ) : (
            <>
              {dateMode === 'single' ? t('datePlanning.continue') : t('datePlanning.planGroupDate', { count: selectedCount })}
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PartnerSelection;
