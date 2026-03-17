import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2 } from 'lucide-react';

export default function Impressum() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Impressum
            </h1>
          </div>
        </div>

        <div className="px-4 py-6 prose prose-sm dark:prose-invert max-w-none">
          <h2>Angaben gemäß § 5 DDG</h2>
          <p className="text-muted-foreground">
            [Firmenname]<br />
            [Straße und Hausnummer]<br />
            [PLZ und Ort]<br />
            [Land]
          </p>

          <h3>Vertreten durch</h3>
          <p className="text-muted-foreground">[Geschäftsführer / Inhaber]</p>

          <h3>Kontakt</h3>
          <p className="text-muted-foreground">
            Telefon: [Telefonnummer]<br />
            E-Mail: [E-Mail-Adresse]
          </p>

          <h3>Handelsregister</h3>
          <p className="text-muted-foreground">
            Registergericht: [Amtsgericht]<br />
            Registernummer: [HRB-Nummer]
          </p>

          <h3>Umsatzsteuer-ID</h3>
          <p className="text-muted-foreground">
            Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG:<br />
            [USt-IdNr.]
          </p>

          <h3>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h3>
          <p className="text-muted-foreground">
            [Name]<br />
            [Adresse]
          </p>

          <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground italic">
              Diese Seite enthält Platzhalter. Bitte ersetze die Angaben in eckigen Klammern durch die tatsächlichen Unternehmensdaten.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
