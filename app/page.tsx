import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { HeroSection } from '@/components/sections/hero'
import { Gallery3DSection } from '@/components/sections/gallery-3d'
import { FlavorsByStore } from '@/components/sections/flavors-by-store'
import { FeaturedFlavors } from '@/components/sections/featured-flavors'
import { StoresSection } from '@/components/sections/stores'
import { CTASection } from '@/components/sections/cta'
import { HeroSection2 } from '@/components/sections/hero2'
import { HeroSection3 } from '@/components/sections/hero3'
import GalleryMinimalist from '@/components/sections/gallery-minimalist'
import { FeaturesCardsOnly } from '@/components/sections/info-cards'
import { ProductShowcase } from '@/components/sections/product-showcase'

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <FlavorsByStore />
        <FeaturedFlavors />
        <FeaturesCardsOnly />
        <HeroSection2 />
        <GalleryMinimalist />
        <HeroSection3 />
        <StoresSection />
        <CTASection />
      </main>
      <Footer />
    </>
  )
}
