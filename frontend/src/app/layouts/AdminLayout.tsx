import { Outlet, useLocation } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthContext'
import { AdminShell } from '@/pages/admin/components/AdminShell'

export function AdminLayout() {
  const location = useLocation()
  const isLogin = location.pathname === '/admin/login'

  return (
    <div className="min-h-dvh bg-slate-50">
      <AuthProvider kind="admin">
        {isLogin ? <Outlet /> : <AdminShell />}
      </AuthProvider>
    </div>
  )
}
