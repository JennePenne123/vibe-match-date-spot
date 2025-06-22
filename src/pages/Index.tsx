import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Sparkles, AlertCircle, User } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (user) {
      navigate('/welcome');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Mock authentication - always succeed
      if (isLogin) {
        // Mock login success
        console.log('Mock login successful');
      } else {
        if (!name.trim()) {
          setError('Name is required');
          setLoading(false);
          return;
        }
        // Mock signup success
        console.log('Mock signup successful');
      }
      
      // Navigate to welcome page after successful auth
      navigate('/welcome');
    } catch (error) {
      console.error('Authentication error:', error);
      setError('An unexpected error occurred');
    }
    
    setLoading(false);
  };

  const handleDemoMode = () => {
    // Skip authentication entirely and go directly to welcome page
    navigate('/welcome?demo=true');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vyy-soft to-vyy-glow flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-600">
          <Sparkles className="w-5 h-5 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to welcome
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vyy-soft via-vyy-glow to-vyy-warm flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto space-y-8 animate-fade-in">
        {/* Logo and Header */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="organic-blob p-6 shadow-2xl animate-float animate-pulse-glow">
              <Heart className="w-16 h-16 text-white animate-pulse" fill="currentColor" />
            </div>
          </div>
          <div className="space-y-3">
            <h1 className="text-5xl font-bold text-expressive text-organic">vyybmtch</h1>
            <p className="text-xl text-gray-800 font-medium">
              Where Hearts Connect ✨
            </p>
            <p className="text-gray-700 leading-relaxed">
              Discover magical moments with AI-powered connections that understand your vibe
            </p>
          </div>
        </div>

        {/* Auth Form */}
        <Card className="organic-card bg-white/80 backdrop-blur-sm shadow-2xl border-0">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-gray-900 text-organic">
              {isLogin ? 'Welcome Back' : 'Join the Magic'}
            </CardTitle>
            <CardDescription className="text-gray-700">
              {isLogin 
                ? 'Ready to create more beautiful memories?' 
                : 'Start your journey to perfect connections'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              
              {!isLogin && (
                <div>
                  <Input
                    type="text"
                    placeholder="Your beautiful name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-14 rounded-2xl border-gray-200 focus:border-vyy-coral transition-all"
                  />
                </div>
              )}
              <div>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 rounded-2xl border-gray-200 focus:border-vyy-coral transition-all"
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-14 rounded-2xl border-gray-200 focus:border-vyy-coral transition-all"
                  minLength={6}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-14 bg-vyy-primary hover:opacity-90 text-white font-semibold border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all text-lg"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 animate-spin" />
                    {isLogin ? 'Signing In...' : 'Creating Magic...'}
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-sm text-gray-600 hover:text-vyy-coral transition-colors font-medium"
              >
                {isLogin 
                  ? "New here? Join the magic" 
                  : 'Already part of vyybmtch? Sign in'
                }
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Demo Mode Button */}
        <div className="text-center">
          <Button
            onClick={handleDemoMode}
            variant="ghost"
            className="text-gray-700 hover:text-vyy-coral hover:bg-white/50 text-sm rounded-2xl"
          >
            <User className="w-4 h-4 mr-2" />
            Explore Demo
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
