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
            VybePulse GmbH (i.&nbsp;Gr.)<br />
            [Straße und Hausnummer]<br />
            [PLZ] [Ort]<br />
            Deutschland
          </p>

          <h3>Vertreten durch</h3>
          <p className="text-muted-foreground">[Geschäftsführer / Inhaber]</p>

          <h3>Kontakt</h3>
          <p className="text-muted-foreground">
            Telefon: [Telefonnummer]<br />
            E-Mail: kontakt@dzeng.app
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

          <h3>EU-Streitschlichtung</h3>
          <p className="text-muted-foreground">
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-primary">
              ec.europa.eu/consumers/odr
            </a>.<br />
            Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>

          <h3>Haftung für Inhalte</h3>
          <p className="text-muted-foreground">
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den
            allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht
            verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen
            zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          </p>

          <h3>Haftung für Links</h3>
          <p className="text-muted-foreground">
            Unsere App enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
            Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
            verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
          </p>

          <h3>Urheberrecht</h3>
          <p className="text-muted-foreground">
            Die durch den Anbieter erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen
            Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb
            der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors
            bzw. Erstellers.
          </p>

          <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border/50">
            <p className="text-xs text-muted-foreground italic">
              ⚠️ Platzhalter in eckigen Klammern müssen durch die tatsächlichen Unternehmensdaten ersetzt werden.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
