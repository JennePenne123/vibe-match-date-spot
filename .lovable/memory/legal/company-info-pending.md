---
name: Firmendaten – Telefon entfernt
description: Inhaber + Adresse eingetragen; Handelsregister-Platzhalter entfernt. Telefonnummer bewusst weggelassen, USt-IdNr. noch nach Gründung zu ergänzen.
type: reference
---

# Firmendaten-Status

- Rechtsform: Einzelunternehmen
- Inhaber: Lennart Mützelburg
- Adresse: Hellbrookkamp 16, 22177 Hamburg
- E-Mail: kontakt@hioutz.app

## Platzhalter-Status

- **Handelsregister**: Entfällt für Einzelunternehmen → in `companyInfo.ts` auf "nicht zutreffend für Einzelunternehmen" gesetzt.
- **Telefon**: Bewusst weggelassen; Impressum blendet Telefonzeile aus und lässt `telephone` im JSON-LD weg.
- **USt-IdNr.**: Noch nicht bekannt → in `companyInfo.ts` als "wird nach Unternehmensgründung ergänzt" hinterlegt.

## Offene Nach-Launch-Aktionen

1. USt-IdNr. ergänzen, sobald vom Finanzamt vergeben.

