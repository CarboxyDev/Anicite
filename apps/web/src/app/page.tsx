import { Features } from '@/components/landing/features';
import { Footer } from '@/components/landing/footer';
import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { Navbar } from '@/components/landing/navbar';
import { Privacy } from '@/components/landing/privacy';
import { Showcase } from '@/components/landing/showcase';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <Navbar />
      <Hero />
      <Features />
      <Showcase />
      <HowItWorks />
      <Privacy />
      <Footer />
    </main>
  );
}
