import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Mail, Phone, ExternalLink, Clock } from 'lucide-react';

export default function SupportContactCard() {
  const { t } = useTranslation();

  return (
    <Card variant="glass">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="w-4 h-4 text-primary" />
          {t('partner.support.title', 'Support & Kontakt')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{t('partner.support.email', 'E-Mail Support')}</p>
            <p className="text-xs text-muted-foreground">partner@vybepulse.com</p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <a href="mailto:partner@vybepulse.com">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </Button>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{t('partner.support.phone', 'Telefon-Hotline')}</p>
            <p className="text-xs text-muted-foreground">+49 30 123 456 78</p>
          </div>
          <Badge variant="outline" className="text-[9px] shrink-0">
            <Clock className="w-2.5 h-2.5 mr-0.5" />
            Mo-Fr 9-18
          </Badge>
        </div>

        <div className="p-3 rounded-lg border border-dashed border-primary/20 bg-primary/5 text-center">
          <p className="text-xs text-muted-foreground">
            {t('partner.support.hint', 'Durchschnittliche Antwortzeit: unter 4 Stunden')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
