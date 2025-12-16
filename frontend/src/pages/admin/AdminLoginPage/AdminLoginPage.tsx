import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { ErrorMessage } from '@/shared/components/ErrorMessage'

export function AdminLoginPage() {
  const navigate = useNavigate()
  const { login, logout, isLoading } = useAuth()

  const [email, setEmail] = useState('admin@electrotopstore.test')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-slate-600">Inicia sesión para administrar la tienda.</p>

        {error ? <div className="mt-4"><ErrorMessage message={error} /></div> : null}

        <form
          className="mt-6 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)
            try {
              const loggedUser = await login(email, password)
              const role = loggedUser.role?.name
              if (role && role !== 'admin') {
                logout()
                setError('Esta cuenta no tiene permisos de admin.')
                return
              }

              navigate('/admin/panel')
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Error de login.')
            }
          }}
        >
          <div>
            <label className="text-xs font-semibold text-slate-600">Email</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Contraseña</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            disabled={isLoading}
          >
            {isLoading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
