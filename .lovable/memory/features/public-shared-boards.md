---
name: Public Shared Boards
description: Öffentlich teilbare Venue-Boards unter /b/:slug mit Gast-Voting, als Wachstumskanal (Antwort auf Converge Social-Layer)
type: feature
---

- Route `/b/:slug` (SharedBoard.tsx) ist öffentlich, ohne Login und ohne AppLayout.
- Tabellen: `shared_boards` (slug, owner_id, title, city, note, venues JSONB, view_count, expires_at) und `shared_board_votes`.
- Gäste stimmen ohne Konto ab; Identifikation über zufällige Gerätekennung in `localStorage` (`hioutz-board-voter-key`), Name optional (`hioutz-board-voter-name`).
- Board-Links laufen standardmäßig nach 30 Tagen ab; Aufrufe zählt die SECURITY-DEFINER-RPC `increment_shared_board_view`.
- Erstellung über `CreateBoardButton` auf der Ergebnisseite (max. 8 Venues pro Board).
- iMessage: keine native Anbindung möglich (Apple erlaubt keine externe API). Boards werden über das System-Share-Sheet geteilt; eine echte iMessage-App setzt den nativen iOS-Build voraus.
- Bekannte Grenze: Klassischer Vite-SPA-Stack rendert keine boardspezifische Linkvorschau (kein SSR).

- Share-Links laufen über die Edge Function `board-preview` (`/functions/v1/board-preview/:slug`): Crawler bekommen board-spezifische OG-Tags (Titel, erstes Venue-Bild), echte Browser werden per 302 auf `/b/:slug` weitergeleitet. Helper: `buildBoardShareUrl`.
