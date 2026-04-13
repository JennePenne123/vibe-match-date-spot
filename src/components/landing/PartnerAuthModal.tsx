import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Building2, Mail } from 'lucide-react';

interface PartnerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PartnerAuthModal({ isOpen, onClose }: PartnerAuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { t } = useTranslation();
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkPartnerRole = async () => {
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleData?.role === 'venue_partner' || roleData?.role === 'admin') {
          onClose();
          navigate('/partner');
        } else {
          setError(t('partnerAuth.errorNotPartner'));
        }
      }
    };

    if (isOpen && user) {
      checkPartnerRole();
    }
  }, [user, isOpen, navigate, onClose, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError(t('partnerAuth.errorEmpty'));
      return;
    }

    setLoading(true);

    try {
      const { user: signedInUser, error: signInError } = await signIn(email.trim().toLowerCase(), password);
      
      if (signInError) {
        setError(signInError.message || t('partnerAuth.errorUnexpected'));
        setLoading(false);
        return;
      }

      if (signedInUser) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', signedInUser.id)
          .maybeSingle();

        if (roleData?.role === 'venue_partner' || roleData?.role === 'admin') {
          onClose();
          navigate('/partner');
        } else {
          setError(t('partnerAuth.errorNotPartnerDetail'));
          setLoading(false);
        }
      }
    } catch (err) {
      setError(t('partnerAuth.errorUnexpected'));
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-amber-500/10 pointer-events-none" />
          
          <div className="relative p-6 sm:p-8">
            <DialogHeader className="space-y-3 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg mb-2">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 bg-clip-text text-transparent">
                {t('partnerAuth.title')}
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                {t('partnerAuth.description')}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="partner-email" className="text-foreground font-medium">
                  {t('partnerAuth.email')}
                </Label>
                <Input
                  id="partner-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('partnerAuth.emailPlaceholder')}
                  className="h-12 bg-background/50 border-border/50 focus:border-orange-500 transition-colors"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="partner-password" className="text-foreground font-medium">
                  {t('partnerAuth.password')}
                </Label>
                <Input
                  id="partner-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('partnerAuth.passwordPlaceholder')}
                  className="h-12 bg-background/50 border-border/50 focus:border-orange-500 transition-colors"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive text-center">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 transition-opacity text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {t('partnerAuth.signingIn')}
                  </>
                ) : (
                  t('partnerAuth.submit')
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/50 text-center">
              <p className="text-sm text-muted-foreground">
                {t('partnerAuth.becomePartner')}
              </p>
              <a 
                href="mailto:partners@hioutz.app" 
                className="inline-flex items-center gap-1 text-sm text-orange-500 hover:text-orange-600 font-medium mt-1 transition-colors"
              >
                <Mail className="w-4 h-4" />
                {t('partnerAuth.contactUs')}
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
