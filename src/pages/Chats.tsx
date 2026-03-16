import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatConversations, ChatConversation } from '@/hooks/useChatConversations';
import { useAuth } from '@/contexts/AuthContext';
import DateInviteMessengerSheet from '@/components/date-invite/DateInviteMessengerSheet';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const Chats: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { conversations, loading } = useChatConversations();
  const [search, setSearch] = useState('');
  const [activeChat, setActiveChat] = useState<ChatConversation | null>(null);

  const filtered = search
    ? conversations.filter(c =>
        c.otherUser.name.toLowerCase().includes(search.toLowerCase()) ||
        c.title.toLowerCase().includes(search.toLowerCase())
      )
    : conversations;

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <h1 className="text-2xl font-bold text-foreground">{t('nav.chats', 'Chats')}</h1>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 pb-2">
        <h1 className="text-2xl font-bold text-foreground mb-3">{t('nav.chats', 'Chats')}</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search', 'Search')}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations list */}
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              {search
                ? t('chats.noResults', 'No chats found')
                : t('chats.empty', 'No conversations yet. Plan a date and start chatting!')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((convo) => {
              const isOwnMessage = convo.lastMessage?.sender_id === user?.id;
              const preview = convo.lastMessage
                ? `${isOwnMessage ? t('chats.you', 'You') + ': ' : ''}${convo.lastMessage.message}`
                : '';

              return (
                <button
                  key={convo.invitationId}
                  onClick={() => setActiveChat(convo)}
                  className={cn(
                    'w-full flex items-center gap-3 p-4 text-left',
                    'hover:bg-muted/50 active:bg-muted/70 transition-colors',
                    convo.unreadCount > 0 && 'bg-primary/5'
                  )}
                >
                  <Avatar className="w-12 h-12 shrink-0">
                    <AvatarImage src={convo.otherUser.avatar_url} referrerPolicy="no-referrer" />
                    <AvatarFallback>{convo.otherUser.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        'text-sm truncate',
                        convo.unreadCount > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground'
                      )}>
                        {convo.otherUser.name}
                      </span>
                      {convo.lastMessage && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(convo.lastMessage.created_at), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className={cn(
                        'text-xs truncate',
                        convo.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'
                      )}>
                        {preview || convo.title}
                      </p>
                      {convo.unreadCount > 0 && (
                        <Badge
                          variant="default"
                          className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] font-bold shrink-0"
                        >
                          {convo.unreadCount > 9 ? '9+' : convo.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Chat Sheet */}
      {activeChat && user && (
        <DateInviteMessengerSheet
          open={!!activeChat}
          onOpenChange={(open) => !open && setActiveChat(null)}
          friendName={activeChat.otherUser.name}
          friendAvatar={activeChat.otherUser.avatar_url}
          invitationId={activeChat.invitationId}
          currentUserId={user.id}
          otherUserId={activeChat.otherUser.id}
        />
      )}
    </div>
  );
};

export default Chats;
