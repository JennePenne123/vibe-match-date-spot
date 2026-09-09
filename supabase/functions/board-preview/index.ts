// Serves crawler-friendly HTML with per-board Open Graph metadata.
// Real browsers get redirected to the SPA board page.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const APP_ORIGIN = Deno.env.get('PUBLIC_APP_ORIGIN') ?? 'https://hioutz.app';
const FALLBACK_IMAGE = `${APP_ORIGIN}/og-image.jpg`;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isCrawler = (ua: string) =>
  /facebookexternalhit|facebot|twitterbot|slackbot|linkedinbot|whatsapp|telegrambot|discordbot|applebot|skypeuripreview|bingbot|googlebot|redditbot|pinterest|vkshare|embedly|quora link preview|nuzzel|outbrain|iframely|imessage|mattermost|snapchat|bot|preview|crawler|spider/i.test(
    ua,
  );

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const slug = (url.pathname.split('/').filter(Boolean).pop() ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 64);

  const target = slug ? `${APP_ORIGIN}/b/${slug}` : APP_ORIGIN;
  const ua = req.headers.get('user-agent') ?? '';

  let title = 'H!Outz Board';
  let description = 'Stimme mit ab, wohin es gehen soll.';
  let image = FALLBACK_IMAGE;

  if (slug) {
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      );
      const { data } = await supabase
        .from('shared_boards')
        .select('title, city, note, venues, is_active, expires_at')
        .eq('slug', slug)
        .maybeSingle();

      if (data && data.is_active !== false) {
        const venues = Array.isArray(data.venues) ? (data.venues as Array<Record<string, unknown>>) : [];
        title = String(data.title ?? title).slice(0, 90);
        const names = venues
          .slice(0, 3)
          .map((v) => String(v?.name ?? ''))
          .filter(Boolean);
        const parts = [
          data.city ? `${venues.length} Orte in ${data.city}` : `${venues.length} Orte`,
          names.length ? names.join(' · ') : '',
          data.note ? String(data.note) : '',
        ].filter(Boolean);
        description = parts.join(' — ').slice(0, 190);
        const firstImage = venues.map((v) => String(v?.image ?? '')).find((v) => v.startsWith('http'));
        if (firstImage) image = firstImage;
      }
    } catch (_e) {
      // fall through to generic preview
    }
  }

  const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)} · H!Outz</title>
<meta name="description" content="${escapeHtml(description)}" />
<link rel="canonical" href="${escapeHtml(target)}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="H!Outz" />
<meta property="og:url" content="${escapeHtml(target)}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:alt" content="${escapeHtml(title)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
<meta http-equiv="refresh" content="0; url=${escapeHtml(target)}" />
</head>
<body>
<p><a href="${escapeHtml(target)}">${escapeHtml(title)}</a></p>
<script>window.location.replace(${JSON.stringify(target)});</script>
</body>
</html>`;

  if (!isCrawler(ua)) {
    return new Response(html, {
      status: 302,
      headers: {
        location: target,
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=60',
      },
    });
  }

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300',
    },
  });
});
