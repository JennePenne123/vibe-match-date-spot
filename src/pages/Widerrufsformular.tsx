import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Widerrufsformular() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück
        </button>

        <h1 className="text-2xl font-bold mb-2">Muster-Widerrufsformular</h1>
        <p className="text-sm text-muted-foreground mb-6">
          (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)
        </p>

        <div className="space-y-6 text-[15px] leading-relaxed">
          <div className="p-5 rounded-xl bg-muted/30 border border-border/50 space-y-3">
            <p className="text-muted-foreground">An:</p>
            <p className="font-medium">
              HiOutz GmbH (i.&nbsp;Gr.)
              <br />
              [Adresse]
              <br />
              E-Mail: support@hioutz.app
            </p>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>
              Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über die Erbringung
              der folgenden Dienstleistung:
            </p>

            <div className="border-b border-border/50 pb-1">
              <p className="text-xs text-muted-foreground/70 mb-1">Dienstleistung</p>
              <p className="text-foreground">H!Outz Premium-Abonnement / Partner-Mitgliedschaft (*)</p>
            </div>

            <div className="border-b border-border/50 pb-1">
              <p className="text-xs text-muted-foreground/70 mb-1">Bestellt am / erhalten am (*)</p>
              <p className="text-foreground italic">_______________</p>
            </div>

            <div className="border-b border-border/50 pb-1">
              <p className="text-xs text-muted-foreground/70 mb-1">Name des/der Verbraucher(s)</p>
              <p className="text-foreground italic">_______________</p>
            </div>

            <div className="border-b border-border/50 pb-1">
              <p className="text-xs text-muted-foreground/70 mb-1">Anschrift des/der Verbraucher(s)</p>
              <p className="text-foreground italic">_______________</p>
            </div>

            <div className="border-b border-border/50 pb-1">
              <p className="text-xs text-muted-foreground/70 mb-1">
                Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)
              </p>
              <p className="text-foreground italic">_______________</p>
            </div>

            <div className="border-b border-border/50 pb-1">
              <p className="text-xs text-muted-foreground/70 mb-1">Datum</p>
              <p className="text-foreground italic">_______________</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            (*) Unzutreffendes streichen.
          </p>

          <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground">
              Gemäß Anlage 2 zu Art.&nbsp;246a §&nbsp;1 Abs.&nbsp;2 S.&nbsp;1 Nr.&nbsp;1 EGBGB.
              Sie können den Widerruf auch formlos per E-Mail an{' '}
              <a href="mailto:support@hioutz.app" className="text-primary">
                support@hioutz.app
              </a>{' '}
              erklären.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
