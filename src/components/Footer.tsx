import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { COMPANY } from '@/config/companyInfo';

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/30 bg-card/50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>{t('footer.copyright', { year, company: COMPANY.legalName })}</p>
          <div className="flex items-center gap-4">
            <Link to="/impressum" className="hover:text-foreground transition-colors">
              {t('landing.footerLinks.imprint')}
            </Link>
            <Link to="/datenschutz" className="hover:text-foreground transition-colors">
              {t('landing.footerLinks.privacy')}
            </Link>
            <Link to="/agb" className="hover:text-foreground transition-colors">
              {t('landing.footerLinks.terms')}
            </Link>
            <Link to="/kontakt" className="hover:text-foreground transition-colors">
              {t('landing.footerLinks.contact')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
