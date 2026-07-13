/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Hr, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'H!Outz'

// Fixed recipient for internal support notifications.
const SUPPORT_INBOX = 'support@hioutz.app'

const CATEGORY_LABELS: Record<string, string> = {
  general: 'Allgemein',
  bug: 'Bug',
  account: 'Konto',
  payment: 'Zahlung',
  partner: 'Partner',
  feature: 'Feature',
  other: 'Sonstiges',
}

interface SupportTicketProps {
  category?: string
  subject?: string
  message?: string
  contactEmail?: string
  createdAt?: string
}

const SupportTicketNotificationEmail = ({
  category, subject, message, contactEmail, createdAt,
}: SupportTicketProps) => {
  const categoryLabel = CATEGORY_LABELS[category ?? 'general'] ?? category ?? 'Allgemein'
  return (
    <Html lang="de" dir="ltr">
      <Head />
      <Preview>Neues Support-Ticket: {subject || 'Ohne Betreff'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={logo}>H!Outz</Heading>
          <Heading style={h1}>Neues Support-Ticket 🎫</Heading>
          <Section style={metaBox}>
            <Text style={metaText}><strong>Kategorie:</strong> {categoryLabel}</Text>
            <Text style={metaText}><strong>Betreff:</strong> {subject || '—'}</Text>
            <Text style={metaText}><strong>Von:</strong> {contactEmail || 'Unbekannt'}</Text>
            {createdAt && (
              <Text style={metaText}><strong>Eingegangen:</strong> {createdAt}</Text>
            )}
          </Section>
          <Text style={label}>Nachricht:</Text>
          <Section style={messageBox}>
            <Text style={messageText}>{message || '(keine Nachricht)'}</Text>
          </Section>
          {contactEmail && (
            <Button
              style={button}
              href={`mailto:${contactEmail}?subject=${encodeURIComponent('Re: ' + (subject || 'Deine Support-Anfrage'))}`}
            >
              Direkt antworten
            </Button>
          )}
          <Hr style={hr} />
          <Text style={footer}>© {SITE_NAME} — Support-Benachrichtigung</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: SupportTicketNotificationEmail,
  subject: (data: Record<string, any>) =>
    `Neues Support-Ticket: ${data.subject || 'Ohne Betreff'}`,
  to: SUPPORT_INBOX,
  displayName: 'Support-Ticket-Benachrichtigung',
  previewData: {
    category: 'bug',
    subject: 'App stürzt beim Login ab',
    message: 'Wenn ich mich mit Google anmelde, bleibt der Bildschirm weiß.',
    contactEmail: 'nutzer@example.com',
    createdAt: '13.07.2026, 14:30',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto' }
const logo = { fontSize: '28px', fontWeight: 'bold' as const, color: 'hsl(175, 84%, 32%)', margin: '0 0 30px', textAlign: 'center' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 20px' }
const metaBox = { backgroundColor: '#f8f9fa', padding: '16px 20px', margin: '0 0 20px', borderRadius: '8px' }
const metaText = { fontSize: '14px', color: '#333', margin: '0 0 6px', lineHeight: '1.5' }
const label = { fontSize: '14px', fontWeight: '600' as const, color: '#1a1a2e', margin: '0 0 8px' }
const messageBox = { backgroundColor: '#ffffff', borderLeft: '4px solid hsl(175, 84%, 32%)', padding: '12px 16px', margin: '0 0 24px', borderRadius: '0 8px 8px 0' }
const messageText = { fontSize: '15px', color: '#55575d', margin: '0', lineHeight: '1.6', whiteSpace: 'pre-wrap' as const }
const button = { backgroundColor: 'hsl(175, 84%, 32%)', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', display: 'block' as const, textAlign: 'center' as const }
const hr = { borderColor: '#eaeaea', margin: '30px 0 15px' }
const footer = { fontSize: '12px', color: '#cccccc', margin: '0', textAlign: 'center' as const }
