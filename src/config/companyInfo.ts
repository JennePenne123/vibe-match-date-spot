/**
 * Zentrale Firmendaten für alle Rechtstexte (Impressum, AGB, Datenschutz, Widerrufsformular).
 *
 * ⚠️ NACH UG-GRÜNDUNG: Hier alle Platzhalter mit "TODO:" durch die echten Daten ersetzen.
 * Dann sind Impressum, AGB, Datenschutz, Widerrufsformular & Partner-Texte automatisch aktuell.
 */
export const COMPANY = {
  legalName: 'H!Outz GmbH (i.\u00a0Gr.)', // TODO: nach Eintrag ins HR auf "H!Outz GmbH" ändern
  street: '[Straße und Hausnummer]', // TODO
  zip: '[PLZ]', // TODO
  city: '[Ort]', // TODO
  country: 'Deutschland',
  ceo: '[Geschäftsführer / Inhaber]', // TODO
  contentResponsibleName: '[Name]', // TODO § 18 Abs. 2 MStV
  contentResponsibleAddress: '[Adresse]', // TODO § 18 Abs. 2 MStV
  phone: '[Telefonnummer]', // TODO
  contactEmail: 'kontakt@hioutz.app',
  supportEmail: 'support@hioutz.app',
  privacyEmail: 'datenschutz@hioutz.app',
  registerCourt: '[Amtsgericht]', // TODO
  registerNumber: '[HRB-Nummer]', // TODO
  vatId: '[USt-IdNr.]', // TODO
} as const;

/** Einzeilige Adresse für Inline-Verwendung in Fließtexten (AGB, Widerrufsbelehrung). */
export const COMPANY_ADDRESS_INLINE = `${COMPANY.street}, ${COMPANY.zip} ${COMPANY.city}`;

/** Vollständiger Adressblock für Impressum/Datenschutz (mehrzeilig, JSX-ready via <br />). */
export const COMPANY_ADDRESS_LINES: readonly string[] = [
  COMPANY.legalName,
  COMPANY.street,
  `${COMPANY.zip} ${COMPANY.city}`,
  COMPANY.country,
];