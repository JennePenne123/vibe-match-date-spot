
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Sparkles } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { user, login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (user) {
      navigate('/welcome');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }
    
    setLoading(false);
  };

  if (user) {
    return null; // Will redirect to welcome
  }

  return (
    <div className="min-h-screen bg-datespot-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Logo and Header */}
        <div className="text-center text-white space-y-4">
          <div className="flex justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
              <Heart className="w-12 h-12 text-white" fill="currentColor" />
            </div>
          </div>
          <h1 className="text-4xl font-bold">DateSpot</h1>
          <p className="text-lg text-white/90">
            Ready to Create Unforgettable Memories?
          </p>
          <p className="text-white/80">
            Join thousands of couples discovering their perfect date spots with AI-powered recommendations
          </p>
        </div>

        {/* Auth Form */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Sign in to discover amazing date spots' 
                : 'Start your journey to perfect dates'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-12"
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
                />
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-datespot-gradient hover:opacity-90 text-white font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-spin" />
                    {isLogin ? 'Signing In...' : 'Creating Account...'}
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'
                }
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Demo Button */}
        <Button
          onClick={() => login('demo@datespot.app', 'demo')}
          variant="outline"
          className="w-full bg-white/20 border-white/30 text-white hover:bg-white/30"
        >
          Try Demo Account
        </Button>
      </div>
    </div>
  );
};

export default Index;
