import { Header } from './Header';
import { HeroSection } from './HeroSection';
import { BenefitsSection } from './BenefitsSection';
import { IntegrationsSection } from './IntegrationsSection';
import { EcosystemSection } from './EcosystemSection';
import { TemplatesSection } from './TemplatesSection';
import { FAQSection } from './FAQSection';
import { Footer } from './Footer';

type Page = 'home' | 'register' | 'login';

interface HomePageProps {
  onNavigate: (page: Page) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div>
      <Header onNavigate={onNavigate} />
      <main className="pt-20">
        <HeroSection onNavigate={onNavigate} />
        <BenefitsSection />
        <IntegrationsSection />
        <EcosystemSection />
        <TemplatesSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
