import { Outlet, useLocation } from 'react-router-dom'
import { CartProvider } from '@/features/cart/CartContext'
import { Footer } from '@/shared/components/Footer'
import { PublicHeader } from '@/shared/components/PublicHeader'

export function PublicLayout() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const isProducts = pathname === '/productos' || pathname.startsWith('/productos/')
  const mainClassName = isHome
    ? 'w-full'
    : isProducts
      ? 'mx-auto w-full max-w-8xl px-4 py-6'
      : 'mx-auto w-full max-w-6xl px-4 py-6'

  return (
    <div className="min-h-dvh bg-white">
      <CartProvider>
        <PublicHeader />
        <main className={mainClassName}>
          <Outlet />
        </main>
        <Footer />
      </CartProvider>
    </div>
  )
}
