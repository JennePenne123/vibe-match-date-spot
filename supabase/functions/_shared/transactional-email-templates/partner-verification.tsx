/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'H!Outz'

interface PartnerVerificationProps {
  businessName?: string
  status?: 'verified' | 'rejected' | 'pending_review'
  notes?: string
}

const PartnerVerificationEmail = ({ businessName, status, notes }: PartnerVerificationProps) => {
  const isVerified = status === 'verified'
  const isRejected = status === 'rejected'

  return (
    <Html lang="de" dir="ltr">
      <Head />
      <Preview>
        {isVerified
          ? `${businessName || 'Dein Unternehmen'} wurde verifiziert!`
          : isRejected
            ? `Verifizierung für ${businessName || 'dein Unternehmen'} nicht erfolgreich`
            : `Update zu deiner Partner-Verifizierung`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={logo}>H!Outz</Heading>
          {isVerified ? (
            <>
              <Heading style={h1}>Verifizierung erfolgreich! ✅</Heading>
              <Text style={text}>
                Herzlichen Glückwunsch! <strong>{businessName || 'Dein Unternehmen'}</strong> wurde
                erfolgreich als H!Outz-Partner verifiziert.
              </Text>
              <Text style={text}>
                Du kannst jetzt Venues verwalten, Vouchers erstellen und von der
                KI-gestützten Gäste-Vermittlung profitieren.
              </Text>
              <Button style={button} href="https://hioutz.app/partner">
                Partner-Dashboard öffnen
              </Button>
            </>
          ) : isRejected ? (
            <>
              <Heading style={h1}>Verifizierung nicht erfolgreich</Heading>
              <Text style={text}>
                Leider konnte <strong>{businessName || 'dein Unternehmen'}</strong> nicht
                automatisch verifiziert werden.
              </Text>
              {notes && (
                <Section style={noteBox}>
                  <Text style={noteText}>Hinweis: {notes}</Text>
                </Section>
              )}
              <Text style={text}>
                Bitte überprüfe deine Angaben oder kontaktiere uns für eine manuelle Prüfung.
              </Text>
              <Button style={button} href="https://hioutz.app/partner/profile">
                Angaben prüfen
              </Button>
            </>
          ) : (
            <>
              <Heading style={h1}>Verifizierung wird geprüft</Heading>
              <Text style={text}>
                Deine Verifizierung für <strong>{businessName || 'dein Unternehmen'}</strong> wird
                aktuell manuell geprüft. Wir melden uns in Kürze.
              </Text>
            </>
          )}
          <Hr style={hr} />
          <Text style={footer}>© {SITE_NAME} — Dein KI-Date-Planer</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: PartnerVerificationEmail,
  subject: (data: Record<string, any>) =>
    data.status === 'verified'
      ? `${data.businessName || 'Dein Unternehmen'} ist jetzt verifiziert!`
      : data.status === 'rejected'
        ? `Verifizierung für ${data.businessName || 'dein Unternehmen'} nicht erfolgreich`
        : `Update zu deiner Partner-Verifizierung`,
  displayName: 'Partner-Verifizierung',
  previewData: { businessName: 'Café Sonnenschein', status: 'verified' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto' }
const logo = { fontSize: '28px', fontWeight: 'bold' as const, color: 'hsl(175, 84%, 32%)', margin: '0 0 30px', textAlign: 'center' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const button = { backgroundColor: 'hsl(175, 84%, 32%)', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', display: 'block' as const, textAlign: 'center' as const }
const noteBox = { backgroundColor: '#f8f9fa', borderLeft: '4px solid hsl(25, 95%, 53%)', padding: '12px 16px', margin: '0 0 20px', borderRadius: '0 8px 8px 0' }
const noteText = { fontSize: '14px', color: '#333', margin: '0', lineHeight: '1.5' }
const hr = { borderColor: '#eaeaea', margin: '30px 0 15px' }
const footer = { fontSize: '12px', color: '#cccccc', margin: '0', textAlign: 'center' as const }
