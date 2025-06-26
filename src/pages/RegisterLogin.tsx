
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Heart, Sparkles, AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToastActions } from '@/hooks/useToastActions';
import { authSchema, type AuthFormData } from '@/lib/validations';

const RegisterLogin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signUp, signIn } = useAuth();
  const { showError, showSuccess } = useToastActions();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  });

  React.useEffect(() => {
    if (user) {
      navigate('/home');
    }
  }, [user, navigate]);

  const onSubmit = async (data: AuthFormData) => {
    setLoading(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(data.email, data.password);
        if (error) {
          showError('Login Failed', error.message || 'Unable to sign in. Please try again.');
        } else {
          showSuccess('Welcome back!', 'You have successfully signed in.');
          navigate('/home');
        }
      } else {
        if (!data.name?.trim()) {
          showError('Name Required', 'Please enter your name to create an account.');
          setLoading(false);
          return;
        }
        const { error } = await signUp(data.email, data.password, { name: data.name });
        if (error) {
          showError('Signup Failed', error.message || 'Unable to create account. Please try again.');
        } else {
          showSuccess('Account Created!', 'Welcome to DateSpot! You can now start discovering amazing dates.');
          navigate('/home');
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      showError('Authentication Error', error?.message || 'An unexpected error occurred. Please try again.');
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {!isLogin && (
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Full Name"
                            className="h-12"
                            disabled={loading}
                            aria-label="Full Name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Email"
                          className="h-12"
                          disabled={loading}
                          aria-label="Email Address"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Password"
                          className="h-12"
                          disabled={loading}
                          aria-label="Password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full h-12 bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white font-semibold border-0"
                  disabled={loading}
                  aria-label={isLogin ? 'Sign In' : 'Create Account'}
                >
                  {loading ? (
                    <LoadingSpinner size="sm" text={isLogin ? 'Signing In...' : 'Creating Account...'} />
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  form.reset();
                }}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 rounded"
                disabled={loading}
                aria-label={isLogin ? "Switch to sign up" : "Switch to sign in"}
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
