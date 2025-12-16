import { Hero } from './components/Hero'
import { BrandsMarquee } from './components/BrandsMarquee'
import { HomeCarousels } from './components/HomeCarousels'

export function HomePage() {
  return (
    <div className="w-full">
      <div className="mx-auto w-full max-w-8xl space-y-8 px-4 py-6">
        <Hero />
        <BrandsMarquee />
      </div>

      <div className="w-full pb-6">
        <HomeCarousels />
      </div>
    </div>
  )
}
