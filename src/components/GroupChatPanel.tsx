import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Users, Loader2, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useGroupDatePlanning, GroupMember, GroupMessage } from '@/hooks/useGroupDatePlanning';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface GroupChatPanelProps {
  groupId: string;
}

const GroupChatPanel: React.FC<GroupChatPanelProps> = ({ groupId }) => {
  const { user } = useAuth();
  const { groupMembers, groupMessages, loadGroup, loadGroupMessages, sendGroupMessage, respondToInvitation } = useGroupDatePlanning();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGroup(groupId);
    loadGroupMessages(groupId);
  }, [groupId, loadGroup, loadGroupMessages]);

  // Realtime subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel(`group-chat-${groupId}-${Date.now()}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'date_group_messages',
        filter: `group_id=eq.${groupId}`,
      }, () => {
        loadGroupMessages(groupId);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [groupId, loadGroupMessages]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [groupMessages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    await sendGroupMessage(groupId, input);
    setInput('');
    setSending(false);
  }, [input, sending, groupId, sendGroupMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentMember = groupMembers.find(m => m.user_id === user?.id);
  const isPending = currentMember?.invitation_status === 'pending';

  return (
    <div className="flex flex-col h-full">
      {/* Members bar */}
      <div className="px-4 py-3 border-b border-border/40 bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {groupMembers.filter(m => m.invitation_status === 'accepted').length}/{groupMembers.length} Teilnehmer
          </span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {groupMembers.map(m => (
            <div key={m.id} className="flex items-center gap-1">
              <Avatar className="w-6 h-6">
                <AvatarImage src={m.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-[10px]">
                  {(m.profile?.name || '?').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-muted-foreground">{m.profile?.name?.split(' ')[0]}</span>
              {m.invitation_status === 'accepted' && <Check className="w-3 h-3 text-green-500" />}
              {m.invitation_status === 'pending' && <Clock className="w-3 h-3 text-muted-foreground" />}
              {m.invitation_status === 'declined' && <X className="w-3 h-3 text-red-500" />}
              {m.preferences_submitted && (
                <Badge variant="secondary" className="text-[8px] px-1 py-0">✓ Prefs</Badge>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Pending invitation banner */}
      {isPending && (
        <div className="px-4 py-3 bg-primary/5 border-b border-primary/20 flex items-center justify-between">
          <p className="text-sm text-foreground">Du wurdest zu dieser Gruppe eingeladen!</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => respondToInvitation(groupId, false)}>
              Ablehnen
            </Button>
            <Button size="sm" onClick={() => respondToInvitation(groupId, true)}>
              Annehmen
            </Button>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div ref={scrollRef} className="space-y-3">
          {groupMessages.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                Noch keine Nachrichten. Startet die Unterhaltung! 💬
              </p>
            </div>
          )}
          {groupMessages.map(msg => {
            const isOwn = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[80%]', !isOwn && 'flex gap-2')}>
                  {!isOwn && (
                    <Avatar className="w-6 h-6 mt-1 shrink-0">
                      <AvatarImage src={msg.sender_profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px]">
                        {(msg.sender_profile?.name || '?').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div>
                    {!isOwn && (
                      <p className="text-[10px] text-muted-foreground mb-0.5 ml-1">
                        {msg.sender_profile?.name?.split(' ')[0]}
                      </p>
                    )}
                    <div className={cn(
                      'rounded-2xl px-3 py-2 text-sm',
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-muted/60 text-foreground rounded-bl-md'
                    )}>
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5 ml-1">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: false })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Input */}
      {currentMember?.invitation_status === 'accepted' && (
        <div className="p-3 border-t border-border/40 bg-background/50">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nachricht schreiben..."
              rows={1}
              className={cn(
                'flex-1 resize-none bg-muted/40 border border-border/40 rounded-xl px-3 py-2.5 text-sm',
                'placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40',
                'max-h-[80px]'
              )}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              size="icon"
              className="h-10 w-10 rounded-xl shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupChatPanel;
