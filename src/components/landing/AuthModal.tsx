import { useState, useEffect, useMemo } from 'react';
import { hasMoodToday } from '@/pages/MoodCheckIn';
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
import { Loader2, Gift, Store } from 'lucide-react';
import { validateReferralCode, processReferralSignup } from '@/services/referralService';
import { useToast } from '@/hooks/use-toast';

// Google icon SVG component
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" className="mr-2">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

// Apple icon SVG component
const AppleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="mr-2">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPartner?: () => void;
}

export function AuthModal({ isOpen, onClose, onOpenPartner }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, signUp, signInWithGoogle, signInWithApple, user } = useAuth();
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

  // Handle pending referral after OAuth callback
  useEffect(() => {
    const processPendingReferral = async () => {
      const pendingReferral = localStorage.getItem('pendingReferralCode');
      if (pendingReferral && user) {
        try {
          const success = await processReferralSignup(pendingReferral, user.id);
          if (success) {
            toast({
              title: 'Welcome bonus! 🎉',
              description: 'You earned 10 bonus points from your referral!',
            });
          }
        } catch (err) {
          console.error('Failed to process pending referral:', err);
        } finally {
          localStorage.removeItem('pendingReferralCode');
        }
      }
    };
    processPendingReferral();
  }, [user, toast]);

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
      navigate(hasMoodToday() ? '/home' : '/mood');
    }
  }, [user, navigate, onClose]);

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    // Store referral code before OAuth redirect
    if (referralCode && referralValid) {
      localStorage.setItem('pendingReferralCode', referralCode);
    }

    try {
      const { error: oauthError } = await signInWithGoogle();
      if (oauthError) {
        setError(getOAuthErrorMessage(oauthError));
        setGoogleLoading(false);
      }
      // Note: On success, page will redirect to Google
    } catch (err) {
      setError('Failed to connect to Google. Please try again.');
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError('');
    setAppleLoading(true);

    // Store referral code before OAuth redirect
    if (referralCode && referralValid) {
      localStorage.setItem('pendingReferralCode', referralCode);
    }

    try {
      const { error: oauthError } = await signInWithApple();
      if (oauthError) {
        setError(getOAuthErrorMessage(oauthError));
        setAppleLoading(false);
      }
      // Note: On success, page will redirect to Apple
    } catch (err) {
      setError('Failed to connect to Apple. Please try again.');
      setAppleLoading(false);
    }
  };

  const getOAuthErrorMessage = (error: any): string => {
    const errorMessage = error?.message?.toLowerCase() || '';
    if (errorMessage.includes('access_denied') || errorMessage.includes('cancelled')) {
      return 'Sign in was cancelled';
    }
    if (errorMessage.includes('invalid_request')) {
      return 'Unable to connect to provider. Please try again.';
    }
    if (errorMessage.includes('timeout')) {
      return 'Connection timed out. Please try again.';
    }
    return 'An error occurred. Please try email sign in.';
  };

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
            navigate(hasMoodToday() ? '/home' : '/mood');
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

  const isOAuthLoading = googleLoading || appleLoading;

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

            <div className="mt-8 space-y-6">
              {/* Social Login Buttons */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={loading || isOAuthLoading}
                  className="w-full h-12 bg-card hover:bg-muted border-border text-foreground font-medium"
                >
                  {googleLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  Continue with Google
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAppleSignIn}
                  disabled={loading || isOAuthLoading}
                  className="w-full h-12 bg-black dark:bg-white text-white dark:text-black hover:opacity-90 border-0 font-medium"
                >
                  {appleLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <AppleIcon />
                  )}
                  Continue with Apple
                </Button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    or continue with email
                  </span>
                </div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
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
                      autoComplete="name"
                      className="h-12 bg-background/50 border-border/50 focus:border-primary transition-colors"
                      disabled={loading || isOAuthLoading}
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
                    autoComplete="email"
                    className="h-12 bg-background/50 border-border/50 focus:border-primary transition-colors"
                    disabled={loading || isOAuthLoading}
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
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    className="h-12 bg-background/50 border-border/50 focus:border-primary transition-colors"
                    disabled={loading || isOAuthLoading}
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
                      disabled={loading || isOAuthLoading}
                      maxLength={8}
                    />
                    {referralValid === true && (
                      <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
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
                  disabled={loading || isOAuthLoading}
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

              <div className="text-center">
                <button
                  type="button"
                  onClick={toggleMode}
                  disabled={loading || isOAuthLoading}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
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

              {/* Become a Partner CTA */}
              {onOpenPartner && (
                <div className="pt-2 border-t border-border/30">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPartner();
                    }}
                    disabled={loading || isOAuthLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    <Store className="w-4 h-4" />
                    <span>Venue-Besitzer?</span>
                    <span className="text-primary font-semibold">Werde jetzt Partner</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
