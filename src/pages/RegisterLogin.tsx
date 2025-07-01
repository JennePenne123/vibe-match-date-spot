
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IS_MOCK_MODE } from '@/utils/mockMode';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Sparkles, AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

// Conditionally import the hooks
import { useAuth } from '@/contexts/AuthContext';
import { useMockAuth } from '@/contexts/MockAuthContext';

const RegisterLogin = () => {
  const navigate = useNavigate();
  
  // Use the appropriate auth hook based on mode
  const authHook = IS_MOCK_MODE ? useMockAuth() : useAuth();
  const { user, loading: authLoading, signUp, signIn } = authHook;
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message || 'Login failed');
        } else {
          navigate('/home');
        }
      } else {
        if (!name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, { name });
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto space-y-6 animate-fade-in">
        {/* Logo and Header */}
        <div className="text-center space-y-4">
          {IS_MOCK_MODE && (
            <div className="bg-yellow-100 border border-yellow-300 rounded-md p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Mock Mode:</strong> Use any email/password to test
              </p>
            </div>
          )}
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-pink-400 to-rose-500 rounded-full p-4 shadow-lg">
              <Heart className="w-12 h-12 text-white" fill="currentColor" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900">DateSpot</h1>
          <p className="text-lg text-gray-700">
            Ready to Create Unforgettable Memories?
          </p>
        </div>

        {/* Auth Form */}
        <Card className="bg-white shadow-xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isLogin 
                ? 'Sign in to discover amazing date spots' 
                : 'Start your journey to perfect dates'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              
              {!isLogin && (
                <div>
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-12"
                    disabled={loading}
                  />
                </div>
              )}
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                  disabled={loading}
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12"
                  minLength={6}
                  disabled={loading}
                />
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
                }}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
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
