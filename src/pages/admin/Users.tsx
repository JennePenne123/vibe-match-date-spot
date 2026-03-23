import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { STALE_TIMES } from '@/config/queryConfig';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users as UsersIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getInitials } from '@/lib/utils';

const AdminUsers: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, created_at, is_paused')
        .order('created_at', { ascending: false })
        .limit(200);

      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      const roleMap = new Map<string, string[]>();
      (roles || []).forEach((r) => {
        const existing = roleMap.get(r.user_id) || [];
        existing.push(r.role);
        roleMap.set(r.user_id, existing);
      });

      return (profiles || []).map((p) => ({
        ...p,
        roles: roleMap.get(p.id) || ['regular'],
      }));
    },
    staleTime: STALE_TIMES.ADMIN,
  });

  const filtered = search
    ? (users || []).filter((u) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('admin.usersTitle', 'Nutzer-Übersicht')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('admin.usersSubtitle', 'Alle registrierten Nutzer und deren Rollen')}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.searchUsers', 'Nutzer suchen...')}
          className="pl-9"
        />
      </div>

      <Card className="bg-card/80 backdrop-blur border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <UsersIcon className="w-5 h-5" />
            {filtered.length} {t('admin.usersCount', 'Nutzer')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-2">
                {filtered.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={user.avatar_url || undefined} referrerPolicy="no-referrer" />
                      <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {user.roles.map((role: string) => (
                        <Badge key={role} variant={role === 'admin' ? 'destructive' : role === 'venue_partner' ? 'default' : 'secondary'} className="text-xs">
                          {role}
                        </Badge>
                      ))}
                      {user.is_paused && (
                        <Badge variant="outline" className="text-xs text-amber-400 border-amber-400/40">
                          Pausiert
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {new Date(user.created_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
