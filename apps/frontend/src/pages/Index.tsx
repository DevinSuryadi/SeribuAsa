import { Navbar } from "../components/landing/Navbar";
import { HeroSection } from "../components/landing/HeroSection";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";
import { RolesSection } from "../components/landing/RolesSection";
import { ImpactSection } from "../components/landing/ImpactSection";
import { SDGSection } from "../components/landing/SDGSection";
import { TrustSection } from "../components/landing/TrustSection";
import { CTASection } from "../components/landing/CTASection";
import { Footer } from "../components/landing/Footer";
import { SEO } from "../components/SEO";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Platform Donasi Pangan Berbasis AI"
        description="SeribuAsa menghubungkan donatur dengan keluarga rentan melalui sistem e-voucher nutrisi. Bantu atasi kerawanan pangan untuk 1000 Hari Pertama Kehidupan di Indonesia."
        canonical="https://seribuasa.id/"
        keywords="donasi pangan, bantuan gizi, kerawanan pangan, food insecurity indonesia, 1000 hari pertama, e-voucher nutrisi"
      />
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
