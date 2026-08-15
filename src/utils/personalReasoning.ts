// utils/personalReasoning.ts
// Turns raw AI reasoning chips into personal "Ich-Botschaften" ("Weil du ... magst")

export interface PersonalHeadline {
  text: string;
  tone: 'taste' | 'social' | 'context' | 'discovery';
}

const RANK: Array<{ test: RegExp; tone: PersonalHeadline['tone']; rank: number; transform: (r: string) => string }> = [
  {
    test: /Lieblingsküche:\s*(.+)/i,
    tone: 'taste',
    rank: 100,
    transform: (r) => `Weil du ${r.replace(/.*Lieblingsküche:\s*/i, '').trim()} liebst`,
  },
  {
    test: /Erlebnis-Präferenzen/i,
    tone: 'taste',
    rank: 90,
    transform: () => 'Weil das genau deinen Vorlieben entspricht',
  },
  {
    test: /Aktivitäten/i,
    tone: 'taste',
    rank: 85,
    transform: () => 'Weil du solche Aktivitäten magst',
  },
  {
    test: /Preisklasse\s*(.+?)\s*passt/i,
    tone: 'taste',
    rank: 60,
    transform: (r) => `Weil es preislich (${(r.match(/Preisklasse\s*(.+?)\s*passt/i)?.[1] ?? '').trim()}) zu dir passt`,
  },
  {
    test: /freund/i,
    tone: 'social',
    rank: 80,
    transform: (r) => r,
  },
  {
    test: /Bereits\s*(\d+)x besucht/i,
    tone: 'social',
    rank: 70,
    transform: (r) => `Weil du hier schon ${(r.match(/(\d+)x/)?.[1] ?? '')}x warst`,
  },
  {
    test: /-Vibe/i,
    tone: 'context',
    rank: 65,
    transform: (r) => `Weil dir dieser Vibe liegt (${r.replace(/^Passt zum\s*/i, '').trim()})`,
  },
  {
    test: /wetter|draußen|outdoor|°c/i,
    tone: 'context',
    rank: 50,
    transform: (r) => r,
  },
  {
    test: /um die Ecke|Viertel/i,
    tone: 'context',
    rank: 40,
    transform: (r) => `Weil es fast vor deiner Tür liegt – ${r.toLowerCase()}`,
  },
  {
    test: /Neuentdeckung|etwas Neues/i,
    tone: 'discovery',
    rank: 30,
    transform: () => 'Weil du in letzter Zeit offen für Neues warst',
  },
];

/**
 * Picks the strongest signal(s) from the reasoning string and rephrases them
 * as a personal, first-person-addressed sentence.
 */
export function buildPersonalHeadline(aiReasoning?: string | null): PersonalHeadline | null {
  if (!aiReasoning) return null;
  const reasons = aiReasoning.split(' • ').map((r) => r.trim()).filter(Boolean);
  if (reasons.length === 0) return null;

  const scored = reasons
    .map((reason) => {
      const match = RANK.find((entry) => entry.test.test(reason));
      if (!match) return null;
      return { text: match.transform(reason), tone: match.tone, rank: match.rank };
    })
    .filter((x): x is { text: string; tone: PersonalHeadline['tone']; rank: number } => !!x)
    .sort((a, b) => b.rank - a.rank);

  if (scored.length === 0) {
    return { text: reasons[0], tone: 'discovery' };
  }

  const primary = scored[0];
  const secondary = scored.find((s) => s.tone !== primary.tone && s.rank >= 40);
  const text = secondary
    ? `${primary.text} – und ${secondary.text.charAt(0).toLowerCase()}${secondary.text.slice(1)}`
    : primary.text;

  return { text, tone: primary.tone };
}

/** "Lennart Mützelburg" -> "Lennart" */
export function firstNameOf(name?: string | null): string | null {
  if (!name) return null;
  const first = name.trim().split(/\s+/)[0];
  return first && first.length > 1 ? first : null;
}
