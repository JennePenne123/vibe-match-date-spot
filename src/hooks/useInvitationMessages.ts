import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { sanitizeMessage } from '@/utils/inputSanitization';

export interface InvitationMessage {
  id: string;
  invitation_id: string;
  sender_id: string;
  message: string;
  read_at: string | null;
  created_at: string;
  sender: {
    name: string;
    avatar_url?: string;
  };
}

export const useInvitationMessages = (invitationId: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<InvitationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch messages
  const fetchMessages = async () => {
    if (!invitationId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('invitation_messages')
        .select(`
          *,
          sender:profiles!sender_id(name, avatar_url)
        `)
        .eq('invitation_id', invitationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async (messageText: string) => {
    if (!user || !messageText.trim()) return;

    const sanitized = sanitizeMessage(messageText);
    if (!sanitized) {
      toast({
        title: "Invalid Message",
        description: "Please enter a valid message",
        variant: "destructive"
      });
      return;
    }

    try {
      setSending(true);
      const { error } = await supabase
        .from('invitation_messages')
        .insert({
          invitation_id: invitationId,
          sender_id: user.id,
          message: sanitized
        });

      if (error) throw error;

      // Message will be added via real-time subscription
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  // Mark messages as read
  const markAsRead = async () => {
    if (!user) return;

    try {
      const unreadMessages = messages.filter(
        msg => msg.sender_id !== user.id && !msg.read_at
      );

      if (unreadMessages.length === 0) return;

      const { error } = await supabase
        .from('invitation_messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadMessages.map(msg => msg.id));

      if (error) throw error;
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Get unread count
  const unreadCount = messages.filter(
    msg => user && msg.sender_id !== user.id && !msg.read_at
  ).length;

  // Set up real-time subscription
  useEffect(() => {
    if (!invitationId) return;

    fetchMessages();

    const channel = supabase
      .channel(`invitation_messages:${invitationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'invitation_messages',
          filter: `invitation_id=eq.${invitationId}`
        },
        async (payload) => {
          // Fetch full message with sender info
          const { data } = await supabase
            .from('invitation_messages')
            .select(`
              *,
              sender:profiles!sender_id(name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            setMessages(prev => [...prev, data]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'invitation_messages',
          filter: `invitation_id=eq.${invitationId}`
        },
        (payload) => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            )
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [invitationId]);

  // Mark as read when component mounts or messages change
  useEffect(() => {
    if (messages.length > 0) {
      markAsRead();
    }
  }, [messages.length]);

  return {
    messages,
    loading,
    sending,
    unreadCount,
    sendMessage,
    markAsRead
  };
};
