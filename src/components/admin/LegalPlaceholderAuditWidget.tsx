import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, FileText, Loader2 } from 'lucide-react';

type LegalPage = {
  label: string;
  path: string;
  source: string;
};

const LEGAL_PAGES: LegalPage[] = [
  { label: 'Impressum',           path: '/impressum',       source: '/src/pages/Impressum.tsx' },
  { label: 'AGB (Nutzer)',        path: '/agb',             source: '/src/pages/AGB.tsx' },
  { label: 'Datenschutz (Nutzer)',path: '/datenschutz',     source: '/src/pages/Datenschutz.tsx' },
  { label: 'AGB (Partner)',       path: '/partner/terms',   source: '/src/pages/partner/Terms.tsx' },
  { label: 'Datenschutz (Partner)', path: '/partner/privacy', source: '/src/pages/partner/Privacy.tsx' },
];

// Pattern: [foo] but not markdown links [text](url) and not arrays [a, b]
const PLACEHOLDER_REGEX = /\[([A-ZÄÖÜ][^\]\n]{1,80})\]/g;

type Finding = {
  page: LegalPage;
  count: number;
  placeholders: string[];
  error?: string;
};

const stripJsx = (src: string): string => {
  // Remove JSX tags, keep text content
  return src
    .replace(/<[^>]+>/g, ' ')
    .replace(/\{[^}]*\}/g, ' ')
    .replace(/import .*?;/g, '')
    .replace(/\s+/g, ' ');
};

export const LegalPlaceholderAuditWidget: React.FC = () => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const results = await Promise.all(
        LEGAL_PAGES.map(async (page): Promise<Finding> => {
          try {
            const res = await fetch(page.source);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const src = await res.text();
            const text = stripJsx(src);
            const matches = new Set<string>();
            let m: RegExpExecArray | null;
            const re = new RegExp(PLACEHOLDER_REGEX);
            while ((m = re.exec(text)) !== null) {
              matches.add(m[1].trim());
            }
            return {
              page,
              count: matches.size,
              placeholders: Array.from(matches).sort(),
            };
          } catch (e: any) {
            return {
              page,
              count: 0,
              placeholders: [],
              error: e.message || 'Fehler beim Lesen',
            };
          }
        })
      );
      if (!cancelled) {
        setFindings(results);
        setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalPlaceholders = findings.reduce((s, f) => s + f.count, 0);
  const allClean = !loading && totalPlaceholders === 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-4 w-4" /> Rechtstexte — Platzhalter-Audit
          </CardTitle>
          <CardDescription>
            Findet alle <code className="text-xs">[Platzhalter]</code> in AGB, Datenschutz &amp; Impressum.
            Nach UG-Gründung ersetzen, bevor öffentlich gelaunched wird.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allClean ? (
            <Alert className="border-emerald-500/50 bg-emerald-500/5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <AlertDescription>
                <strong>Alle Rechtstexte sind launch-ready.</strong> Keine Platzhalter mehr.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-amber-500/50 bg-amber-500/5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription>
                <strong>{totalPlaceholders} offene Platzhalter</strong> in {findings.filter(f => f.count > 0).length} Datei(en) — vor Go-Live ersetzen.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {findings.map(f => (
          <Card key={f.page.path}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{f.page.label}</CardTitle>
                {f.error ? (
                  <Badge variant="destructive">Fehler</Badge>
                ) : f.count === 0 ? (
                  <Badge variant="default" className="bg-emerald-500/20 text-emerald-600 border-emerald-500/40">
                    ✓ Komplett
                  </Badge>
                ) : (
                  <Badge variant="destructive">{f.count} offen</Badge>
                )}
              </div>
              <CardDescription className="text-xs font-mono">{f.page.source}</CardDescription>
            </CardHeader>
            {f.count > 0 && !f.error && (
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5">
                  {f.placeholders.map(ph => (
                    <code key={ph} className="text-xs bg-muted px-2 py-1 rounded">
                      [{ph}]
                    </code>
                  ))}
                </div>
                <Button asChild variant="link" size="sm" className="px-0 mt-2">
                  <a href={f.page.path} target="_blank" rel="noopener">
                    Live-Vorschau öffnen →
                  </a>
                </Button>
              </CardContent>
            )}
            {f.error && (
              <CardContent className="pt-0 text-xs text-muted-foreground">
                {f.error}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
