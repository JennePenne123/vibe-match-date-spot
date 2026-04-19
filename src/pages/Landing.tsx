import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Heart, ArrowRight, Menu, X, Zap, Shield, Star } from 'lucide-react';
import hioutzLogo from '@/assets/hioutz-logo.png';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthModal } from '@/components/landing/AuthModal';
import { PartnerAuthModal } from '@/components/landing/PartnerAuthModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import AnimatedCounter from '@/components/landing/AnimatedCounter';
import { motion } from 'framer-motion';
export default function LandingDemo() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const featuresRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
          entry.target.classList.remove('opacity-0');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });
    const animatedElements = document.querySelectorAll('.scroll-animate');
    animatedElements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  return <main id="main-content" className="min-h-screen bg-background overflow-x-hidden">
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${isScrolled ? 'bg-background/90 backdrop-blur-lg border-b border-border/40 shadow-gentle-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <Link to="/" className="flex items-center space-x-2 group">
              <img src={hioutzLogo} alt="H!Outz" className="h-8 lg:h-10 w-auto group-hover:scale-105 transition-all duration-300" />
            </Link>
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection(featuresRef)} className="text-foreground/70 hover:text-foreground transition-colors duration-300 font-medium">{t('landing.features')}</button>
              <button onClick={() => scrollToSection(howItWorksRef)} className="text-foreground/70 hover:text-foreground transition-colors duration-300 font-medium">{t('landing.howItWorks')}</button>
              <button onClick={() => setIsPartnerModalOpen(true)} className="text-foreground/70 hover:text-foreground transition-colors duration-300 font-medium">{t('landing.partnerLogin')}</button>
              <ThemeToggle />
              <Button onClick={() => setIsAuthModalOpen(true)} variant="default" size="default" className="shadow-gentle-md hover:shadow-gentle-lg transition-all duration-400">{t('common.getStarted')}</Button>
            </div>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-xl hover:bg-accent/30 transition-colors duration-300">
              {isMobileMenuOpen ? <X className="w-6 h-6 text-foreground" /> : <Menu className="w-6 h-6 text-foreground" />}
            </button>
          </div>
        </div>
        {isMobileMenuOpen && <div className="md:hidden bg-background/95 backdrop-blur-lg border-t border-border/40 shadow-gentle-lg animate-fade-in">
            <div className="px-6 py-5 space-y-4">
              <button onClick={() => scrollToSection(featuresRef)} className="block w-full text-left py-2 text-foreground/70 hover:text-foreground transition-colors duration-300 font-medium">{t('landing.features')}</button>
              <button onClick={() => scrollToSection(howItWorksRef)} className="block w-full text-left py-2 text-foreground/70 hover:text-foreground transition-colors duration-300 font-medium">{t('landing.howItWorks')}</button>
              <button onClick={() => { setIsPartnerModalOpen(true); setIsMobileMenuOpen(false); }} className="block w-full text-left py-2 text-foreground/70 hover:text-foreground transition-colors duration-300 font-medium">{t('landing.partnerLogin')}</button>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">{t('landing.theme')}</span>
                <ThemeToggle />
              </div>
              <Button onClick={() => setIsAuthModalOpen(true)} variant="default" size="default" className="w-full shadow-gentle-md">{t('common.getStarted')}</Button>
            </div>
          </div>}
      </nav>

      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16 lg:pt-20">
        <div className="absolute inset-0 bg-gradient-calm opacity-70" />
        <div className="absolute inset-0 bg-gradient-meadow" />
        {/* Floating orbs for depth */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-accent/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-36 text-center">
          <div className="space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 backdrop-blur-sm">
                <Zap className="w-4 h-4" />
                {t('landing.aiBadge')}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-semibold leading-tight tracking-tight">
                <span className="block text-foreground">{t('landing.heroTitle1')}</span>
                <span className="block bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent mt-2">{t('landing.heroTitle2')}</span>
              </h1>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              {t('landing.heroSubtitle')}
              <span className="block mt-2">{t('landing.heroSubtitle2')}</span>
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-10"
            >
              <Button onClick={() => setIsAuthModalOpen(true)} size="xl" className="text-lg px-10 py-7 shadow-gentle-lg hover:shadow-gentle-xl transition-all duration-400 w-full sm:w-auto group">
                {t('landing.beginJourney')} <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button onClick={() => scrollToSection(featuresRef)} variant="outline" size="xl" className="text-lg px-10 py-7 w-full sm:w-auto">{t('landing.learnMore')}</Button>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-sm text-muted-foreground pt-4"
            >
              {t('landing.noCreditCard')}
            </motion.p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Social Proof Bar — Animated Counters */}
      <section className="relative py-10 bg-card/80 backdrop-blur-lg border-y border-border/30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 text-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-2xl sm:text-3xl font-bold text-foreground">
                  <AnimatedCounter target={500} suffix="+" />
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{t('landing.socialProof.activeUsers')}</span>
            </div>
            <div className="hidden sm:block w-px h-12 bg-border/50" />
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl sm:text-3xl font-bold text-foreground">
                  <AnimatedCounter target={4.8} suffix="/5" decimals={1} />
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{t('landing.socialProof.satisfaction')}</span>
            </div>
            <div className="hidden sm:block w-px h-12 bg-border/50" />
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                <span className="text-2xl sm:text-3xl font-bold text-foreground">
                  <AnimatedCounter target={92} suffix="%" />
                </span>
              </div>
              <span className="text-xs text-muted-foreground font-medium tracking-wide uppercase">{t('landing.socialProof.matchAccuracy')}</span>
            </div>
          </div>
        </div>
      </section>

      <section ref={featuresRef} className="relative py-24 lg:py-36 bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20 scroll-animate opacity-0">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-8 tracking-tight">
              {t('landing.featuresTitle1')}<span className="block mt-3 text-primary">{t('landing.featuresTitle2')}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">{t('landing.featuresSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {[
              { icon: Zap, gradient: 'bg-gradient-primary', title: t('landing.feature1Title'), desc: t('landing.feature1Desc'), delay: 0 },
              { icon: Shield, gradient: 'bg-gradient-secondary', title: t('landing.feature2Title'), desc: t('landing.feature2Desc'), delay: 0.1 },
              { icon: Heart, gradient: 'from-primary to-accent', title: t('landing.feature3Title'), desc: t('landing.feature3Desc'), delay: 0.2 },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: feature.delay }}
              >
                <Card variant="wellness" className="group cursor-pointer h-full">
                  <div className="p-6 md:p-10 space-y-5">
                    <div className={`w-16 h-16 rounded-2xl ${feature.gradient} flex items-center justify-center shadow-gentle-md group-hover:shadow-gentle-lg group-hover:scale-110 transition-all duration-400`}>
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section ref={howItWorksRef} className="relative py-24 lg:py-36 bg-gradient-calm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20 scroll-animate opacity-0">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-8 tracking-tight">
              {t('landing.howItWorksTitle1')}<span className="block mt-3 text-primary">{t('landing.howItWorksTitle2')}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">{t('landing.howItWorksSubtitle')}</p>
          </div>
          <div className="space-y-24 lg:space-y-36">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center scroll-animate opacity-0">
              <div className="order-2 lg:order-1 space-y-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-primary text-white font-semibold text-xl shadow-gentle-md">1</div>
                <h3 className="text-3xl lg:text-4xl font-semibold text-foreground">{t('landing.step1Title')}</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">{t('landing.step1Desc')}</p>
              </div>
              <div className="order-1 lg:order-2"><Card variant="elegant" className="p-4 md:p-10"><div className="aspect-video bg-gradient-calm rounded-xl flex items-center justify-center"><img src="/icon-512.png" alt="H!Outz" className="w-24 h-24 rounded-2xl shadow-lg" loading="lazy" /></div></Card></div>
            </div>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center scroll-animate opacity-0">
              <div className="order-2 space-y-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-secondary text-white font-semibold text-xl shadow-gentle-md">2</div>
                <h3 className="text-3xl lg:text-4xl font-semibold text-foreground">{t('landing.step2Title')}</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">{t('landing.step2Desc')}</p>
              </div>
              <div className="order-1"><Card variant="elegant" className="p-4 md:p-10"><div className="aspect-video bg-gradient-secondary rounded-xl flex items-center justify-center"><img src={hioutzLogo} alt="H!Outz" className="h-16 w-auto opacity-70" loading="lazy" /></div></Card></div>
            </div>
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center scroll-animate opacity-0">
              <div className="order-2 lg:order-1 space-y-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white font-semibold text-xl shadow-gentle-md">3</div>
                <h3 className="text-3xl lg:text-4xl font-semibold text-foreground">{t('landing.step3Title')}</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">{t('landing.step3Desc')}</p>
              </div>
              <div className="order-1 lg:order-2"><Card variant="elegant" className="p-4 md:p-10"><div className="aspect-video bg-gradient-primary rounded-xl flex items-center justify-center"><Users className="w-20 h-20 text-white/70" /></div></Card></div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-24 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-90" />
        <div className="absolute inset-0 bg-gradient-meadow opacity-20" />
        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="space-y-10 scroll-animate opacity-0">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-tight tracking-tight">
              {t('landing.ctaTitle1')}<span className="block mt-3">{t('landing.ctaTitle2')}</span>
            </h2>
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">{t('landing.ctaSubtitle')}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-6">
              <Button onClick={() => setIsAuthModalOpen(true)} size="xl" variant="secondary" className="text-lg px-10 py-7 bg-white text-primary hover:bg-white/90 shadow-gentle-lg hover:shadow-gentle-xl transition-all duration-400 w-full sm:w-auto">
                {t('landing.startJourney')} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-card border-t border-border/30 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <Link to="/" className="flex items-center space-x-2 group">
              <img src={hioutzLogo} alt="H!Outz" className="h-8 w-auto group-hover:scale-105 transition-all duration-300" />
            </Link>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link to="/impressum" className="hover:text-foreground transition-colors">{t('landing.footerLinks.imprint')}</Link>
              <Link to="/datenschutz" className="hover:text-foreground transition-colors">{t('landing.footerLinks.privacy')}</Link>
              <Link to="/agb" className="hover:text-foreground transition-colors">{t('landing.footerLinks.terms')}</Link>
            </div>
            <p className="text-sm text-muted-foreground">{t('landing.footer')}</p>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onOpenPartner={() => setIsPartnerModalOpen(true)} />
      <PartnerAuthModal isOpen={isPartnerModalOpen} onClose={() => setIsPartnerModalOpen(false)} />
    </main>;
}
