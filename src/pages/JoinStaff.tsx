import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, XCircle, LogIn, Sparkles } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

export default function JoinStaff() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const _toast = useToast();

  const partnerId = searchParams.get('partner');
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'auth_required' | 'form' | 'success' | 'error'>('loading');
  const [partnerName, setPartnerName] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!partnerId && !token) {
      setStatus('error');
      setErrorMessage('Ungültiger Einladungslink.');
      return;
    }

    if (!user) {
      setStatus('auth_required');
      return;
    }

    // Pre-fill email from user profile
    setStaffEmail(user.email || '');

    // Fetch partner info
    const fetchPartner = async () => {
      const pid = partnerId || '';

      // If token-based, look up the staff record
      if (token) {
        const { data: staffRecord } = await supabase
          .from('venue_staff')
          .select('partner_id, name, email, status')
          .eq('qr_code_token', token)
          .maybeSingle();

        if (!staffRecord) {
          setStatus('error');
          setErrorMessage('Einladung nicht gefunden oder abgelaufen.');
          return;
        }

        if (staffRecord.status === 'active') {
          setStatus('error');
          setErrorMessage('Diese Einladung wurde bereits angenommen.');
          return;
        }

        // Auto-accept the invitation
        const { error } = await supabase
          .from('venue_staff')
          .update({
            user_id: user.id,
            status: 'active',
            accepted_at: new Date().toISOString(),
          })
          .eq('qr_code_token', token);

        if (error) {
          setStatus('error');
          setErrorMessage('Fehler beim Beitreten.');
          return;
        }

        setStaffName(staffRecord.name);
        setStatus('success');
        return;
      }

      // QR-scan based: show form
      const { data: profile } = await supabase
        .from('partner_profiles')
        .select('business_name')
        .eq('user_id', pid)
        .maybeSingle();

      setPartnerName(profile?.business_name || 'Partner');
      setStatus('form');
    };

    fetchPartner();
  }, [authLoading, user, partnerId, token]);

  const handleJoin = async () => {
    if (!staffName.trim() || !user || !partnerId) return;
    setSubmitting(true);

    try {
      // Check if already staff for this partner
      const { data: existing } = await supabase
        .from('venue_staff')
        .select('id, status')
        .eq('partner_id', partnerId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        if (existing.status === 'active') {
          setStatus('error');
          setErrorMessage('Du bist bereits als Mitarbeiter registriert.');
        } else if (existing.status === 'deactivated') {
          setStatus('error');
          setErrorMessage('Dein Zugang wurde deaktiviert. Bitte kontaktiere deinen Partner.');
        }
        setSubmitting(false);
        return;
      }

      // Also check by email
      const { data: existingByEmail } = await supabase
        .from('venue_staff')
        .select('id, status')
        .eq('partner_id', partnerId)
        .eq('email', staffEmail)
        .maybeSingle();

      if (existingByEmail) {
        // Link to existing invitation
        const { error } = await supabase
          .from('venue_staff')
          .update({
            user_id: user.id,
            name: staffName.trim(),
            status: 'active',
            accepted_at: new Date().toISOString(),
          })
          .eq('id', existingByEmail.id);

        if (error) throw error;
        setStatus('success');
        setSubmitting(false);
        return;
      }

      // Create new staff record (pending partner confirmation via status 'active' directly from QR)
      const { error } = await supabase
        .from('venue_staff')
        .insert({
          partner_id: partnerId,
          user_id: user.id,
          email: staffEmail,
          name: staffName.trim(),
          staff_role: 'staff',
          status: 'active',
          accepted_at: new Date().toISOString(),
        });

      if (error) throw error;
      setStatus('success');
    } catch (err) {
      console.error('Join error:', err);
      setStatus('error');
      setErrorMessage('Fehler beim Beitreten. Bitte versuche es erneut.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading' || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-background to-muted/30">
      <Card variant="glass" className="max-w-md w-full">
        <CardContent className="p-6 sm:p-8 text-center space-y-6">
          {status === 'auth_required' && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg mx-auto">
                <Users className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Team beitreten</h1>
                <p className="text-muted-foreground text-sm mt-2">
                  Du musst dich anmelden, um dem Team beizutreten.
                </p>
              </div>
              <Button
                onClick={() => navigate(`/?auth=required&redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`)}
                className="w-full"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Anmelden / Registrieren
              </Button>
            </>
          )}

          {status === 'form' && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg mx-auto">
                <Users className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Team beitreten</h1>
                <Badge variant="outline" className="mt-2 gap-1">
                  <Sparkles className="w-3 h-3" />
                  {partnerName}
                </Badge>
                <p className="text-muted-foreground text-sm mt-2">
                  Gib deinen Namen ein, um als Mitarbeiter beizutreten.
                </p>
              </div>
              <div className="space-y-4 text-left">
                <div className="space-y-2">
                  <Label htmlFor="join-name">Dein Name</Label>
                  <Input
                    id="join-name"
                    placeholder="Max Mustermann"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="join-email">Deine E-Mail</Label>
                  <Input
                    id="join-email"
                    type="email"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    disabled
                  />
                  <p className="text-[11px] text-muted-foreground">Aus deinem Account übernommen</p>
                </div>
              </div>
              <Button onClick={handleJoin} disabled={submitting || !staffName.trim()} className="w-full">
                {submitting ? 'Wird beigetreten...' : 'Team beitreten'}
              </Button>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Willkommen im Team!</h1>
                <p className="text-muted-foreground text-sm mt-2">
                  Du bist jetzt als Mitarbeiter registriert. Du kannst ab sofort Voucher einlösen.
                </p>
              </div>
              <Button onClick={() => navigate('/staff/scan')} className="w-full">
                Zur App
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Fehler</h1>
                <p className="text-muted-foreground text-sm mt-2">{errorMessage}</p>
              </div>
              <Button variant="outline" onClick={() => navigate('/home')}>
                Zur Startseite
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
