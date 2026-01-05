import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInputValidation, validationRules } from '@/hooks/useInputValidation';
import { sanitizeName, sanitizeEmail } from '@/utils/inputSanitization';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Gift } from 'lucide-react';
import { validateReferralCode, processReferralSignup } from '@/services/referralService';
import { useToast } from '@/hooks/use-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Check for referral code in URL
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode && !isLogin) {
      setReferralCode(refCode.toUpperCase());
      validateReferralCode(refCode).then(result => {
        setReferralValid(result.valid);
      });
    }
  }, [searchParams, isLogin]);

  // Validate referral code as user types
  useEffect(() => {
    if (referralCode.length >= 8) {
      const timer = setTimeout(async () => {
        const result = await validateReferralCode(referralCode);
        setReferralValid(result.valid);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setReferralValid(null);
    }
  }, [referralCode]);

  // Dynamic validation config based on mode
  const validationConfig = useMemo(() => {
    if (isLogin) {
      return {
        email: validationRules.email,
        password: { required: true, minLength: 6 },
      };
    }
    return {
      name: validationRules.name,
      email: validationRules.email,
      password: { required: true, minLength: 6 },
    };
  }, [isLogin]);

  const { errors, validateAll, clearErrors } = useInputValidation(validationConfig);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      onClose();
      navigate('/home');
    }
  }, [user, navigate, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Sanitize inputs
    const sanitizedName = sanitizeName(name);
    const sanitizedEmail = sanitizeEmail(email);

    // Validate
    const values = isLogin 
      ? { email: sanitizedEmail, password }
      : { name: sanitizedName, email: sanitizedEmail, password };

    if (!validateAll(values)) {
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { user: signedInUser, error: signInError } = await signIn(sanitizedEmail, password);
        
        if (signInError) {
          setError(signInError.message || 'Failed to sign in');
          setLoading(false);
          return;
        }

        if (signedInUser) {
          // Check user role for proper routing
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', signedInUser.id)
            .maybeSingle();

          onClose();
          
          // Route partners/admins to partner dashboard
          if (roleData?.role === 'venue_partner' || roleData?.role === 'admin') {
            navigate('/partner');
          } else {
            navigate('/home');
          }
        }
      } else {
        const { user: signedUpUser, error: signUpError } = await signUp(
          sanitizedEmail,
          password,
          { name: sanitizedName }
        );

        if (signUpError) {
          setError(signUpError.message || 'Failed to sign up');
          setLoading(false);
          return;
        }

        if (signedUpUser) {
          // Process referral if valid code was provided
          if (referralCode && referralValid) {
            try {
              const success = await processReferralSignup(referralCode, signedUpUser.id);
              if (success) {
                toast({
                  title: 'Welcome bonus! 🎉',
                  description: 'You earned 10 bonus points from your referral!',
                });
              }
            } catch (err) {
              console.error('Failed to process referral:', err);
            }
          }
          onClose();
          navigate('/home');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setName('');
    setEmail('');
    setPassword('');
    setReferralCode('');
    setReferralValid(null);
    setError('');
    clearErrors();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-border/50 bg-background/95 backdrop-blur-xl">
        <div className="relative">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />
          
          <div className="relative p-6 sm:p-8">
            <DialogHeader className="space-y-3 text-center">
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                {isLogin ? 'Welcome Back' : 'Get Started'}
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                {isLogin 
                  ? 'Sign in to continue your journey' 
                  : 'Create an account to start planning amazing dates'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground font-medium">
                    Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="h-12 bg-background/50 border-border/50 focus:border-primary transition-colors"
                    disabled={loading}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="h-12 bg-background/50 border-border/50 focus:border-primary transition-colors"
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-12 bg-background/50 border-border/50 focus:border-primary transition-colors"
                  disabled={loading}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              {/* Referral Code Field - Only for Signup */}
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="referralCode" className="text-foreground font-medium flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" />
                    Referral Code
                    <span className="text-xs text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="referralCode"
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="Enter referral code"
                    className={`h-12 bg-background/50 border-border/50 focus:border-primary transition-colors font-mono uppercase ${
                      referralValid === true ? 'border-green-500 bg-green-500/5' : 
                      referralValid === false ? 'border-destructive bg-destructive/5' : ''
                    }`}
                    disabled={loading}
                    maxLength={8}
                  />
                  {referralValid === true && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      ✓ Valid code! You'll get 10 bonus points
                    </p>
                  )}
                  {referralValid === false && referralCode.length >= 8 && (
                    <p className="text-sm text-destructive">Invalid referral code</p>
                  )}
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive text-center">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {isLogin ? 'Signing in...' : 'Creating account...'}
                  </>
                ) : (
                  isLogin ? 'Sign In' : 'Sign Up'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin ? (
                  <>
                    Don't have an account?{' '}
                    <span className="text-primary font-semibold">Sign up</span>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <span className="text-primary font-semibold">Sign in</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
