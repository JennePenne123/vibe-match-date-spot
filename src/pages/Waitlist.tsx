import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Heart, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Link } from 'react-router-dom';
import hioutzLogo from '@/assets/hioutz-logo.png';

export default function Waitlist() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || trimmedName.length > 100) {
      toast.error('Bitte gib einen gültigen Namen ein.');
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('waitlist_signups')
        .insert({ name: trimmedName, email: trimmedEmail });

      if (error) {
        if (error.code === '23505') {
          toast.info('Du bist bereits auf der Warteliste! 🎉');
          setIsSubmitted(true);
        } else {
          throw error;
        }
      } else {
        setIsSubmitted(true);
        toast.success('Du bist auf der Warteliste! 🚀');
      }
    } catch {
      toast.error('Etwas ist schiefgelaufen. Bitte versuche es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/15 blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full bg-secondary/10 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link to="/" className="flex items-center gap-2">
          <img src={hioutzLogo} alt="HiOutz" className="h-10" />
        </Link>
        <ThemeToggle />
      </header>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-12 pb-24 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/15 border border-primary/30 mb-8"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">Bald verfügbar</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-7xl font-black text-foreground leading-[1.1] mb-6"
        >
          Das perfekte Date.{' '}
          <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            KI-gesteuert.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed"
        >
          HiOutz findet die besten Venues, plant euer Date und sorgt dafür, 
          dass jedes Erlebnis unvergesslich wird. Sei von Anfang an dabei.
        </motion.p>

        {/* Form or Success */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="w-full max-w-md"
        >
          {isSubmitted ? (
            <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Du bist dabei! 🎉</h2>
              <p className="text-muted-foreground text-center">
                Wir melden uns bei dir, sobald HiOutz startet. Halte dein Postfach im Auge!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-8 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50">
              <Input
                type="text"
                placeholder="Dein Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
                className="h-12 bg-input/50 border-border/50 text-foreground placeholder:text-muted-foreground"
              />
              <Input
                type="email"
                placeholder="Deine E-Mail-Adresse"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                required
                className="h-12 bg-input/50 border-border/50 text-foreground placeholder:text-muted-foreground"
              />
              <Button
                type="submit"
                disabled={isSubmitting}
                size="lg"
                className="h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-primary-foreground font-semibold text-base group"
              >
                {isSubmitting ? 'Wird eingetragen…' : (
                  <>
                    Auf die Warteliste
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-1">
                Kein Spam. Nur eine Nachricht zum Launch.
              </p>
            </form>
          )}
        </motion.div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 w-full max-w-3xl"
        >
          {[
            { icon: Sparkles, title: 'KI-Matching', desc: 'Venues die zu euch passen – automatisch.' },
            { icon: Zap, title: 'Echtzeit-Planung', desc: 'Plant zusammen, entscheidet gemeinsam.' },
            { icon: Heart, title: 'Exklusive Deals', desc: 'Voucher & Specials nur für HiOutz-User.' },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card/40 backdrop-blur border border-border/30 hover:border-primary/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-bold text-foreground">{feature.title}</h3>
              <p className="text-sm text-muted-foreground text-center">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center pb-8 text-xs text-muted-foreground space-x-4">
        <Link to="/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
        <Link to="/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</Link>
        <Link to="/agb" className="hover:text-foreground transition-colors">AGB</Link>
      </footer>
    </div>
  );
}
