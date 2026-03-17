import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Settings, Heart, MapPin, ChevronRight, Gift } from 'lucide-react';

interface ProfileActionsProps {
  onLogout: () => void;
}

const ProfileActions = ({ onLogout }: ProfileActionsProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const quickLinks = [
    { icon: Heart, label: t('menu.myInvitations', 'Meine Einladungen'), path: '/invitations', color: 'text-rose-500', bg: 'bg-rose-500/10' },
    { icon: MapPin, label: t('menu.myVenues', 'Meine Venues'), path: '/my-venues', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  return (
    <>
      {/* Quick Links */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden">
        <CardContent className="p-2">
          {quickLinks.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all text-left group"
            >
              <div className={`flex items-center justify-center w-9 h-9 rounded-lg ${item.bg}`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Friends */}
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <Users className="w-5 h-5" />
            {t('profile.friendsList')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{t('profile.noFriendsYet')}</p>
            <Button onClick={() => navigate('/my-friends')} variant="outline" className="mt-3 border-border text-foreground hover:bg-accent/50">{t('profile.addFriends')}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-3">
        <Button onClick={() => navigate('/settings')} variant="outline" className="w-full border-border text-foreground hover:bg-accent/50">
          <Settings className="w-4 h-4 mr-2" />{t('profile.accountSettings')}
        </Button>
        <Button onClick={() => navigate('/preferences')} variant="outline" className="w-full border-border text-foreground hover:bg-accent/50">{t('profile.updatePreferences')}</Button>
        <Button onClick={() => navigate('/home')} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">{t('profile.findNewSpots')}</Button>
        <Button onClick={onLogout} variant="outline" className="w-full text-destructive border-destructive/30 hover:bg-destructive/10">{t('common.signOut')}</Button>
      </div>
    </>
  );
};

export default ProfileActions;
