import { Header } from './Header';
import { HeroSection } from './HeroSection';
import { BenefitsSection } from './BenefitsSection';
import { IntegrationsSection } from './IntegrationsSection';
import { EcosystemSection } from './EcosystemSection';
import { TemplatesSection } from './TemplatesSection';
import { FAQSection } from './FAQSection';
import { Footer } from './Footer';

type Page = 'home' | 'register' | 'login';

type HomePageProps = Readonly<{
  onNavigate: (page: Page) => void;
}>;

export function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="h-screen overflow-hidden">
      <Header onNavigate={onNavigate} />
      <main className="h-screen snap-y snap-mandatory scroll-smooth overflow-y-auto pt-20 box-border">
        <HeroSection onNavigate={onNavigate} />
        <BenefitsSection />
        <IntegrationsSection />
        <EcosystemSection />
        <TemplatesSection />
        <FAQSection />
        <Footer />
      </main>
    </div>
  );
}
