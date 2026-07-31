
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, ArrowRight, Loader2, User, UsersIcon, CheckCircle2, Clock, Search, Inbox } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import InviteFriendsSection from '@/components/InviteFriendsSection';

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
  friendsLoading?: boolean;
  invitedFriendIds?: string[];
  acceptedFriendIds?: string[];
  incomingRequestIds?: string[];
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
  friendsLoading = false,
  invitedFriendIds = [],
  acceptedFriendIds = [],
  incomingRequestIds = [],
  onPartnerChange,
  onPartnerIdsChange,
  onDateModeChange,
  onContinue
}) => {
  const { t } = useTranslation();

  type FriendStatus = 'accepted' | 'pending' | 'incoming';

  const statusFor = (id: string): FriendStatus | null => {
    if (incomingRequestIds.includes(id)) return 'incoming';
    if (invitedFriendIds.includes(id)) return 'pending';
    if (acceptedFriendIds.includes(id)) return 'accepted';
    return null;
  };

  const StatusBadge: React.FC<{ status: FriendStatus }> = ({ status }) => {
    if (status === 'accepted') {
      return (
        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3" />
          {t('datePlanning.accepted', 'Angenommen')}
        </span>
      );
    }
    if (status === 'incoming') {
      return (
        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400">
          <Inbox className="h-3 w-3" />
          {t('datePlanning.requestOpen', 'Anfrage offen')}
        </span>
      );
    }
    return (
      <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
        <Clock className="h-3 w-3" />
        {t('datePlanning.requestSent', 'Anfrage verschickt')}
      </span>
    );
  };

  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | FriendStatus>('all');

  const filteredFriends = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return friends.filter(f => {
      const matchesSearch = !q || (f.name || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (statusFilter === 'all') return true;
      const s = statusFor(f.id) ?? 'accepted';
      return s === statusFilter;
    });
  }, [friends, search, statusFilter, invitedFriendIds, acceptedFriendIds, incomingRequestIds]);

  const filterOptions: { key: 'all' | FriendStatus; label: string }[] = [
    { key: 'all', label: t('datePlanning.filterAll', 'Alle') },
    { key: 'accepted', label: t('datePlanning.filterFriends', 'Freund') },
    { key: 'incoming', label: t('datePlanning.requestOpen', 'Anfrage offen') },
    { key: 'pending', label: t('datePlanning.requestSent', 'Anfrage verschickt') },
  ];

  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, statusFilter, dateMode]);

  const visibleFriends = React.useMemo(
    () => filteredFriends.slice(0, visibleCount),
    [filteredFriends, visibleCount]
  );
  const hasMore = filteredFriends.length > visibleCount;

  React.useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        setVisibleCount(c => c + PAGE_SIZE);
      }
    }, { rootMargin: '80px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, visibleFriends.length]);

  const selectedSingleFriend = friends.find(f => f.id === selectedPartnerId);
  const selectedSingleStatus = selectedSingleFriend ? statusFor(selectedSingleFriend.id) : null;

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
  const hasFriends = friends.length > 0;

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
        {!hasFriends && friendsLoading ? (
          <div className="flex items-center justify-center p-5 text-sm text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t('common.loading', 'Lädt...')}
          </div>
        ) : !hasFriends ? (
          <div className="text-center p-5 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
            <h3 className="text-base font-medium text-foreground mb-1">{t('datePlanning.noFriendsYet')}</h3>
            <p className="text-sm text-muted-foreground">{t('datePlanning.noFriendsYetDesc')}</p>
          </div>
        ) : dateMode === 'single' ? (
          <>
          <div className="space-y-2 mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('datePlanning.searchFriends', 'Freunde suchen...')}
                className="pl-9 h-10"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filterOptions.map(o => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setStatusFilter(o.key)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${statusFilter === o.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <Select value={selectedPartnerId} onValueChange={onPartnerChange}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder={t('datePlanning.chooseFriend')} />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {visibleFriends.map((friend) => {
                const s = statusFor(friend.id);
                return (
                  <SelectItem key={friend.id} value={friend.id}>
                    <span className="inline-flex items-center">
                      {friend.name}
                      {s && <StatusBadge status={s} />}
                    </span>
                  </SelectItem>
                );
              })}
              {hasMore && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setVisibleCount(c => c + PAGE_SIZE); }}
                  className="w-full text-xs py-2 text-primary hover:underline"
                >
                  {t('datePlanning.loadMoreFriends', 'Mehr laden')} ({filteredFriends.length - visibleCount})
                </button>
              )}
            </SelectContent>
          </Select>
          {filteredFriends.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">{t('datePlanning.noFriendsMatch', 'Keine Treffer')}</p>
          )}
          {selectedSingleFriend && selectedSingleStatus && (
            <div className="mt-2 flex items-center text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{selectedSingleFriend.name}</span>
              <StatusBadge status={selectedSingleStatus} />
            </div>
          )}
          {selectedSingleFriend && selectedSingleStatus === 'pending' && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              {t('datePlanning.waitingForPartnerPrefs', { name: selectedSingleFriend.name })}
            </p>
          )}
          </>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('datePlanning.searchFriends', 'Freunde suchen...')}
                  className="pl-9 h-10"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {filterOptions.map(o => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setStatusFilter(o.key)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${statusFilter === o.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted'}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-3 max-h-48 overflow-y-auto pr-2">
              {filteredFriends.length === 0 && (
                <p className="text-xs text-muted-foreground">{t('datePlanning.noFriendsMatch', 'Keine Treffer')}</p>
              )}
              {filteredFriends.map((friend) => {
                const s = statusFor(friend.id);
                return (
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
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 flex items-center"
                  >
                    {friend.name}
                    {s && <StatusBadge status={s} />}
                  </label>
                </div>
                );
              })}
            </div>
            {invitedFriendIds.length > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {t('datePlanning.waitingForPartnerPrefs', { name: friends.find(f => invitedFriendIds.includes(f.id))?.name || '' })}
              </p>
            )}
          </div>
        )}

        <InviteFriendsSection />

        {hasFriends && (
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
        )}
      </CardContent>
    </Card>
  );
};

export default PartnerSelection;
