import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Plus, MessageCircle, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useGroupDatePlanning, DateGroup } from '@/hooks/useGroupDatePlanning';
import GroupChatPanel from '@/components/GroupChatPanel';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const GroupDates: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getUserGroups, loading } = useGroupDatePlanning();
  const [groups, setGroups] = useState<DateGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      getUserGroups().then(setGroups);
    }
  }, [user, getUserGroups]);

  const statusLabel = (status: string) => {
    switch (status) {
      case 'planning': return { label: 'Planung', variant: 'secondary' as const };
      case 'venue_selected': return { label: 'Venue gewählt', variant: 'default' as const };
      case 'confirmed': return { label: 'Bestätigt', variant: 'default' as const };
      case 'completed': return { label: 'Abgeschlossen', variant: 'outline' as const };
      default: return { label: status, variant: 'secondary' as const };
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-foreground">
            {t('nav.groupDates', 'Gruppen-Dates')}
          </h1>
          <Button size="sm" onClick={() => navigate('/plan-date')} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Neu
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              Noch keine Gruppen-Dates. Erstelle eins über "Plan Date"!
            </p>
            <Button onClick={() => navigate('/plan-date')} className="gap-2">
              <Plus className="w-4 h-4" />
              Gruppen-Date planen
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {groups.map(group => {
              const status = statusLabel(group.status);
              return (
                <Card
                  key={group.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Users className="w-4 h-4 text-primary shrink-0" />
                          <h3 className="font-semibold text-sm truncate text-foreground">
                            {group.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {group.max_members} Personen
                          </span>
                          {group.proposed_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(group.proposed_date).toLocaleDateString('de-DE')}
                            </span>
                          )}
                          <span>{formatDistanceToNow(new Date(group.created_at), { addSuffix: true })}</span>
                        </div>
                        {group.group_compatibility_score > 0 && (
                          <p className="text-xs text-primary mt-1">
                            Gruppen-Kompatibilität: {Math.round(group.group_compatibility_score)}%
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                          <MessageCircle className="w-3 h-3" />
                          Chat
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Group chat sheet */}
      <Sheet open={!!selectedGroupId} onOpenChange={(open) => !open && setSelectedGroupId(null)}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl p-0">
          <SheetHeader className="px-4 pt-4 pb-2">
            <SheetTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {groups.find(g => g.id === selectedGroupId)?.name || 'Gruppen-Chat'}
            </SheetTitle>
          </SheetHeader>
          {selectedGroupId && <GroupChatPanel groupId={selectedGroupId} />}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default GroupDates;
