/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'H!Outz'

interface DateInvitationProps {
  senderName?: string
  title?: string
  venueName?: string
  proposedDate?: string
  message?: string
  invitationId?: string
}

const DateInvitationEmail = ({
  senderName,
  title,
  venueName,
  proposedDate,
  message,
  invitationId,
}: DateInvitationProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>
      {senderName || 'Jemand'} hat dich zu einem Date eingeladen! 💌
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={logo}>H!Outz</Heading>
        <Heading style={h1}>Du hast eine Date-Einladung! 💌</Heading>
        <Text style={text}>
          <strong>{senderName || 'Jemand'}</strong> möchte mit dir ausgehen
          {title ? ` — "${title}"` : ''}.
        </Text>
        {(venueName || proposedDate) && (
          <Section style={detailsBox}>
            {venueName && (
              <Text style={detailText}>📍 <strong>Venue:</strong> {venueName}</Text>
            )}
            {proposedDate && (
              <Text style={detailText}>📅 <strong>Wann:</strong> {proposedDate}</Text>
            )}
          </Section>
        )}
        {message && (
          <Section style={messageBox}>
            <Text style={messageText}>„{message}"</Text>
          </Section>
        )}
        <Button
          style={button}
          href={`https://hioutz.app/invitations${invitationId ? `?highlight=${invitationId}` : ''}`}
        >
          Einladung ansehen
        </Button>
        <Hr style={hr} />
        <Text style={footer}>© {SITE_NAME} — Dein KI-Date-Planer</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: DateInvitationEmail,
  subject: (data: Record<string, any>) =>
    `${data.senderName || 'Jemand'} hat dich zu einem Date eingeladen!`,
  displayName: 'Date-Einladung',
  previewData: {
    senderName: 'Max',
    title: 'Abendessen im Schanzenviertel',
    venueName: 'Café Gnosa',
    proposedDate: 'Samstag, 19. April um 19:30 Uhr',
    message: 'Habe von dem Laden gehört — soll richtig gut sein!',
    invitationId: 'demo-123',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto' }
const logo = { fontSize: '28px', fontWeight: 'bold' as const, color: 'hsl(175, 84%, 32%)', margin: '0 0 30px', textAlign: 'center' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const detailsBox = { backgroundColor: '#f0faf8', borderRadius: '12px', padding: '16px 20px', margin: '0 0 20px' }
const detailText = { fontSize: '14px', color: '#333', margin: '0 0 6px', lineHeight: '1.5' }
const messageBox = { borderLeft: '4px solid hsl(175, 84%, 32%)', padding: '8px 16px', margin: '0 0 20px', borderRadius: '0 8px 8px 0' }
const messageText = { fontSize: '14px', color: '#555', fontStyle: 'italic' as const, margin: '0', lineHeight: '1.5' }
const button = { backgroundColor: 'hsl(175, 84%, 32%)', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', display: 'block' as const, textAlign: 'center' as const }
const hr = { borderColor: '#eaeaea', margin: '30px 0 15px' }
const footer = { fontSize: '12px', color: '#cccccc', margin: '0', textAlign: 'center' as const }
