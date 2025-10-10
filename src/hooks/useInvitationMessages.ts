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
  const subscriptionPromiseRef = useRef<Promise<void> | null>(null);

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

  // Set up real-time subscription with promise-based guard
  useEffect(() => {
    const userId = user?.id;
    if (!invitationId || !userId) return;

    // If already subscribing or subscribed, skip
    if (subscriptionPromiseRef.current || channelRef.current) {
      console.log('⚠️ Subscription already in progress or exists');
      return;
    }

    const channelName = `invitation_messages:${invitationId}`;
    console.log('🔌 Setting up real-time channel:', channelName);

    // Create a promise to track subscription completion
    const subscriptionPromise = (async () => {
      try {
        const channel = supabase.channel(channelName);
        
        // Fetch messages first
        await fetchMessages();

        // Set up event listeners
        channel
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'invitation_messages',
              filter: `invitation_id=eq.${invitationId}`
            },
            async (payload) => {
              console.log('📨 New message received:', payload.new.id);
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
              console.log('📝 Message updated:', payload.new.id);
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
                )
              );
            }
          );

        // Subscribe and wait for confirmation
        await new Promise<void>((resolve, reject) => {
          channel.subscribe((status) => {
            console.log('📡 Channel status:', status);
            if (status === 'SUBSCRIBED') {
              console.log('✅ Subscription successful');
              channelRef.current = channel; // Only set AFTER successful subscription
              resolve();
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ Subscription failed');
              reject(new Error('Channel subscription failed'));
            }
          });
        });
      } catch (error) {
        console.error('🚨 Subscription error:', error);
        subscriptionPromiseRef.current = null;
        channelRef.current = null;
        throw error;
      }
    })();

    subscriptionPromiseRef.current = subscriptionPromise;

    return () => {
      console.log('🔌 Cleaning up channel:', channelName);
      subscriptionPromiseRef.current = null;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [invitationId, user?.id]);

  // Mark as read when messages change
  useEffect(() => {
    if (messages.length > 0 && user) {
      markAsRead();
    }
  }, [messages.length, user?.id]);

  return {
    messages,
    loading,
    sending,
    unreadCount,
    sendMessage,
    markAsRead
  };
};
