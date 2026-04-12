import React from 'react';
import { useAdminRole, AdminPermissions } from '@/hooks/useAdminRole';
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AdminPermissionGuardProps {
  permission: keyof AdminPermissions;
  children: React.ReactNode;
  fallbackMessage?: string;
}

export function AdminPermissionGuard({ permission, children, fallbackMessage }: AdminPermissionGuardProps) {
  const { permissions, loading, adminRole } = useAdminRole();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  // If user has no admin_team entry, show all pages (backward compat for admins without team entry)
  if (!adminRole) {
    return <>{children}</>;
  }

  if (!permissions[permission]) {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="max-w-sm bg-card/80 backdrop-blur border-border/40">
          <CardContent className="p-8 text-center space-y-4">
            <ShieldAlert className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <div>
              <h2 className="text-lg font-semibold">Kein Zugriff</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {fallbackMessage || 'Du hast keine Berechtigung, diese Seite zu sehen. Wende dich an einen Owner.'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
              Zurück zum Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
