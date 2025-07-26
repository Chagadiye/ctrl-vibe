import HeroSection from "@/components/HeroSection";
import BenefitsSection from "@/components/BenefitsSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <HeroSection />
      <BenefitsSection />
      <Footer />
    </main>
  );
}
