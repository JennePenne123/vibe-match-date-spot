/**
 * Zentrale Firmendaten für alle Rechtstexte (Impressum, AGB, Datenschutz, Widerrufsformular).
 *
 * ℹ️ Einzelunternehmen: Handelsregisterangaben entfallen.
 * USt-IdNr. wird nach Unternehmensgründung ergänzt.
 * Telefonische Erreichbarkeit ist vorerst nicht vorgesehen; Kontakt ausschließlich per E-Mail.
 */
export const COMPANY = {
  legalName: 'H!Outz (Einzelunternehmen)',
  street: 'Hellbrookkamp 16',
  zip: '22177',
  city: 'Hamburg',
  country: 'Deutschland',
  ceo: 'Lennart Mützelburg',
  contentResponsibleName: 'Lennart Mützelburg', // § 18 Abs. 2 MStV
  contentResponsibleAddress: 'Hellbrookkamp 16, 22177 Hamburg',
  phone: '',
  contactEmail: 'kontakt@hioutz.app',
  supportEmail: 'support@hioutz.app',
  privacyEmail: 'datenschutz@hioutz.app',
  registerCourt: 'nicht zutreffend für Einzelunternehmen',
  registerNumber: 'nicht zutreffend für Einzelunternehmen',
  vatId: 'wird nach Unternehmensgründung ergänzt',
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
