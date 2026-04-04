"use client"

import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { HeroSection } from '@/components/home/hero-section'
import { WhyChooseSection } from '@/components/home/why-choose-section'
import { FeaturesCarousel } from '@/components/home/features-carousel'
import { HowItWorksSection } from '@/components/home/how-it-works-section'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <WhyChooseSection />
        <FeaturesCarousel />
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  )
}
