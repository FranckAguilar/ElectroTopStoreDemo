import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { useCart } from '@/features/cart/CartContext'
import { getSessionId } from '@/features/cart/cartStorage'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { useToast } from '@/shared/components/ToastProvider'

export function ProfilePage() {
  const { push } = useToast()
  const { user, isLoading, login, register, logout } = useAuth()
  const { refresh } = useCart()
  const sessionId = getSessionId()

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (user) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Mi perfil</h1>
        <div className="rounded-2xl border bg-white p-6">
          <div className="text-sm text-slate-600">Nombre</div>
          <div className="mt-1 font-semibold">{user.name}</div>
          <div className="mt-4 text-sm text-slate-600">Email</div>
          <div className="mt-1 font-semibold">{user.email}</div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/mis-pedidos" className="rounded-lg border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Ver mis pedidos
            </Link>
            <button
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              onClick={() => {
                logout()
                push({ type: 'info', title: 'Sesión cerrada' })
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <h1 className="text-xl font-semibold">Mi cuenta</h1>

      <div className="flex rounded-xl border bg-white p-1">
        <button
          className={[
            'w-1/2 rounded-lg px-3 py-2 text-sm font-semibold',
            mode === 'login' ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-50',
          ].join(' ')}
          onClick={() => {
            setMode('login')
            setError(null)
            setPassword('')
            setName('')
            setPhone('')
          }}
        >
          Ingresar
        </button>
        <button
          className={[
            'w-1/2 rounded-lg px-3 py-2 text-sm font-semibold',
            mode === 'register' ? 'bg-brand-600 text-white' : 'text-slate-700 hover:bg-slate-50',
          ].join(' ')}
          onClick={() => {
            setMode('register')
            setError(null)
            setPassword('')
          }}
        >
          Registrarme
        </button>
      </div>

      {error ? <ErrorMessage message={error} /> : null}

      <div className="rounded-2xl border bg-white p-6">
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault()
            setError(null)
            try {
              if (mode === 'register') {
                await register({ name, email, password, phone: phone || undefined }, sessionId)
                push({ type: 'success', title: 'Cuenta creada', message: 'Bienvenido.' })
              } else {
                await login(email, password, sessionId)
                push({ type: 'success', title: 'Sesión iniciada' })
              }
              await refresh()
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Error de autenticación.')
            }
          }}
        >
          {mode === 'register' ? (
            <div>
              <label className="text-xs font-semibold text-slate-600">Nombre</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          ) : null}

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

          {mode === 'register' ? (
            <div>
              <label className="text-xs font-semibold text-slate-600">Teléfono (opcional)</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          ) : null}

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}
