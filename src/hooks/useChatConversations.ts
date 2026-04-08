import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatConversation {
  invitationId: string;
  title: string;
  otherUser: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  lastMessage?: {
    message: string;
    sender_id: string;
    created_at: string;
  };
  unreadCount: number;
}

export const useChatConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);

  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get all invitations where user is sender or recipient
      const { data: invitations, error: invError } = await supabase
        .from('date_invitations')
        .select(`
          id, title, sender_id, recipient_id,
          sender:profiles!sender_id(id, name, avatar_url),
          recipient:profiles!recipient_id(id, name, avatar_url)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (invError) throw invError;
      if (!invitations || invitations.length === 0) {
        setConversations([]);
        setTotalUnread(0);
        return;
      }

      const invitationIds = invitations.map((inv: any) => inv.id);

      // Get latest message per invitation + unread counts in parallel
      const [messagesResult, unreadResult] = await Promise.all([
        supabase
          .from('invitation_messages')
          .select('invitation_id, message, sender_id, created_at')
          .in('invitation_id', invitationIds)
          .order('created_at', { ascending: false }),
        supabase
          .from('invitation_messages')
          .select('invitation_id, id')
          .in('invitation_id', invitationIds)
          .neq('sender_id', user.id)
          .is('read_at', null)
      ]);

      // Build latest message map
      const latestMessageMap = new Map<string, any>();
      if (messagesResult.data) {
        for (const msg of messagesResult.data) {
          if (!latestMessageMap.has(msg.invitation_id)) {
            latestMessageMap.set(msg.invitation_id, msg);
          }
        }
      }

      // Build unread count map
      const unreadMap = new Map<string, number>();
      if (unreadResult.data) {
        for (const msg of unreadResult.data) {
          unreadMap.set(msg.invitation_id, (unreadMap.get(msg.invitation_id) || 0) + 1);
        }
      }

      // Only include invitations that have messages
      const convos: ChatConversation[] = invitations
        .filter((inv: any) => latestMessageMap.has(inv.id))
        .map((inv: any) => {
          const isSender = inv.sender_id === user.id;
          const otherProfile = isSender ? inv.recipient : inv.sender;

          return {
            invitationId: inv.id,
            title: inv.title,
            otherUser: {
              id: otherProfile?.id || '',
              name: otherProfile?.name || 'Unknown',
              avatar_url: otherProfile?.avatar_url,
            },
            lastMessage: latestMessageMap.get(inv.id) || undefined,
            unreadCount: unreadMap.get(inv.id) || 0,
          };
        })
        .sort((a: ChatConversation, b: ChatConversation) => {
          const aTime = a.lastMessage ? new Date(a.lastMessage.created_at).getTime() : 0;
          const bTime = b.lastMessage ? new Date(b.lastMessage.created_at).getTime() : 0;
          return bTime - aTime;
        });

      setConversations(convos);
      setTotalUnread(convos.reduce((sum, c) => sum + c.unreadCount, 0));
    } catch (error) {
      console.error('Error fetching chat conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Listen for new messages to refresh
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!user) return;

    // Remove previous channel if exists
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = `${user.id}:chat-updates-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'invitation_messages' },
        () => fetchConversations()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'invitation_messages' },
        () => fetchConversations()
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [user, fetchConversations]);

  return { conversations, loading, totalUnread, refetch: fetchConversations };
};
