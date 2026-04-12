import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { STALE_TIMES } from '@/config/queryConfig';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UserPlus, ShieldCheck, Shield, Trash2, Search, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getInitials } from '@/lib/utils';

interface AdminMember {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  createdAt: string;
}

const AdminTeam: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [removeTarget, setRemoveTarget] = useState<AdminMember | null>(null);

  // Fetch all admin users
  const { data: admins, isLoading } = useQuery({
    queryKey: ['admin-team'],
    queryFn: async () => {
      // Get all admin role entries
      const { data: adminRoles, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (error) throw error;
      if (!adminRoles?.length) return [];

      const userIds = adminRoles.map((r) => r.user_id);

      // Get profiles for these users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, created_at')
        .in('id', userIds);

      return (profiles || []).map((p) => ({
        userId: p.id,
        name: p.name,
        email: p.email,
        avatarUrl: p.avatar_url,
        createdAt: p.created_at,
      })) as AdminMember[];
    },
    staleTime: STALE_TIMES.ADMIN,
  });

  // Search user by email
  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ['admin-user-search', searchEmail],
    queryFn: async () => {
      if (searchEmail.length < 3) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .ilike('email', `%${searchEmail}%`)
        .limit(5);
      
      // Filter out existing admins
      const adminIds = new Set((admins || []).map((a) => a.userId));
      return (data || []).filter((u) => !adminIds.has(u.id));
    },
    enabled: searchEmail.length >= 3,
    staleTime: 0,
  });

  // Add admin role
  const addAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });
      if (error) {
        if (error.code === '23505') throw new Error('Bereits Admin');
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: 'Admin hinzugefügt' });
      queryClient.invalidateQueries({ queryKey: ['admin-team'] });
      setAddOpen(false);
      setSearchEmail('');
    },
    onError: (err: Error) => {
      toast({ title: err.message || 'Fehler', variant: 'destructive' });
    },
  });

  // Remove admin role
  const removeAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Admin-Zugang entfernt' });
      queryClient.invalidateQueries({ queryKey: ['admin-team'] });
      setRemoveTarget(null);
    },
    onError: () => {
      toast({ title: 'Fehler beim Entfernen', variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team-Verwaltung</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Verwalte Admin-Zugänge für dein Team
          </p>
        </div>

        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <UserPlus className="w-4 h-4" />
              Admin hinzufügen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Admin hinzufügen</DialogTitle>
              <DialogDescription>
                Suche einen registrierten Nutzer per E-Mail und gewähre Admin-Zugang.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="admin-search">E-Mail suchen</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="admin-search"
                    placeholder="name@email.de"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {searching && <Skeleton className="h-12 w-full" />}

              {searchResults && searchResults.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={u.avatar_url || undefined} referrerPolicy="no-referrer" />
                        <AvatarFallback className="text-xs">{getInitials(u.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addAdmin.mutate(u.id)}
                        disabled={addAdmin.isPending}
                      >
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Admin
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {searchEmail.length >= 3 && !searching && searchResults?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Kein Nutzer gefunden oder bereits Admin.
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Admin list */}
      <Card className="bg-card/80 backdrop-blur border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            {admins?.length || 0} Admins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {(admins || []).map((admin) => {
                const isSelf = admin.userId === user?.id;
                return (
                  <div
                    key={admin.userId}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={admin.avatarUrl || undefined} referrerPolicy="no-referrer" />
                      <AvatarFallback className="text-xs">{getInitials(admin.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{admin.name}</p>
                        {isSelf && (
                          <Badge variant="outline" className="text-[10px]">Du</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
                    </div>
                    <Badge variant="destructive" className="text-xs gap-1">
                      <Shield className="w-3 h-3" />
                      Admin
                    </Badge>
                    {!isSelf && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setRemoveTarget(admin)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Remove confirmation */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Admin-Zugang entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.name} verliert den Admin-Zugang und kann nicht mehr auf das Admin-Dashboard zugreifen. 
              Dies kann jederzeit rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeTarget && removeAdmin.mutate(removeTarget.userId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Entfernen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminTeam;
