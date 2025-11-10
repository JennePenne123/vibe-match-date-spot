import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Users, Heart, ArrowRight, Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthModal } from '@/components/landing/AuthModal';

export default function LandingDemo() {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  // Handle scroll for navigation background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
          entry.target.classList.remove('opacity-0');
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.scroll-animate');
    animatedElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation Header */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-background/80 backdrop-blur-glass border-b border-border/50 shadow-premium-sm' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-md transition-all duration-300">
                <Heart className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <span className="text-xl lg:text-2xl font-bold bg-gradient-romantic bg-clip-text text-transparent">
                VybePulse
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection(featuresRef)}
                className="text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection(howItWorksRef)}
                className="text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium"
              >
                How It Works
              </button>
              <Button 
                onClick={() => setIsAuthModalOpen(true)}
                variant="default"
                size="default"
                className="shadow-glow-sm hover:shadow-glow-md transition-all duration-300"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-accent/10 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-glass border-t border-border/50 shadow-premium-lg animate-fade-in">
            <div className="px-6 py-4 space-y-4">
              <button 
                onClick={() => scrollToSection(featuresRef)}
                className="block w-full text-left py-2 text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection(howItWorksRef)}
                className="block w-full text-left py-2 text-foreground/70 hover:text-foreground transition-colors duration-200 font-medium"
              >
                How It Works
              </button>
              <Button 
                onClick={() => setIsAuthModalOpen(true)}
                variant="default"
                size="default"
                className="w-full shadow-glow-sm"
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 lg:pt-20">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-dreamy opacity-60" />
        <div className="absolute inset-0 bg-gradient-romantic opacity-40 animate-pulse" style={{ animationDuration: '8s' }} />
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32 text-center">
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight">
              <span className="block bg-gradient-romantic bg-clip-text text-transparent">
                Where Love Meets
              </span>
              <span className="block bg-gradient-sunset bg-clip-text text-transparent mt-2">
                Location
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl lg:text-2xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
              AI-powered date planning for perfect moments. 
              <span className="block mt-2">Discover venues, match preferences, create memories.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button 
                onClick={() => setIsAuthModalOpen(true)}
                size="lg"
                className="text-lg px-8 py-6 shadow-glow-lg hover:shadow-glow-xl hover:scale-105 transition-all duration-300 w-full sm:w-auto"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                onClick={() => scrollToSection(featuresRef)}
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 border-2 hover:bg-accent/10 w-full sm:w-auto"
              >
                See How It Works
              </Button>
            </div>

            <p className="text-sm text-foreground/50 pt-4">
              No credit card required • Free to start
            </p>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="relative py-20 lg:py-32 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 scroll-animate opacity-0">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Everything You Need for the
              <span className="block mt-2 bg-gradient-romantic bg-clip-text text-transparent">
                Perfect Date
              </span>
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Powerful features designed to make date planning effortless and enjoyable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card 
              variant="glass" 
              className="scroll-animate opacity-0 group hover:scale-105 hover:shadow-glow-lg transition-all duration-300 cursor-pointer"
              style={{ animationDelay: '100ms' }}
            >
              <div className="p-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow-md group-hover:shadow-glow-lg transition-all duration-300">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">
                  AI-Powered Matching
                </h3>
                <p className="text-foreground/70 leading-relaxed">
                  Smart recommendations based on your preferences and compatibility. 
                  Our AI learns what you love and finds perfect venue matches.
                </p>
              </div>
            </Card>

            {/* Feature 2 */}
            <Card 
              variant="glass" 
              className="scroll-animate opacity-0 group hover:scale-105 hover:shadow-glow-lg transition-all duration-300 cursor-pointer"
              style={{ animationDelay: '200ms' }}
            >
              <div className="p-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-sunset flex items-center justify-center shadow-romantic-md group-hover:shadow-romantic-lg transition-all duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">
                  Collaborative Planning
                </h3>
                <p className="text-foreground/70 leading-relaxed">
                  Plan dates together in real-time with perfect venue matches. 
                  Share preferences and find places you'll both love.
                </p>
              </div>
            </Card>

            {/* Feature 3 */}
            <Card 
              variant="glass" 
              className="scroll-animate opacity-0 group hover:scale-105 hover:shadow-glow-lg transition-all duration-300 cursor-pointer md:col-span-2 lg:col-span-1"
              style={{ animationDelay: '300ms' }}
            >
              <div className="p-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-romantic flex items-center justify-center shadow-glow-md group-hover:shadow-glow-lg transition-all duration-300">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">
                  Seamless Experience
                </h3>
                <p className="text-foreground/70 leading-relaxed">
                  From discovery to invitation in just a few taps. 
                  Track your dates, earn rewards, and create unforgettable memories.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section ref={howItWorksRef} className="relative py-20 lg:py-32 bg-gradient-surface-light">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 scroll-animate opacity-0">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Your Perfect Date in
              <span className="block mt-2 bg-gradient-sunset bg-clip-text text-transparent">
                3 Simple Steps
              </span>
            </h2>
            <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
              Getting started is quick and easy
            </p>
          </div>

          <div className="space-y-20 lg:space-y-32">
            {/* Step 1 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center scroll-animate opacity-0">
              <div className="order-2 lg:order-1 space-y-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-primary text-white font-bold text-xl shadow-glow-md">
                  1
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold text-foreground">
                  Set Your Vibe
                </h3>
                <p className="text-lg text-foreground/70 leading-relaxed">
                  Tell us what you love - cuisine, ambiance, budget, and more. 
                  Our smart preferences system learns your unique taste to find venues that match your style.
                </p>
              </div>
              <div className="order-1 lg:order-2">
                <Card variant="elegant" className="p-8 lg:p-12">
                  <div className="aspect-video bg-gradient-dreamy rounded-xl flex items-center justify-center">
                    <Heart className="w-20 h-20 text-white/80" />
                  </div>
                </Card>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center scroll-animate opacity-0">
              <div className="order-2 space-y-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-sunset text-white font-bold text-xl shadow-romantic-md">
                  2
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold text-foreground">
                  Get Smart Matches
                </h3>
                <p className="text-lg text-foreground/70 leading-relaxed">
                  Our AI analyzes both your preferences to find venues you'll both love. 
                  See compatibility scores, detailed information, and real-time availability.
                </p>
              </div>
              <div className="order-1">
                <Card variant="elegant" className="p-8 lg:p-12">
                  <div className="aspect-video bg-gradient-romantic rounded-xl flex items-center justify-center">
                    <Sparkles className="w-20 h-20 text-white/80" />
                  </div>
                </Card>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid lg:grid-cols-2 gap-12 items-center scroll-animate opacity-0">
              <div className="order-2 lg:order-1 space-y-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-romantic text-white font-bold text-xl shadow-glow-md">
                  3
                </div>
                <h3 className="text-3xl lg:text-4xl font-bold text-foreground">
                  Plan & Enjoy
                </h3>
                <p className="text-lg text-foreground/70 leading-relaxed">
                  Send invitations, chat in real-time, and coordinate your perfect date. 
                  Earn points and badges as you create unforgettable memories together.
                </p>
              </div>
              <div className="order-1 lg:order-2">
                <Card variant="elegant" className="p-8 lg:p-12">
                  <div className="aspect-video bg-gradient-sunset rounded-xl flex items-center justify-center">
                    <Users className="w-20 h-20 text-white/80" />
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-romantic opacity-90" />
        <div className="absolute inset-0 bg-gradient-dreamy opacity-30" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="space-y-8 scroll-animate opacity-0">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Ready to Plan Your
              <span className="block mt-2">Perfect Date?</span>
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Join thousands of people creating unforgettable moments
            </p>
            <Button 
              onClick={() => setIsAuthModalOpen(true)}
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 bg-white text-primary border-0 hover:bg-white/90 hover:scale-105 shadow-2xl transition-all duration-300"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p className="text-sm text-white/70 pt-4">
              No credit card required • Free to start • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-100 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">VybePulse</span>
              </div>
              <p className="text-neutral-400 text-sm">
                AI-powered date planning for perfect moments
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><button onClick={() => scrollToSection(featuresRef)} className="hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection(howItWorksRef)} className="hover:text-white transition-colors">How It Works</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-800 mt-12 pt-8 text-center text-sm text-neutral-400">
            <p>© 2024 VybePulse. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}
