/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

const SITE_NAME = 'H!Outz'

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Du wurdest zu {SITE_NAME} eingeladen!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={logo}>H!Outz</Heading>
        <Heading style={h1}>Du bist eingeladen! 🎉</Heading>
        <Text style={text}>
          Jemand hat dich zu{' '}
          <Link href={siteUrl} style={link}>
            <strong>{SITE_NAME}</strong>
          </Link>{' '}
          eingeladen. Klick auf den Button, um dein Konto zu erstellen:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Einladung annehmen
        </Button>
        <Text style={footer}>
          Falls du keine Einladung erwartet hast, kannst du diese E-Mail ignorieren.
        </Text>
        <Text style={footerBrand}>© {SITE_NAME} — Dein KI-Date-Planer</Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto' }
const logo = { fontSize: '28px', fontWeight: 'bold' as const, color: 'hsl(175, 84%, 32%)', margin: '0 0 30px', textAlign: 'center' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#55575d', lineHeight: '1.6', margin: '0 0 25px' }
const link = { color: 'hsl(175, 84%, 32%)', textDecoration: 'underline' }
const button = { backgroundColor: 'hsl(175, 84%, 32%)', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', display: 'block' as const, textAlign: 'center' as const }
const footer = { fontSize: '13px', color: '#999999', margin: '30px 0 0', lineHeight: '1.5' }
const footerBrand = { fontSize: '12px', color: '#cccccc', margin: '15px 0 0', textAlign: 'center' as const }
