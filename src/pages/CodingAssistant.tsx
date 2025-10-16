import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Code, FileCode, Bug, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CodeBlock from '@/components/coding/CodeBlock';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function CodingAssistant() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const extractCodeBlocks = (text: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const blocks: { language: string; code: string }[] = [];
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      blocks.push({
        language: match[1] || 'plaintext',
        code: match[2].trim()
      });
    }

    return blocks;
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !user) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create or get conversation
      if (!conversationId) {
        const { data: conv, error: convError } = await supabase
          .from('coding_conversations')
          .insert({ 
            user_id: user.id, 
            title: input.slice(0, 50) + (input.length > 50 ? '...' : '')
          })
          .select()
          .single();
        
        if (convError) throw convError;
        if (conv) setConversationId(conv.id);
      }

      // Stream response from edge function
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://dfjwubatslzblagthbdw.supabase.co/functions/v1/coding-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            messages: [{ role: 'user', content: input }],
            conversationId
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let assistantMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                assistantMessage += content;
                
                // Update message in real-time
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  
                  if (lastMsg?.role === 'assistant') {
                    lastMsg.content = assistantMessage;
                  } else {
                    newMessages.push({
                      role: 'assistant',
                      content: assistantMessage,
                      timestamp: new Date()
                    });
                  }
                  return newMessages;
                });
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      // Save messages to database
      if (conversationId && assistantMessage) {
        await supabase.from('coding_messages').insert([
          {
            conversation_id: conversationId,
            role: 'user',
            content: userMessage.content
          },
          {
            conversation_id: conversationId,
            role: 'assistant',
            content: assistantMessage
          }
        ]);
      }

    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      });
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    {
      icon: FileCode,
      label: 'Generate Code',
      prompt: 'Create a React component that displays user statistics with charts'
    },
    {
      icon: Lightbulb,
      label: 'Code Review',
      prompt: 'Review this code for best practices and suggest improvements'
    },
    {
      icon: Bug,
      label: 'Debug Issue',
      prompt: 'Help me debug: TypeError: Cannot read property of undefined'
    },
    {
      icon: Code,
      label: 'Explain Concept',
      prompt: 'Explain how React useEffect hook works with dependencies'
    }
  ];

  return (
    <div className="container mx-auto max-w-5xl h-[calc(100vh-80px)] flex flex-col p-4">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-accent/5">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Code className="w-6 h-6 text-primary" />
            AI Coding Assistant
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate code, analyze files, debug issues, and learn concepts
          </p>
        </div>

        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-6 max-w-2xl">
                <Code className="w-16 h-16 mx-auto text-muted-foreground" />
                <div>
                  <h2 className="text-xl font-semibold mb-2">Start a Conversation</h2>
                  <p className="text-muted-foreground mb-6">
                    Choose a quick action or type your own question
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {quickActions.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      className="h-auto py-4 flex flex-col items-center gap-2"
                      onClick={() => setInput(action.prompt)}
                    >
                      <action.icon className="w-5 h-5" />
                      <span className="text-sm">{action.label}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const codeBlocks = extractCodeBlocks(msg.content);
                const textWithoutCode = msg.content.replace(/```(\w+)?\n[\s\S]*?```/g, '');

                return (
                  <div
                    key={idx}
                    className={`mb-6 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                  >
                    <div
                      className={`inline-block max-w-[85%] ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3'
                          : 'text-left'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      ) : (
                        <div className="space-y-2">
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <div className="whitespace-pre-wrap break-words">{textWithoutCode}</div>
                          </div>
                          {codeBlocks.map((block, i) => (
                            <CodeBlock
                              key={i}
                              code={block.code}
                              language={block.language}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 px-1">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          
          <div ref={scrollRef} />
        </ScrollArea>

        <div className="p-4 border-t bg-background">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask me anything about coding... (Shift+Enter for new line)"
              className="flex-1 min-h-[60px] max-h-[200px] resize-none"
              disabled={isLoading}
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || !input.trim()}
              className="self-end px-6"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </Card>
    </div>
  );
}
