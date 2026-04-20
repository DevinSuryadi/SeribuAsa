import { Navbar } from "../components/landing/Navbar";
import { HeroSection } from "../components/landing/HeroSection";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";
import { RolesSection } from "../components/landing/RolesSection";
import { VoucherFlowSection } from "../components/landing/VoucherFlowSection";
import { ImpactSection } from "../components/landing/ImpactSection";
import { SDGSection } from "../components/landing/SDGSection";
import { TrustSection } from "../components/landing/TrustSection";
import { CTASection } from "../components/landing/CTASection";
import { Footer } from "../components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <ImpactSection />
        <RolesSection />
        <HowItWorksSection />
        <SDGSection />
        <TrustSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
