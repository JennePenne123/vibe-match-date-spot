import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Users, Heart, ArrowRight, Menu, X } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthModal } from '@/components/landing/AuthModal';
import { PartnerAuthModal } from '@/components/landing/PartnerAuthModal';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LandingDemo() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);

  // Auto-open modal if redirected from protected route
  useEffect(() => {
    const authParam = searchParams.get('auth');
    if (authParam === 'required') {
      setIsAuthModalOpen(true);
      setSearchParams({}, { replace: true });
    } else if (authParam === 'partner') {
      setIsPartnerModalOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

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
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
        isScrolled 
          ? 'bg-background/90 backdrop-blur-lg border-b border-border/40 shadow-gentle-sm' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              <img 
                src="/icon-192.png" 
                alt="VybePulse" 
                className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl shadow-gentle-md group-hover:shadow-gentle-lg group-hover:scale-105 transition-all duration-300"
              />
              <span className="text-xl lg:text-2xl font-semibold text-foreground">
                VybePulse
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection(featuresRef)}
                className="text-foreground/70 hover:text-foreground transition-colors duration-300 font-medium"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection(howItWorksRef)}
                className="text-foreground/70 hover:text-foreground transition-colors duration-300 font-medium"
              >
                How It Works
              </button>
              <button 
                onClick={() => setIsPartnerModalOpen(true)}
                className="text-foreground/70 hover:text-foreground transition-colors duration-300 font-medium"
              >
                Partner Login
              </button>
              <ThemeToggle />
              <Button 
                onClick={() => setIsAuthModalOpen(true)}
                variant="default"
                size="default"
                className="shadow-gentle-md hover:shadow-gentle-lg transition-all duration-400"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl hover:bg-accent/30 transition-colors duration-300"
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
          <div className="md:hidden bg-background/95 backdrop-blur-lg border-t border-border/40 shadow-gentle-lg animate-fade-in">
            <div className="px-6 py-5 space-y-4">
              <button 
                onClick={() => scrollToSection(featuresRef)}
                className="block w-full text-left py-2 text-foreground/70 hover:text-foreground transition-colors duration-300 font-medium"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection(howItWorksRef)}
                className="block w-full text-left py-2 text-foreground/70 hover:text-foreground transition-colors duration-300 font-medium"
              >
                How It Works
              </button>
              <button 
                onClick={() => {
                  setIsPartnerModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-foreground/70 hover:text-foreground transition-colors duration-300 font-medium"
              >
                Partner Login
              </button>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
              <Button 
                onClick={() => setIsAuthModalOpen(true)}
                variant="default"
                size="default"
                className="w-full shadow-gentle-md"
              >
                Get Started
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 lg:pt-20">
        {/* Soft Gradient Background */}
        <div className="absolute inset-0 bg-gradient-calm opacity-70" />
        <div className="absolute inset-0 bg-gradient-meadow animate-breathe" />
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-36 text-center">
          <div className="space-y-10 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-semibold leading-tight tracking-tight">
              <span className="block text-foreground">
                Where Connection
              </span>
              <span className="block text-primary mt-2">
                Meets Intention
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Thoughtful date planning for meaningful moments. 
              <span className="block mt-2">Discover places, align preferences, create memories.</span>
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-10">
              <Button 
                onClick={() => setIsAuthModalOpen(true)}
                size="xl"
                className="text-lg px-10 py-7 shadow-gentle-lg hover:shadow-gentle-xl transition-all duration-400 w-full sm:w-auto"
              >
                Begin Your Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                onClick={() => scrollToSection(featuresRef)}
                variant="outline"
                size="xl"
                className="text-lg px-10 py-7 w-full sm:w-auto"
              >
                Learn More
              </Button>
            </div>

            <p className="text-sm text-muted-foreground pt-4">
              No credit card required • Free to start
            </p>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="relative py-24 lg:py-36 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20 scroll-animate opacity-0">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-8 tracking-tight">
              Everything You Need for
              <span className="block mt-3 text-primary">
                Meaningful Moments
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Thoughtfully designed features that bring ease to date planning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {/* Feature 1 */}
            <Card 
              variant="wellness" 
              className="scroll-animate opacity-0 group cursor-pointer"
              style={{ animationDelay: '100ms' }}
            >
              <div className="p-10 space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-gentle-md group-hover:shadow-gentle-lg transition-all duration-400">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">
                  Thoughtful Matching
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Intelligent recommendations based on your preferences and compatibility. 
                  Find places that resonate with both of you.
                </p>
              </div>
            </Card>

            {/* Feature 2 */}
            <Card 
              variant="wellness" 
              className="scroll-animate opacity-0 group cursor-pointer"
              style={{ animationDelay: '200ms' }}
            >
              <div className="p-10 space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-earth flex items-center justify-center shadow-gentle-md group-hover:shadow-gentle-lg transition-all duration-400">
                  <Users className="w-8 h-8 text-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">
                  Plan Together
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Collaborate in real-time to find the perfect venue. 
                  Share preferences and discover places you'll both enjoy.
                </p>
              </div>
            </Card>

            {/* Feature 3 */}
            <Card 
              variant="wellness" 
              className="scroll-animate opacity-0 group cursor-pointer md:col-span-2 lg:col-span-1"
              style={{ animationDelay: '300ms' }}
            >
              <div className="p-10 space-y-5">
                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-gentle-md group-hover:shadow-gentle-lg transition-all duration-400">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-foreground">
                  Seamless Experience
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  From discovery to invitation in just a few taps. 
                  Track your dates and create lasting memories together.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section ref={howItWorksRef} className="relative py-24 lg:py-36 bg-gradient-calm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20 scroll-animate opacity-0">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-8 tracking-tight">
              Your Perfect Date in
              <span className="block mt-3 text-primary">
                3 Simple Steps
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Getting started is quick and effortless
            </p>
          </div>

          <div className="space-y-24 lg:space-y-36">
            {/* Step 1 */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center scroll-animate opacity-0">
              <div className="order-2 lg:order-1 space-y-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-primary text-white font-semibold text-xl shadow-gentle-md">
                  1
                </div>
                <h3 className="text-3xl lg:text-4xl font-semibold text-foreground">
                  Set Your Preferences
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Tell us what matters to you — cuisine, atmosphere, budget, and more. 
                  Our system learns your unique style to find venues that truly fit.
                </p>
              </div>
              <div className="order-1 lg:order-2">
                <Card variant="elegant" size="xl">
                  <div className="aspect-video bg-gradient-calm rounded-xl flex items-center justify-center">
                    <img src="/icon-512.png" alt="VybePulse" className="w-24 h-24 rounded-2xl shadow-lg" />
                  </div>
                </Card>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center scroll-animate opacity-0">
              <div className="order-2 space-y-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-earth text-foreground font-semibold text-xl shadow-gentle-md">
                  2
                </div>
                <h3 className="text-3xl lg:text-4xl font-semibold text-foreground">
                  Discover Matches
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Our system analyzes both your preferences to find places you'll both love. 
                  See compatibility insights and curated recommendations.
                </p>
              </div>
              <div className="order-1">
                <Card variant="elegant" size="xl">
                  <div className="aspect-video bg-gradient-earth rounded-xl flex items-center justify-center">
                    <Sparkles className="w-20 h-20 text-foreground/40" />
                  </div>
                </Card>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center scroll-animate opacity-0">
              <div className="order-2 lg:order-1 space-y-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white font-semibold text-xl shadow-gentle-md">
                  3
                </div>
                <h3 className="text-3xl lg:text-4xl font-semibold text-foreground">
                  Plan & Connect
                </h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Send invitations, coordinate schedules, and bring your plans to life. 
                  Create meaningful experiences and cherished memories together.
                </p>
              </div>
              <div className="order-1 lg:order-2">
                <Card variant="elegant" size="xl">
                  <div className="aspect-video bg-gradient-primary rounded-xl flex items-center justify-center">
                    <Users className="w-20 h-20 text-white/70" />
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-90" />
        <div className="absolute inset-0 bg-gradient-meadow opacity-20" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="space-y-10 scroll-animate opacity-0">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-tight tracking-tight">
              Ready to Create
              <span className="block mt-3">Meaningful Moments?</span>
            </h2>
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              Join a community that values intention and connection. 
              Start planning dates that matter.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
              <Button 
                onClick={() => setIsAuthModalOpen(true)}
                size="xl"
                variant="secondary"
                className="text-lg px-10 py-7 bg-white text-primary hover:bg-white/90 shadow-gentle-lg hover:shadow-gentle-xl transition-all duration-400 w-full sm:w-auto"
              >
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border/30 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <Link to="/" className="flex items-center space-x-2 group">
              <img 
                src="/icon-192.png" 
                alt="VybePulse" 
                className="w-8 h-8 rounded-xl shadow-gentle-md group-hover:scale-105 transition-all duration-300"
              />
              <span className="text-xl font-semibold text-foreground">
                VybePulse
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              © 2024 VybePulse. Designed for meaningful connections.
            </p>
          </div>
        </div>
      </footer>

      {/* Auth Modals */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
      <PartnerAuthModal 
        isOpen={isPartnerModalOpen} 
        onClose={() => setIsPartnerModalOpen(false)} 
      />
    </div>
  );
}
