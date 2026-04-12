import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AdminRole = 'owner' | 'tech' | 'support' | 'moderator' | 'viewer';

export interface AdminPermissions {
  canManageTeam: boolean;       // owner only
  canViewUsers: boolean;        // owner, tech, support
  canModerate: boolean;         // owner, tech, moderator
  canViewAnalytics: boolean;    // all roles
  canViewErrors: boolean;       // owner, tech, support
  canViewSystemHealth: boolean; // owner, tech
  canManagePartners: boolean;   // owner, tech, moderator
}

const ROLE_PERMISSIONS: Record<AdminRole, AdminPermissions> = {
  owner: {
    canManageTeam: true,
    canViewUsers: true,
    canModerate: true,
    canViewAnalytics: true,
    canViewErrors: true,
    canViewSystemHealth: true,
    canManagePartners: true,
  },
  tech: {
    canManageTeam: false,
    canViewUsers: true,
    canModerate: true,
    canViewAnalytics: true,
    canViewErrors: true,
    canViewSystemHealth: true,
    canManagePartners: true,
  },
  support: {
    canManageTeam: false,
    canViewUsers: true,
    canModerate: false,
    canViewAnalytics: true,
    canViewErrors: true,
    canViewSystemHealth: false,
    canManagePartners: false,
  },
  moderator: {
    canManageTeam: false,
    canViewUsers: false,
    canModerate: true,
    canViewAnalytics: true,
    canViewErrors: false,
    canViewSystemHealth: false,
    canManagePartners: true,
  },
  viewer: {
    canManageTeam: false,
    canViewUsers: false,
    canModerate: false,
    canViewAnalytics: true,
    canViewErrors: false,
    canViewSystemHealth: false,
    canManagePartners: false,
  },
};

const DEFAULT_PERMISSIONS: AdminPermissions = {
  canManageTeam: false,
  canViewUsers: false,
  canModerate: false,
  canViewAnalytics: false,
  canViewErrors: false,
  canViewSystemHealth: false,
  canManagePartners: false,
};

export function useAdminRole() {
  const { user, loading: authLoading } = useAuth();
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [permissions, setPermissions] = useState<AdminPermissions>(DEFAULT_PERMISSIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setAdminRole(null);
      setPermissions(DEFAULT_PERMISSIONS);
      setLoading(false);
      return;
    }

    let active = true;

    const fetch = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_team')
          .select('admin_role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!active) return;

        if (error || !data) {
          // Fallback: if user has admin role but no admin_team entry, treat as viewer
          setAdminRole(null);
          setPermissions(DEFAULT_PERMISSIONS);
        } else {
          const role = data.admin_role as AdminRole;
          setAdminRole(role);
          setPermissions(ROLE_PERMISSIONS[role] || DEFAULT_PERMISSIONS);
        }
      } catch {
        if (active) {
          setAdminRole(null);
          setPermissions(DEFAULT_PERMISSIONS);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetch();
    return () => { active = false; };
  }, [authLoading, user?.id]);

  return {
    adminRole,
    permissions,
    loading,
    isOwner: adminRole === 'owner',
  };
}

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  owner: 'Owner',
  tech: 'Tech-Support',
  support: 'Support',
  moderator: 'Moderator',
  viewer: 'Viewer',
};

export const ADMIN_ROLE_DESCRIPTIONS: Record<AdminRole, string> = {
  owner: 'Voller Zugriff + Rollenvergabe',
  tech: 'Voller Dashboard-Zugriff, Code über Lovable',
  support: 'Nutzer, Tickets & Fehler einsehen',
  moderator: 'Inhalte moderieren & Partner verwalten',
  viewer: 'Nur Analytics einsehen (read-only)',
};
