import React, { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send } from 'lucide-react';
import { useInvitationMessages } from '@/hooks/useInvitationMessages';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface InvitationMessengerProps {
  invitationId: string;
  currentUserId: string;
  otherUser: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

const InvitationMessenger: React.FC<InvitationMessengerProps> = ({
  invitationId,
  currentUserId,
  otherUser
}) => {
  const { messages, loading, sending, sendMessage } = useInvitationMessages(invitationId);
  const [messageText, setMessageText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!messageText.trim() || sending) return;

    await sendMessage(messageText);
    setMessageText('');
    textareaRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              Start the conversation! Say hi or ask about the date details.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isSender = message.sender_id === currentUserId;
              const showAvatar = index === 0 || messages[index - 1].sender_id !== message.sender_id;

              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-2',
                    isSender ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  {/* Avatar */}
                  {showAvatar ? (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={isSender ? undefined : otherUser.avatar_url} referrerPolicy="no-referrer" />
                      <AvatarFallback>
                        {isSender ? 'You' : otherUser.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8" />
                  )}

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2',
                      isSender
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted text-foreground rounded-tl-sm'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {message.message}
                    </p>
                    <p
                      className={cn(
                        'text-xs mt-1',
                        isSender ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}
                    >
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="min-h-[44px] max-h-32 resize-none"
            disabled={sending}
            maxLength={1000}
          />
          <Button
            onClick={handleSend}
            disabled={!messageText.trim() || sending}
            size="icon"
            className="h-11 w-11 shrink-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
};

export default InvitationMessenger;
