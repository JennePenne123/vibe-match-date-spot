import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Heart, MapPin, Star, Users, Zap, Crown, Sparkles } from 'lucide-react';

const CinematicDesignShowcase = () => {
  return (
    <div className="min-h-screen bg-cinematic-surface-primary">
      {/* Hero Section with Dramatic Typography */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-cinematic-surface-primary via-cinematic-surface-secondary to-cinematic-brand-primary-900/10" />
        
        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cinematic-brand-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-cinematic-brand-accent-500/10 rounded-full blur-2xl" />
        
        <div className="relative z-10 container mx-auto px-6 py-24">
          <div className="text-center space-y-8">
            {/* Main headline with dramatic scale */}
            <h1 className="text-6xl md:text-8xl font-black text-cinematic-text-primary leading-none tracking-tight">
              Cinematic
              <span className="block text-transparent bg-gradient-to-r from-cinematic-brand-primary-400 to-cinematic-brand-primary-600 bg-clip-text">
                Design System
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-cinematic-text-secondary max-w-3xl mx-auto leading-relaxed">
              Premium, layered depth with translucent surfaces and dramatic contrast for the ultimate dating experience
            </p>
            
            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button 
                size="xl" 
                className="bg-gradient-to-r from-cinematic-brand-primary-500 to-cinematic-brand-primary-600 text-cinematic-surface-primary shadow-2xl hover:shadow-cinematic-glow-lg transition-all duration-500 border-0"
              >
                <Crown className="mr-2 h-5 w-5" />
                Experience Premium
              </Button>
              <Button 
                variant="outline" 
                size="xl"
                className="bg-cinematic-surface-glass backdrop-blur-lg border-cinematic-brand-primary-500/30 text-cinematic-text-primary hover:border-cinematic-brand-primary-500/60 transition-all duration-300"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Explore Features
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Glass Morphism Section */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-cinematic-text-primary mb-4">
              Glass Morphism UI
            </h2>
            <p className="text-lg text-cinematic-text-secondary">
              Translucent surfaces with layered depth and premium feel
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Glass Card 1 */}
            <Card className="bg-cinematic-surface-glass backdrop-blur-lg border-cinematic-surface-tertiary/20 shadow-2xl hover:shadow-cinematic-glow-md transition-all duration-500">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-cinematic-brand-primary-500 to-cinematic-brand-primary-600 rounded-xl flex items-center justify-center mb-4 shadow-cinematic-glow-sm">
                  <Heart className="h-6 w-6 text-cinematic-surface-primary" />
                </div>
                <CardTitle className="text-cinematic-text-primary text-xl">Premium Matching</CardTitle>
                <CardDescription className="text-cinematic-text-secondary">
                  AI-powered compatibility with cinematic presentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-cinematic-text-secondary">Compatibility</span>
                    <Badge className="bg-cinematic-brand-primary-500/20 text-cinematic-brand-primary-400 border-cinematic-brand-primary-500/30">
                      97%
                    </Badge>
                  </div>
                  <div className="w-full bg-cinematic-surface-tertiary rounded-full h-2">
                    <div className="bg-gradient-to-r from-cinematic-brand-primary-500 to-cinematic-brand-primary-400 h-2 rounded-full w-[97%] shadow-cinematic-glow-sm"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Glass Card 2 */}
            <Card className="bg-cinematic-surface-glass backdrop-blur-lg border-cinematic-surface-tertiary/20 shadow-2xl hover:shadow-cinematic-glow-md transition-all duration-500">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-cinematic-brand-accent-500 to-cinematic-brand-accent-600 rounded-xl flex items-center justify-center mb-4">
                  <MapPin className="h-6 w-6 text-cinematic-text-primary" />
                </div>
                <CardTitle className="text-cinematic-text-primary text-xl">Venue Discovery</CardTitle>
                <CardDescription className="text-cinematic-text-secondary">
                  Curated locations with immersive details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-cinematic-brand-primary-500" />
                    <span className="text-cinematic-text-primary font-medium">4.9</span>
                    <span className="text-cinematic-text-secondary">• 2.3k reviews</span>
                  </div>
                  <Button variant="ghost" size="sm" className="w-full text-cinematic-brand-primary-500 hover:bg-cinematic-brand-primary-500/10">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Glass Card 3 */}
            <Card className="bg-cinematic-surface-glass backdrop-blur-lg border-cinematic-surface-tertiary/20 shadow-2xl hover:shadow-cinematic-glow-md transition-all duration-500">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-cinematic-brand-secondary-500 to-cinematic-brand-secondary-600 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-cinematic-text-primary" />
                </div>
                <CardTitle className="text-cinematic-text-primary text-xl">Social Planning</CardTitle>
                <CardDescription className="text-cinematic-text-secondary">
                  Collaborative date planning with premium tools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex -space-x-2 mb-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 bg-gradient-to-br from-cinematic-brand-primary-500 to-cinematic-brand-primary-600 rounded-full border-2 border-cinematic-surface-secondary flex items-center justify-center text-xs font-medium text-cinematic-surface-primary">
                      {i}
                    </div>
                  ))}
                  <div className="w-8 h-8 bg-cinematic-surface-tertiary rounded-full border-2 border-cinematic-surface-secondary flex items-center justify-center">
                    <span className="text-xs text-cinematic-text-secondary">+5</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full border-cinematic-brand-primary-500/30 text-cinematic-brand-primary-500 hover:bg-cinematic-brand-primary-500/10">
                  Join Planning
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Typography Showcase */}
      <section className="py-24 px-6 bg-gradient-to-br from-cinematic-surface-secondary to-cinematic-surface-tertiary">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-black text-cinematic-text-primary mb-4">
              Cinematic Typography
            </h2>
            <p className="text-lg text-cinematic-text-secondary">
              Dramatic scale and premium hierarchy
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <span className="text-sm text-cinematic-brand-primary-500 font-medium uppercase tracking-wide">Display XL</span>
                <h3 className="text-6xl font-black text-cinematic-text-primary leading-none">
                  Find Your
                  <span className="block text-transparent bg-gradient-to-r from-cinematic-brand-primary-400 to-cinematic-brand-primary-600 bg-clip-text">
                    Perfect Match
                  </span>
                </h3>
              </div>

              <div>
                <span className="text-sm text-cinematic-brand-primary-500 font-medium uppercase tracking-wide">Headline Large</span>
                <h4 className="text-3xl font-bold text-cinematic-text-primary">
                  Premium Dating Experience
                </h4>
              </div>

              <div>
                <span className="text-sm text-cinematic-brand-primary-500 font-medium uppercase tracking-wide">Body Large</span>
                <p className="text-lg text-cinematic-text-secondary leading-relaxed">
                  Experience dating like never before with our cinematic design system that brings depth, 
                  emotion, and premium feel to every interaction.
                </p>
              </div>
            </div>

            <div className="bg-cinematic-surface-glass backdrop-blur-lg rounded-2xl p-8 border border-cinematic-surface-tertiary/20 shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h5 className="text-xl font-semibold text-cinematic-text-primary">Typography Scale</h5>
                  <Badge className="bg-cinematic-brand-primary-500/20 text-cinematic-brand-primary-400">Premium</Badge>
                </div>
                
                <Separator className="bg-cinematic-surface-tertiary/30" />
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-cinematic-text-secondary">Display XL</span>
                    <span className="text-cinematic-text-primary font-mono text-sm">6rem / 96px</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-cinematic-text-secondary">Headline Large</span>
                    <span className="text-cinematic-text-primary font-mono text-sm">3rem / 48px</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-cinematic-text-secondary">Body Large</span>
                    <span className="text-cinematic-text-primary font-mono text-sm">1.125rem / 18px</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Elements */}
      <section className="py-24 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-cinematic-text-primary mb-4">
              Interactive Elements
            </h2>
            <p className="text-lg text-cinematic-text-secondary">
              Premium interactions with cinematic motion
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Button className="h-16 bg-gradient-to-r from-cinematic-brand-primary-500 to-cinematic-brand-primary-600 text-cinematic-surface-primary shadow-cinematic-glow-lg hover:shadow-cinematic-glow-xl transition-all duration-500">
              <Zap className="mr-2 h-5 w-5" />
              Premium Action
            </Button>
            
            <Button variant="outline" className="h-16 bg-cinematic-surface-glass backdrop-blur-lg border-cinematic-brand-primary-500/30 text-cinematic-text-primary hover:border-cinematic-brand-primary-500/60">
              <Calendar className="mr-2 h-5 w-5" />
              Glass Button
            </Button>
            
            <Badge className="h-16 bg-cinematic-brand-accent-500/20 text-cinematic-brand-accent-400 border-cinematic-brand-accent-500/30 text-lg flex items-center justify-center">
              <Star className="mr-2 h-5 w-5" />
              Premium Badge
            </Badge>
            
            <div className="h-16 bg-cinematic-surface-glass backdrop-blur-lg rounded-lg border border-cinematic-surface-tertiary/20 flex items-center justify-center">
              <span className="text-cinematic-text-primary font-medium">Glass Surface</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-cinematic-surface-primary border-t border-cinematic-surface-tertiary/20">
        <div className="container mx-auto text-center">
          <p className="text-cinematic-text-secondary">
            Cinematic Design System • Premium • Layered Depth • Translucent Surfaces
          </p>
        </div>
      </footer>
    </div>
  );
};

export default CinematicDesignShowcase;