import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'

export function AdminTopbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  return (
    <div className="flex items-center justify-between border-b bg-white px-4 py-3 md:px-8">
      <Link to="/" className="text-sm font-extrabold tracking-tight text-brand-600">
        ELECTROTOP
      </Link>
      <div className="flex items-center gap-3">
        <div className="text-sm text-slate-700">Hola {user?.name ?? 'Admin'}</div>
        <button
          className="rounded-lg border px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          onClick={() => {
            logout()
            navigate('/admin/login')
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

