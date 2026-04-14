/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Text, Section, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'H!Outz'

interface DateReminderProps {
  partnerName?: string
  venueName?: string
  dateTime?: string
  title?: string
}

const DateReminderEmail = ({
  partnerName,
  venueName,
  dateTime,
  title,
}: DateReminderProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>
      Erinnerung: Dein Date{partnerName ? ` mit ${partnerName}` : ''} steht bald an! ⏰
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={logo}>H!Outz</Heading>
        <Heading style={h1}>Dein Date steht an! ⏰</Heading>
        <Text style={text}>
          Nicht vergessen — {title ? `„${title}"` : 'dein Date'}
          {partnerName ? ` mit ${partnerName}` : ''} ist bald soweit.
        </Text>
        <Section style={detailsBox}>
          {venueName && (
            <Text style={detailText}>📍 <strong>Wo:</strong> {venueName}</Text>
          )}
          {dateTime && (
            <Text style={detailText}>🕐 <strong>Wann:</strong> {dateTime}</Text>
          )}
        </Section>
        <Text style={text}>
          Viel Spaß! Vergiss nicht, danach dein Date zu bewerten — damit wird
          die KI noch besser. 🎯
        </Text>
        <Button style={button} href="https://hioutz.app/invitations">
          Meine Dates ansehen
        </Button>
        <Hr style={hr} />
        <Text style={footer}>© {SITE_NAME} — Dein KI-Date-Planer</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: DateReminderEmail,
  subject: (data: Record<string, any>) =>
    `Erinnerung: Dein Date${data.partnerName ? ` mit ${data.partnerName}` : ''} ist morgen!`,
  displayName: 'Date-Erinnerung',
  previewData: {
    partnerName: 'Lisa',
    venueName: 'The Chug Club',
    dateTime: 'Samstag, 19. April um 20:00 Uhr',
    title: 'Cocktail-Abend',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto' }
const logo = { fontSize: '28px', fontWeight: 'bold' as const, color: 'hsl(175, 84%, 32%)', margin: '0 0 30px', textAlign: 'center' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#55575d', lineHeight: '1.6', margin: '0 0 20px' }
const detailsBox = { backgroundColor: '#f0faf8', borderRadius: '12px', padding: '16px 20px', margin: '0 0 20px' }
const detailText = { fontSize: '14px', color: '#333', margin: '0 0 6px', lineHeight: '1.5' }
const button = { backgroundColor: 'hsl(175, 84%, 32%)', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', display: 'block' as const, textAlign: 'center' as const }
const hr = { borderColor: '#eaeaea', margin: '30px 0 15px' }
const footer = { fontSize: '12px', color: '#cccccc', margin: '0', textAlign: 'center' as const }
