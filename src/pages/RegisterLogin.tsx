
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Sparkles, AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useInputValidation, validationRules } from '@/hooks/useInputValidation';
import { sanitizeName, sanitizeEmail } from '@/utils/inputSanitization';

const RegisterLogin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signUp, signIn } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dynamic validation configuration based on mode
  const validationConfig = React.useMemo(() => ({
    email: validationRules.email,
    password: { required: true, minLength: 6, maxLength: 128 },
    ...(isLogin ? {} : { name: validationRules.name })
  }), [isLogin]);

  // Input validation
  const { errors, validateField, validateAll, clearErrors } = useInputValidation(validationConfig);

  React.useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedName = sanitizeName(name);
    
    // Validate inputs
    const values = { 
      email: sanitizedEmail, 
      password,
      ...(isLogin ? {} : { name: sanitizedName })
    };
    
    if (!validateAll(values)) {
      setLoading(false);
      return;
    }
    
    try {
      if (isLogin) {
        const { error } = await signIn(sanitizedEmail, password);
        if (error) {
          setError(error.message || 'Login failed');
        } else {
          navigate('/home');
        }
      } else {
        const { error } = await signUp(sanitizedEmail, password, { name: sanitizedName });
        if (error) {
          setError(error.message || 'Signup failed');
        } else {
          navigate('/home');
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(error?.message || 'An unexpected error occurred');
    }
    
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto space-y-6 animate-fade-in">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-pink-400 to-rose-500 rounded-full p-4 shadow-lg">
              <Heart className="w-12 h-12 text-white" fill="currentColor" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground">VybePulse</h1>
          <p className="text-lg text-muted-foreground">
            Ready to Create Unforgettable Memories?
          </p>
        </div>

        {/* Auth Form */}
        <Card className="bg-card shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-foreground">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isLogin 
                ? 'Sign in to discover amazing date spots' 
                : 'Start your journey to perfect dates'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {(error || Object.keys(errors).length > 0) && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md text-red-700 dark:text-red-300 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error || Object.values(errors)[0]}
                </div>
              )}
              
              {!isLogin && (
                <div>
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      validateField('name', e.target.value);
                    }}
                    required
                    className={`h-12 ${errors.name ? 'border-red-300 dark:border-red-700' : ''}`}
                    disabled={loading}
                    maxLength={100}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.name}</p>
                  )}
                </div>
              )}
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    validateField('email', e.target.value);
                  }}
                  required
                  className={`h-12 ${errors.email ? 'border-red-300 dark:border-red-700' : ''}`}
                  disabled={loading}
                  maxLength={254}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    validateField('password', e.target.value);
                  }}
                  required
                  className={`h-12 ${errors.password ? 'border-red-300 dark:border-red-700' : ''}`}
                  minLength={6}
                  maxLength={128}
                  disabled={loading}
                />
                {errors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.password}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white font-semibold border-0"
                disabled={loading}
              >
                {loading ? (
                  <LoadingSpinner size="sm" text={isLogin ? 'Signing In...' : 'Creating Account...'} />
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  clearErrors();
                  // Clear form fields when switching modes to prevent stale data
                  setName('');
                  setEmail('');
                  setPassword('');
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                disabled={loading}
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'
                }
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterLogin;