import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import {
  prefetchAdminBrands,
  prefetchAdminDashboard,
  prefetchAdminPayments,
  prefetchAdminProducts,
  prefetchAdminUsers,
} from '@/features/admin/adminApi'
import {
  BoxIcon,
  BuildingIcon,
  CogIcon,
  CreditCardIcon,
  HomeIcon,
  QuestionIcon,
  ReceiptIcon,
  TagIcon,
  UserIcon,
} from '@/shared/components/icons'

function Item({
  to,
  label,
  icon,
  onPrefetch,
}: {
  to: string
  label: string
  icon?: ReactNode
  onPrefetch?: () => void
}) {
  return (
    <NavLink to={to} onPointerEnter={onPrefetch}>
      {({ isActive }) => (
        <div
          className={[
            'relative flex items-center gap-3 p-3 text-sm font-medium text-slate-600 hover:bg-slate-50',
            isActive ? 'bg-slate-100 text-slate-800' : '',
          ].join(' ')}
        >
          <span className="inline-flex h-5 w-5 items-center justify-center text-slate-500">{icon}</span>
          <span className="truncate">{label}</span>
          {isActive ? <span className="absolute bottom-2 right-0 top-2 w-1 rounded-l bg-emerald-500" /> : null}
        </div>
      )}
    </NavLink>
  )
}

export function AdminSidebar() {
  const { token } = useAuth()
  const prefetchBrands = () => {
    if (!token) return
    void prefetchAdminBrands(token)
  }
  const prefetchProducts = () => {
    if (!token) return
    void prefetchAdminProducts(token)
  }
  const prefetchDashboard = () => {
    if (!token) return
    void prefetchAdminDashboard(token)
  }
  const prefetchUsers = () => {
    if (!token) return
    void prefetchAdminUsers(token)
  }
  const prefetchPayments = () => {
    if (!token) return
    void prefetchAdminPayments(token)
  }

  return (
    <aside className="hidden w-64 border-r bg-white md:block">
      <div className="p-6">
        <div className="flex flex-col items-center gap-3 pt-2">
          <div className="h-14 w-14 rounded-full bg-slate-100" />
          <div className="text-sm font-semibold text-slate-800">ElectroTopStore</div>
        </div>
      </div>
      <nav className="px-2 pb-6">
        <Item to="/admin/panel" label="Panel" icon={<HomeIcon className="h-5 w-5" />} onPrefetch={prefetchDashboard} />
        <Item to="/admin/home" label="Inicio (web)" icon={<HomeIcon className="h-5 w-5" />} />
        <Item to="/admin/users" label="Usuarios" icon={<UserIcon className="h-5 w-5" />} onPrefetch={prefetchUsers} />
        <Item to="/admin/categories" label={`Categor\u00edas`} icon={<TagIcon className="h-5 w-5" />} />
        <Item to="/admin/brands" label="Marcas" icon={<BuildingIcon className="h-5 w-5" />} onPrefetch={prefetchBrands} />
        <Item to="/admin/payment-methods" label={`M\u00e9todos de pago`} icon={<CreditCardIcon className="h-5 w-5" />} />
        <Item to="/admin/products" label="Productos" icon={<BoxIcon className="h-5 w-5" />} onPrefetch={prefetchProducts} />
        <Item to="/admin/orders" label="Pedidos" icon={<ReceiptIcon className="h-5 w-5" />} />
        <Item to="/admin/payments" label="Pagos" icon={<ReceiptIcon className="h-5 w-5" />} onPrefetch={prefetchPayments} />
        <Item to="/admin/quotes" label="Cotizaciones" icon={<ReceiptIcon className="h-5 w-5" />} />
        <Item to="/admin/faqs" label="FAQs" icon={<QuestionIcon className="h-5 w-5" />} />
        <Item to="/admin/settings" label="Settings" icon={<CogIcon className="h-5 w-5" />} />
      </nav>
    </aside>
  )
}
