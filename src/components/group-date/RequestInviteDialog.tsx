import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { KeyRound, Send, Users, Loader2 } from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';
import { extractGroupToken, storeGroupToken } from '@/lib/groupInviteLink';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REQUEST_TEXT =
  'Hey! Dein H!Outz-Einladungslink funktioniert bei mir leider nicht mehr. ' +
  'Kannst du mir bitte einen neuen QR-Code oder Link schicken?';

const RequestInviteDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const { friends, loading } = useFriends();
  const [code, setCode] = useState('');
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  const accepted = useMemo(
    () => friends.filter(f => !f.friendship_status || f.friendship_status === 'accepted'),
    [friends]
  );

  const submitCode = () => {
    const token = extractGroupToken(code.trim()) || code.trim();
    if (!token || token.length < 6) {
      toast.error('Bitte einen gültigen Code oder Link eingeben.');
      return;
    }
    storeGroupToken(token);
    onOpenChange(false);
    navigate(`/join-group?token=${encodeURIComponent(token)}`);
  };

  const askFriend = async (name: string, id: string) => {
    setSendingTo(id);
    const text = `Hi ${name.split(' ')[0]}! ${REQUEST_TEXT}`;
    try {
      if (navigator.share) {
        await navigator.share({ text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success('Nachricht kopiert – füge sie in deinen Chat ein.');
      }
    } catch {
      /* cancelled */
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Neuen Einladungscode</DialogTitle>
          <DialogDescription>
            Gib einen neuen Code direkt ein oder frag jemanden aus deiner Freundesliste.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <KeyRound className="h-4 w-4 text-primary" />
              Code oder Link eingeben
            </label>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="z. B. ABC123 oder Einladungslink"
                onKeyDown={e => e.key === 'Enter' && submitCode()}
              />
              <Button onClick={submitCode} disabled={!code.trim()}>Prüfen</Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-primary" />
              Freund:in um neuen Code bitten
            </p>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : accepted.length === 0 ? (
              <p className="rounded-lg border border-border/50 bg-muted/40 p-3 text-xs text-muted-foreground">
                Noch keine Freund:innen in der App – bitte die Person direkt um einen neuen Link.
              </p>
            ) : (
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {accepted.map(f => (
                  <button
                    key={f.id}
                    onClick={() => askFriend(f.name || 'Freund', f.id)}
                    className="flex w-full items-center gap-3 rounded-lg border border-border/50 p-2 text-left transition-colors hover:bg-muted/60"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={f.avatar_url} alt={f.name} />
                      <AvatarFallback className="text-xs">{(f.name || '?').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1 truncate text-sm">{f.name}</span>
                    {sendingTo === f.id ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                    ) : (
                      <Send className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestInviteDialog;
