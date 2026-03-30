import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { useReferral } from '@/hooks/useReferral';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Search, UserPlus, Mail, MessageCircle, Send, Share2, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FriendCard from '@/components/FriendCard';

const MyFriends = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { friends } = useFriends();
  const { referralLink, copyReferralLink } = useReferral();
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const filteredFriends = friends.filter(friend => friend.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleMessage = (friendId: string, friendName: string) => {
    toast({ title: t('myFriends.messageSent'), description: t('myFriends.startConversation', { name: friendName }) });
  };

  const handleInviteDate = (friendId: string, friendName: string) => {
    navigate('/plan-date', { state: { preselectedFriend: { id: friendId, name: friendName } } });
  };

  const inviteText = t('myFriends.inviteMessage', { link: referralLink || window.location.origin });

  const handleInviteEmail = () => {
    const subject = encodeURIComponent(t('myFriends.inviteEmailSubject', 'Komm zu HiOutz!'));
    const body = encodeURIComponent(inviteText);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleInviteWhatsApp = () => {
    const text = encodeURIComponent(inviteText);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleInviteTelegram = () => {
    const text = encodeURIComponent(inviteText);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink || window.location.origin)}&text=${text}`, '_blank');
  };

  const handleCopyLink = async () => {
    const success = referralLink ? await copyReferralLink() : false;
    if (success) {
      setCopied(true);
      toast({ title: t('myFriends.linkCopied') });
      setTimeout(() => setCopied(false), 2000);
    } else {
      try {
        await navigator.clipboard.writeText(referralLink || window.location.origin);
        setCopied(true);
        toast({ title: t('myFriends.linkCopied') });
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast({ title: t('common.error'), variant: 'destructive' });
      }
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HiOutz',
          text: inviteText,
          url: referralLink || window.location.origin,
        });
      } catch {
        // User cancelled
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-4 p-4 pt-12 bg-card shadow-sm">
          <Button onClick={() => navigate(-1)} variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted"><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground">{t('myFriends.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('myFriends.connections', { count: friends.length })}</p>
          </div>
          <Button variant="outline" size="icon" className="text-primary border-border hover:bg-primary/10"><UserPlus className="w-5 h-5" /></Button>
        </div>
        <div className="p-6 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input type="text" placeholder={t('myFriends.searchFriends')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-12 bg-card border-border" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-indigo-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-indigo-400">{friends.length}</div>
                <div className="text-sm text-muted-foreground">{t('myFriends.totalFriends')}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-violet-500/10 to-pink-500/10 border-pink-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-pink-400">{friends.filter(f => f.status === 'online').length}</div>
                <div className="text-sm text-muted-foreground">{t('myFriends.onlineNow')}</div>
              </CardContent>
            </Card>
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">{t('myFriends.yourFriends')}</h2>
            {filteredFriends.map((friend) => <FriendCard key={friend.id} friend={friend} onMessage={handleMessage} onInvite={handleInviteDate} />)}
          </div>

          {/* Invite Section */}
          <Card className="bg-muted/50 border-dashed border-2 border-border overflow-hidden">
            <CardContent className="p-6 text-center space-y-4">
              <div className="text-muted-foreground mb-1">
                <UserPlus className="w-8 h-8 mx-auto" />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-1">{t('myFriends.inviteMore')}</h3>
                <p className="text-sm text-muted-foreground">{t('myFriends.inviteMoreDesc')}</p>
              </div>

              {/* Share buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInviteEmail}
                  className="gap-2"
                >
                  <Mail className="w-4 h-4" />
                  E-Mail
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInviteWhatsApp}
                  className="gap-2 text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInviteTelegram}
                  className="gap-2 text-blue-500 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/20"
                >
                  <Send className="w-4 h-4" />
                  Telegram
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? t('myFriends.copied') : t('myFriends.copyLink')}
                </Button>
              </div>

              {/* Native share (mobile) */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleNativeShare}
                  className="w-full gap-2 bg-gradient-primary text-primary-foreground"
                >
                  <Share2 className="w-4 h-4" />
                  {t('myFriends.shareInvite')}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyFriends;
