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
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  UserPlus, Shield, ShieldCheck, Trash2, Search, Users, Eye, Wrench, Headset, Flag, Crown,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminRole, AdminRole, ADMIN_ROLE_LABELS, ADMIN_ROLE_DESCRIPTIONS } from '@/hooks/useAdminRole';
import { getInitials } from '@/lib/utils';

const ROLE_ICONS: Record<AdminRole, React.ReactNode> = {
  owner: <Crown className="w-3 h-3" />,
  tech: <Wrench className="w-3 h-3" />,
  support: <Headset className="w-3 h-3" />,
  moderator: <Flag className="w-3 h-3" />,
  viewer: <Eye className="w-3 h-3" />,
};

const ROLE_COLORS: Record<AdminRole, string> = {
  owner: 'bg-amber-500/15 text-amber-500 border-amber-500/25',
  tech: 'bg-blue-500/15 text-blue-500 border-blue-500/25',
  support: 'bg-green-500/15 text-green-500 border-green-500/25',
  moderator: 'bg-purple-500/15 text-purple-500 border-purple-500/25',
  viewer: 'bg-muted text-muted-foreground border-border',
};

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  adminRole: AdminRole;
}

const AdminTeam: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isOwner, loading: roleLoading } = useAdminRole();

  const [addOpen, setAddOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('viewer');
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);

  // Fetch team members
  const { data: team, isLoading } = useQuery({
    queryKey: ['admin-team-roles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_team')
        .select('id, user_id, admin_role')
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!data?.length) return [];

      const userIds = data.map((d) => d.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      return data.map((d) => ({
        id: d.id,
        userId: d.user_id,
        name: profileMap.get(d.user_id)?.name || 'Unbekannt',
        email: profileMap.get(d.user_id)?.email || '',
        avatarUrl: profileMap.get(d.user_id)?.avatar_url || null,
        adminRole: d.admin_role as AdminRole,
      })) as TeamMember[];
    },
    staleTime: STALE_TIMES.ADMIN,
  });

  // Search user by email
  const { data: searchResults, isFetching: searching } = useQuery({
    queryKey: ['admin-team-search', searchEmail],
    queryFn: async () => {
      if (searchEmail.length < 3) return [];
      const { data } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url')
        .ilike('email', `%${searchEmail}%`)
        .limit(5);

      const teamIds = new Set((team || []).map((t) => t.userId));
      return (data || []).filter((u) => !teamIds.has(u.id));
    },
    enabled: searchEmail.length >= 3,
    staleTime: 0,
  });

  // Add team member
  const addMember = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AdminRole }) => {
      // Ensure user has admin role in user_roles
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' })
        .select();
      // Ignore unique violation - already admin
      if (roleError && roleError.code !== '23505') throw roleError;

      const { error } = await supabase
        .from('admin_team')
        .insert({ user_id: userId, admin_role: role, assigned_by: user?.id });
      if (error) {
        if (error.code === '23505') throw new Error('Bereits im Team');
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: 'Team-Mitglied hinzugefügt' });
      queryClient.invalidateQueries({ queryKey: ['admin-team-roles'] });
      setAddOpen(false);
      setSearchEmail('');
      setNewRole('viewer');
    },
    onError: (err: Error) => {
      toast({ title: err.message || 'Fehler', variant: 'destructive' });
    },
  });

  // Update role
  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: AdminRole }) => {
      const { error } = await supabase
        .from('admin_team')
        .update({ admin_role: role })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Rolle aktualisiert' });
      queryClient.invalidateQueries({ queryKey: ['admin-team-roles'] });
    },
    onError: () => {
      toast({ title: 'Fehler beim Aktualisieren', variant: 'destructive' });
    },
  });

  // Remove member
  const removeMember = useMutation({
    mutationFn: async (member: TeamMember) => {
      const { error } = await supabase
        .from('admin_team')
        .delete()
        .eq('id', member.id);
      if (error) throw error;

      // Also remove admin role from user_roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', member.userId)
        .eq('role', 'admin');
    },
    onSuccess: () => {
      toast({ title: 'Team-Mitglied entfernt' });
      queryClient.invalidateQueries({ queryKey: ['admin-team-roles'] });
      setRemoveTarget(null);
    },
    onError: () => {
      toast({ title: 'Fehler beim Entfernen', variant: 'destructive' });
    },
  });

  if (roleLoading) {
    return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team-Verwaltung</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Verwalte Admin-Zugänge und Rollen für dein Team
          </p>
        </div>

        {isOwner && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <UserPlus className="w-4 h-4" />
                Mitglied hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Team-Mitglied hinzufügen</DialogTitle>
                <DialogDescription>
                  Suche einen registrierten Nutzer und weise eine Rolle zu.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>E-Mail suchen</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="name@email.de"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Rolle</Label>
                  <Select value={newRole} onValueChange={(v) => setNewRole(v as AdminRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(['tech', 'support', 'moderator', 'viewer'] as AdminRole[]).map((role) => (
                        <SelectItem key={role} value={role}>
                          <span className="flex items-center gap-2">
                            {ROLE_ICONS[role]}
                            <span>{ADMIN_ROLE_LABELS[role]}</span>
                            <span className="text-muted-foreground text-xs">– {ADMIN_ROLE_DESCRIPTIONS[role]}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {searching && <Skeleton className="h-12 w-full" />}

                {searchResults && searchResults.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {searchResults.map((u) => (
                      <div key={u.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
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
                          onClick={() => addMember.mutate({ userId: u.id, role: newRole })}
                          disabled={addMember.isPending}
                        >
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Hinzufügen
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {searchEmail.length >= 3 && !searching && searchResults?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Kein Nutzer gefunden oder bereits im Team.
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-2">
        {(['owner', 'tech', 'support', 'moderator', 'viewer'] as AdminRole[]).map((role) => (
          <Badge key={role} variant="outline" className={`text-xs gap-1 ${ROLE_COLORS[role]}`}>
            {ROLE_ICONS[role]}
            {ADMIN_ROLE_LABELS[role]}
          </Badge>
        ))}
      </div>

      {/* Team list */}
      <Card className="bg-card/80 backdrop-blur border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            {team?.length || 0} Team-Mitglieder
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {(team || []).map((member) => {
                const isSelf = member.userId === user?.id;
                const isTargetOwner = member.adminRole === 'owner';

                return (
                  <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.avatarUrl || undefined} referrerPolicy="no-referrer" />
                      <AvatarFallback className="text-xs">{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                        {isSelf && <Badge variant="outline" className="text-[10px]">Du</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>

                    {/* Role selector or badge */}
                    {isOwner && !isSelf && !isTargetOwner ? (
                      <Select
                        value={member.adminRole}
                        onValueChange={(v) => updateRole.mutate({ id: member.id, role: v as AdminRole })}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(['tech', 'support', 'moderator', 'viewer'] as AdminRole[]).map((role) => (
                            <SelectItem key={role} value={role}>
                              <span className="flex items-center gap-1">
                                {ROLE_ICONS[role]}
                                {ADMIN_ROLE_LABELS[role]}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={`text-xs gap-1 ${ROLE_COLORS[member.adminRole]}`}>
                        {ROLE_ICONS[member.adminRole]}
                        {ADMIN_ROLE_LABELS[member.adminRole]}
                      </Badge>
                    )}

                    {/* Remove button - only for owners, can't remove other owners or self */}
                    {isOwner && !isSelf && !isTargetOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setRemoveTarget(member)}
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

      {/* Permission matrix info */}
      <Card className="bg-card/80 backdrop-blur border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Berechtigungsübersicht
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Berechtigung</th>
                  {(['owner', 'tech', 'support', 'moderator', 'viewer'] as AdminRole[]).map((role) => (
                    <th key={role} className="text-center py-2 px-2 font-medium text-muted-foreground">
                      {ADMIN_ROLE_LABELS[role]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Team verwalten', key: 'canManageTeam' },
                  { label: 'Nutzer einsehen', key: 'canViewUsers' },
                  { label: 'Analytics', key: 'canViewAnalytics' },
                  { label: 'Moderieren', key: 'canModerate' },
                  { label: 'Fehler einsehen', key: 'canViewErrors' },
                  { label: 'System Health', key: 'canViewSystemHealth' },
                  { label: 'Partner verwalten', key: 'canManagePartners' },
                ].map((perm) => (
                  <tr key={perm.key} className="border-b border-border/20">
                    <td className="py-2 pr-4 text-foreground">{perm.label}</td>
                    {(['owner', 'tech', 'support', 'moderator', 'viewer'] as AdminRole[]).map((role) => {
                      const perms = {
                        owner: { canManageTeam: true, canViewUsers: true, canViewAnalytics: true, canModerate: true, canViewErrors: true, canViewSystemHealth: true, canManagePartners: true },
                        tech: { canManageTeam: false, canViewUsers: true, canViewAnalytics: true, canModerate: true, canViewErrors: true, canViewSystemHealth: true, canManagePartners: true },
                        support: { canManageTeam: false, canViewUsers: true, canViewAnalytics: true, canModerate: false, canViewErrors: true, canViewSystemHealth: false, canManagePartners: false },
                        moderator: { canManageTeam: false, canViewUsers: false, canViewAnalytics: true, canModerate: true, canViewErrors: false, canViewSystemHealth: false, canManagePartners: true },
                        viewer: { canManageTeam: false, canViewUsers: false, canViewAnalytics: false, canModerate: false, canViewErrors: false, canViewSystemHealth: false, canManagePartners: false },
                      };
                      const has = perms[role][perm.key as keyof typeof perms.owner];
                      return (
                        <td key={role} className="text-center py-2 px-2">
                          {has ? (
                            <span className="text-green-500">✓</span>
                          ) : (
                            <span className="text-muted-foreground/40">–</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Code-Zugriff (Lovable Editor) wird separat über die Plattform-Einstellungen gesteuert.
          </p>
        </CardContent>
      </Card>

      {/* Remove confirmation */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Team-Mitglied entfernen?</AlertDialogTitle>
            <AlertDialogDescription>
              {removeTarget?.name} verliert den Admin-Zugang vollständig und kann nicht mehr auf das Admin-Dashboard zugreifen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeTarget && removeMember.mutate(removeTarget)}
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
