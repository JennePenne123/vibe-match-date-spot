import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Hidden admin entry point.
 * - Not in sitemap, not linked anywhere, noindex.
 * - Sends a passwordless magic link only if email is in admin_team.
 * - Authenticated admins are forwarded to /admin automatically.
 */
const Control = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = 'Control';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow, noarchive';
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  useEffect(() => {
    if (!authLoading && !roleLoading && user && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [authLoading, roleLoading, user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await supabase.functions.invoke('admin-login-request', {
        body: {
          email: email.trim().toLowerCase(),
          redirectTo: `${window.location.origin}/admin`,
        },
      });
    } catch {
      // intentionally swallow – generic response only
    } finally {
      setSent(true);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Control</h1>
          <p className="text-xs text-muted-foreground">Restricted access</p>
        </div>

        {sent ? (
          <div className="rounded-xl border border-border/40 bg-card/60 p-4 text-sm text-muted-foreground text-center">
            If this address is authorized, a sign-in link has been sent.
            Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              required
              autoComplete="off"
              autoFocus
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={submitting || !email}
            >
              {submitting ? 'Sending…' : 'Request link'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Control;