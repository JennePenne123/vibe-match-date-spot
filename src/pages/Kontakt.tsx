import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, MapPin, MessageSquare } from 'lucide-react';
import { COMPANY } from '@/config/companyInfo';
import { SEO } from '@/components/SEO';
import { useTranslation } from 'react-i18next';

export default function Kontakt() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={t('contact.metaTitle', 'Kontakt – H!Outz')}
        description={t('contact.metaDescription', 'Kontaktiere H!Outz per E-Mail. Wir helfen dir bei Fragen, Feedback oder Support-Anliegen.')}
        path="/kontakt"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'ContactPage',
          name: t('contact.title', 'Kontakt'),
          url: 'https://hioutz.app/kontakt',
          email: COMPANY.contactEmail,
          address: {
            '@type': 'PostalAddress',
            streetAddress: COMPANY.street,
            postalCode: COMPANY.zip,
            addressLocality: COMPANY.city,
            addressCountry: COMPANY.country,
          },
        }}
      />
      <div className="max-w-2xl mx-auto">
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              {t('contact.title', 'Kontakt')}
            </h1>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          <p className="text-muted-foreground">
            {t('contact.intro', 'Hast du Fragen, Feedback oder ein Anliegen? Schreib uns – wir melden uns so schnell wie möglich zurück.')}
          </p>

          <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              {t('contact.emailHeading', 'E-Mail')}
            </h2>
            <p className="text-muted-foreground">
              {t('contact.emailDescription', 'Unsere allgemeine Kontakt- und Support-Adresse:')}
            </p>
            <a
              href={`mailto:${COMPANY.contactEmail}`}
              className="inline-flex items-center gap-2 text-primary font-medium hover:underline underline-offset-4"
              data-testid="contact-email-link"
            >
              <Mail className="w-4 h-4" />
              {COMPANY.contactEmail}
            </a>
          </div>

          <div className="bg-card border border-border/50 rounded-2xl p-5 space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {t('contact.addressHeading', 'Postanschrift')}
            </h2>
            <p className="text-muted-foreground whitespace-pre-line">
              {COMPANY.legalName}{"\n"}
              {COMPANY.street}{"\n"}
              {COMPANY.zip} {COMPANY.city}{"\n"}
              {COMPANY.country}
            </p>
          </div>

          <p className="text-xs text-muted-foreground">
            {t('contact.responseHint', 'Antwortzeiten: In der Regel innerhalb von 48 Stunden.')}
          </p>
        </div>
      </div>
    </div>
  );
}
