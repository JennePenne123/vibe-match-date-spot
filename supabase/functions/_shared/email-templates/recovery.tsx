/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

const SITE_NAME = 'H!Outz'

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="de" dir="ltr">
    <Head />
    <Preview>Passwort zurücksetzen — {SITE_NAME}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={logo}>H!Outz</Heading>
        <Heading style={h1}>Passwort zurücksetzen</Heading>
        <Text style={text}>
          Du hast angefordert, dein Passwort für {SITE_NAME} zurückzusetzen. Klick auf den Button, um ein neues Passwort zu vergeben:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Neues Passwort wählen
        </Button>
        <Text style={footer}>
          Falls du kein neues Passwort angefordert hast, ignoriere diese E-Mail einfach. Dein Passwort bleibt unverändert.
        </Text>
        <Text style={footerBrand}>© {SITE_NAME} — Dein KI-Date-Planer</Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 25px', maxWidth: '480px', margin: '0 auto' }
const logo = { fontSize: '28px', fontWeight: 'bold' as const, color: 'hsl(175, 84%, 32%)', margin: '0 0 30px', textAlign: 'center' as const }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1a1a2e', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#55575d', lineHeight: '1.6', margin: '0 0 25px' }
const button = { backgroundColor: 'hsl(175, 84%, 32%)', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', display: 'block' as const, textAlign: 'center' as const }
const footer = { fontSize: '13px', color: '#999999', margin: '30px 0 0', lineHeight: '1.5' }
const footerBrand = { fontSize: '12px', color: '#cccccc', margin: '15px 0 0', textAlign: 'center' as const }
