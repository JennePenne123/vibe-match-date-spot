import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MailX, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();
        if (data.valid === true) setStatus("valid");
        else if (data.reason === "already_unsubscribed") setStatus("already");
        else setStatus("invalid");
      } catch {
        setStatus("invalid");
      }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "handle-email-unsubscribe",
        { body: { token } }
      );
      if (error) throw error;
      if (data?.success) setStatus("success");
      else if (data?.reason === "already_unsubscribed") setStatus("already");
      else setStatus("error");
    } catch {
      setStatus("error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
              <p className="text-muted-foreground">Wird geladen…</p>
            </>
          )}

          {status === "valid" && (
            <>
              <MailX className="w-12 h-12 mx-auto text-primary" />
              <h1 className="text-xl font-bold text-foreground">E-Mails abbestellen</h1>
              <p className="text-muted-foreground text-sm">
                Möchtest du keine App-E-Mails mehr von H!Outz erhalten? 
                Auth-E-Mails (Passwort-Reset etc.) sind davon nicht betroffen.
              </p>
              <Button
                onClick={handleUnsubscribe}
                disabled={processing}
                className="w-full"
              >
                {processing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Wird abbestellt…</>
                ) : (
                  "Abbestellen bestätigen"
                )}
              </Button>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
              <h1 className="text-xl font-bold text-foreground">Erfolgreich abbestellt</h1>
              <p className="text-muted-foreground text-sm">
                Du erhältst keine App-E-Mails mehr von H!Outz.
              </p>
            </>
          )}

          {status === "already" && (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground" />
              <h1 className="text-xl font-bold text-foreground">Bereits abbestellt</h1>
              <p className="text-muted-foreground text-sm">
                Du hast dich bereits abgemeldet.
              </p>
            </>
          )}

          {status === "invalid" && (
            <>
              <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
              <h1 className="text-xl font-bold text-foreground">Ungültiger Link</h1>
              <p className="text-muted-foreground text-sm">
                Dieser Abmelde-Link ist ungültig oder abgelaufen.
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
              <h1 className="text-xl font-bold text-foreground">Fehler</h1>
              <p className="text-muted-foreground text-sm">
                Beim Abbestellen ist ein Fehler aufgetreten. Bitte versuche es erneut.
              </p>
              <Button onClick={handleUnsubscribe} variant="outline" className="w-full">
                Erneut versuchen
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
