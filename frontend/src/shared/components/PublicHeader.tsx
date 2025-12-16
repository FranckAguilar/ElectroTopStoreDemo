import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { useCart } from '@/features/cart/CartContext'
import { useSettings } from '@/features/settings/SettingsContext'
import { prefetchBrands } from '@/entities/brand/api'
import { prefetchCategories } from '@/entities/category/api'
import { prefetchFaqs } from '@/entities/faq/api'
import { prefetchOrders } from '@/entities/order/api'
import { prefetchProductsList } from '@/entities/product/api'
import { prefetchPaymentMethods } from '@/entities/paymentMethod/api'
import {
  CartIcon,
  ChevronDownIcon,
  ClockIcon,
  MailIcon,
  PhoneIcon,
  SearchIcon,
  UserIcon,
} from '@/shared/components/icons'

function NavItem({
  to,
  label,
  onPrefetch,
}: {
  to: string
  label: string
  onPrefetch?: () => void
}) {
  return (
    <NavLink
      to={to}
      onPointerEnter={onPrefetch}
      className={({ isActive }) =>
        [
          'px-3 py-2 text-sm font-medium transition-colors',
          isActive ? 'text-brand-600' : 'text-slate-700 hover:text-brand-600',
        ].join(' ')
      }
    >
      {label}
    </NavLink>
  )
}

export function PublicHeader() {
  const navigate = useNavigate()
  const { user, token, logout } = useAuth()
  const { cart } = useCart()
  const { get } = useSettings()
  const [search, setSearch] = useState('')
  const prefetchProducts = () => {
    void prefetchProductsList()
    void prefetchCategories()
    void prefetchBrands()
  }
  const prefetchPayments = () => {
    void prefetchPaymentMethods()
  }
  const prefetchFaq = () => {
    void prefetchFaqs()
  }
  const prefetchMyOrders = () => {
    if (!token) return
    void prefetchOrders(token)
    void prefetchPaymentMethods()
  }

  const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0
  const phone = get('store.phone', '+51 987 654 321')
  const email = get('store.email', 'ventas@electrotop.pe')
  const schedule = get('store.schedule', `Lun - S\u00e1b: 9:00 AM - 7:00 PM`)

  return (
    <header className="border-b bg-white">
      <div className="bg-slate-800 text-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="inline-flex items-center gap-2">
              <PhoneIcon className="h-4 w-4 text-rose-400" /> {phone}
            </span>
            <span className="text-slate-500">|</span>
            <span className="inline-flex items-center gap-2">
              <MailIcon className="h-4 w-4 text-rose-400" /> {email}
            </span>
          </div>
          <div className="inline-flex items-center gap-2 text-white/90">
            <ClockIcon className="h-4 w-4 text-rose-400" />
            {schedule}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="grid grid-cols-[1fr,auto] gap-4 py-4 md:grid-cols-[1fr,minmax(0,520px),1fr] md:items-center">
          <div className="order-1 md:justify-self-start">
            <Link to="/" className="text-2xl font-extrabold tracking-tight text-brand-600">
              ELECTROTOP
            </Link>
          </div>

          <form
            className="order-3 col-span-2 flex w-full items-center md:order-2 md:col-span-1 md:justify-self-center"
            onSubmit={(e) => {
              e.preventDefault()
              const q = search.trim()
              navigate(q ? `/productos?q=${encodeURIComponent(q)}` : '/productos')
            }}
          >
            <div className="flex w-full overflow-hidden rounded-full border-2 border-slate-200 bg-white focus-within:border-brand-600">
              <input
                placeholder={`Buscar c\u00e1maras, alarmas, redes...`}
                className="w-full bg-transparent px-5 py-2.5 text-sm outline-none placeholder:text-slate-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                type="submit"
                className="inline-flex w-16 items-center justify-center border-l border-slate-200 bg-brand-600 text-white hover:bg-brand-700"
                aria-label="Buscar"
              >
                <SearchIcon className="h-5 w-5" />
              </button>
            </div>
          </form>

          <div className="order-2 flex items-center justify-end gap-6 justify-self-end md:order-3 md:justify-self-end">
            {user ? (
              <div className="group relative">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-brand-600"
                >
                  <UserIcon className="h-4 w-4 text-slate-600" />
                  <span>Hola, {user.name}</span>
                  <ChevronDownIcon className="h-4 w-4 text-slate-500" />
                </button>

                <div className="absolute right-0 top-full z-20 hidden w-48 pt-2 group-hover:block">
                  <div className="rounded-xl border bg-white py-2 shadow-lg">
                    <Link
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                      to="/perfil"
                    >
                      Mi perfil
                    </Link>
                    <Link
                      className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                      to="/mis-pedidos"
                      onPointerEnter={prefetchMyOrders}
                    >
                      Mis pedidos
                    </Link>
                    <div className="my-2 border-t" />
                    <button
                      className="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-slate-50"
                      onClick={() => logout()}
                    >
                      {`Cerrar sesi\u00f3n`}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/perfil"
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-brand-600"
              >
                <UserIcon className="h-4 w-4 text-slate-600" /> Ingresar
              </Link>
            )}
            <Link
              to="/carrito"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-brand-600"
            >
              <CartIcon className="h-4 w-4 text-slate-700" />
              <span>Carrito</span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{cartCount}</span>
            </Link>
          </div>
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-2 border-t py-2">
          <NavItem to="/" label="Inicio" />
          <NavItem to="/productos" label="Productos" onPrefetch={prefetchProducts} />
          <NavItem to="/medios-de-pago" label="Medios de pago" onPrefetch={prefetchPayments} />
          <NavItem to="/ubicacion" label={`Ubicaci\u00f3n`} />
          <NavItem to="/faqs" label="FAQs" onPrefetch={prefetchFaq} />
          <NavItem to="/contacto" label="Contacto" />
        </nav>
      </div>
    </header>
  )
}
