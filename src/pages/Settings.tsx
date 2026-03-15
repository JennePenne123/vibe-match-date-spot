import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Lock, Trash2, Shield, Loader2, Check, PauseCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const { toast } = useToast();

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Pause state
  const [isPaused, setIsPaused] = useState(false);
  const [pauseLoading, setPauseLoading] = useState(false);
  const [pauseInitialLoad, setPauseInitialLoad] = useState(true);

  // Account deletion state
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/?auth=required', { replace: true });
    }
  }, [user, loading, navigate]);

  // Fetch pause status
  useEffect(() => {
    const fetchPauseStatus = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('is_paused')
          .eq('id', user.id)
          .single();
        if (data) {
          setIsPaused(data.is_paused ?? false);
        }
      } catch (error) {
        console.error('Failed to fetch pause status:', error);
      } finally {
        setPauseInitialLoad(false);
      }
    };
    fetchPauseStatus();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      toast({ title: 'Passwort zu kurz', description: 'Mindestens 6 Zeichen erforderlich.', variant: 'destructive' });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ title: 'Passwörter stimmen nicht überein', description: 'Bitte überprüfe deine Eingabe.', variant: 'destructive' });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email || '',
        password: currentPassword,
      });

      if (signInError) {
        toast({ title: 'Aktuelles Passwort falsch', description: 'Bitte gib dein korrektes Passwort ein.', variant: 'destructive' });
        setPasswordLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
      } else {
        setPasswordSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        toast({ title: 'Passwort geändert', description: 'Dein Passwort wurde erfolgreich aktualisiert.' });
      }
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message || 'Etwas ist schiefgelaufen.', variant: 'destructive' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleTogglePause = async (paused: boolean) => {
    setPauseLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_paused: paused, 
          paused_at: paused ? new Date().toISOString() : null 
        })
        .eq('id', user.id);

      if (error) throw error;

      setIsPaused(paused);
      toast({
        title: paused ? 'Account pausiert' : 'Account reaktiviert',
        description: paused 
          ? 'Dein Profil ist jetzt unsichtbar für andere. Du kannst es jederzeit reaktivieren.' 
          : 'Willkommen zurück! Dein Profil ist wieder aktiv.',
      });
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message || 'Etwas ist schiefgelaufen.', variant: 'destructive' });
    } finally {
      setPauseLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'LÖSCHEN') return;

    setDeleteLoading(true);
    try {
      toast({ 
        title: 'Account-Löschung angefordert', 
        description: 'Dein Account wird in Kürze gelöscht. Du wirst jetzt abgemeldet.' 
      });
      await logout();
      navigate('/', { replace: true });
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message || 'Etwas ist schiefgelaufen.', variant: 'destructive' });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto pb-24">
        {/* Header */}
        <div className="bg-card p-4 pt-12 shadow-sm border-b border-border">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate(-1)}
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-foreground">Account Settings</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Account Info */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                <Shield className="w-4 h-4 text-primary" />
                Account-Informationen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">E-Mail</span>
                <span className="text-sm font-medium text-foreground">{user.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Name</span>
                <span className="text-sm font-medium text-foreground">{user.name || '–'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={`text-sm font-medium ${isPaused ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {pauseInitialLoad ? '...' : isPaused ? 'Pausiert' : 'Aktiv'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                <Lock className="w-4 h-4 text-primary" />
                Passwort ändern
              </CardTitle>
              <CardDescription className="text-xs">
                Wähle ein sicheres Passwort mit mindestens 6 Zeichen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="current-password" className="text-sm text-foreground">Aktuelles Passwort</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    required
                    className="bg-background/50 border-border/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-sm text-foreground">Neues Passwort</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="bg-background/50 border-border/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-sm text-foreground">Passwort bestätigen</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="bg-background/50 border-border/50"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {passwordLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : passwordSuccess ? (
                    <Check className="w-4 h-4 mr-2" />
                  ) : null}
                  {passwordSuccess ? 'Passwort geändert' : 'Passwort ändern'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Pause Account */}
          <Card className={`bg-card ${isPaused ? 'border-amber-500/40' : 'border-border'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-foreground">
                <PauseCircle className={`w-4 h-4 ${isPaused ? 'text-amber-500' : 'text-primary'}`} />
                Account pausieren
              </CardTitle>
              <CardDescription className="text-xs">
                {isPaused 
                  ? 'Dein Account ist pausiert. Dein Profil ist für andere unsichtbar und du erhältst keine Einladungen.'
                  : 'Pausiere deinen Account vorübergehend. Deine Daten bleiben erhalten, aber dein Profil wird unsichtbar.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {isPaused ? 'Account ist pausiert' : 'Account ist aktiv'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isPaused ? 'Schalte den Toggle um, um zu reaktivieren' : 'Du kannst jederzeit pausieren'}
                  </p>
                </div>
                <Switch
                  checked={isPaused}
                  onCheckedChange={handleTogglePause}
                  disabled={pauseLoading || pauseInitialLoad}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
            </CardContent>
          </Card>

          <Separator className="bg-border/50" />

          {/* Danger Zone */}
          <Card className="bg-card border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-destructive">
                <Trash2 className="w-4 h-4" />
                Gefahrenzone
              </CardTitle>
              <CardDescription className="text-xs">
                Diese Aktion kann nicht rückgängig gemacht werden. Alle deine Daten werden unwiderruflich gelöscht.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    Account löschen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">Account wirklich löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Diese Aktion löscht deinen Account und alle zugehörigen Daten permanent. 
                      Tippe <span className="font-bold text-destructive">LÖSCHEN</span> zur Bestätigung.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder='Tippe "LÖSCHEN" zur Bestätigung'
                    className="bg-background/50 border-border/50"
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-border text-foreground">Abbrechen</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'LÖSCHEN' || deleteLoading}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Unwiderruflich löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
