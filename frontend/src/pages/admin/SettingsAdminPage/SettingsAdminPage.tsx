import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Setting } from '@/entities/setting/types'
import { useAuth } from '@/features/auth/AuthContext'
import {
  adminCreateSetting,
  adminDeleteSetting,
  adminListSettings,
  adminUpdateSetting,
} from '@/features/admin/adminApi'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'
import { useToast } from '@/shared/components/ToastProvider'

type FormState = { key: string; value: string }

function emptyForm(): FormState {
  return { key: '', value: '' }
}

export function SettingsAdminPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const { push } = useToast()

  const [settings, setSettings] = useState<Setting[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())

  useEffect(() => {
    if (!token) {
      navigate('/admin/login')
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    void (async () => {
      try {
        const result = await adminListSettings(token)
        if (!cancelled) setSettings(result.data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando settings.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, navigate])

  if (isLoading) return <Loading />
  if (error) return <ErrorMessage message={error} />

  async function submit() {
    if (!token) return
    const payload = { key: form.key.trim(), value: form.value.trim() || null }
    if (!payload.key) return

    try {
      if (editingId) {
        const res = await adminUpdateSetting(token, editingId, payload)
        setSettings((prev) => prev.map((s) => (s.id === editingId ? res.setting : s)))
      } else {
        const res = await adminCreateSetting(token, payload)
        setSettings((prev) => [res.setting, ...prev])
      }
      setEditingId(null)
      setForm(emptyForm())
      push({ type: 'success', title: 'Setting guardado' })
    } catch (e) {
      push({ type: 'error', title: 'No se pudo guardar', message: e instanceof Error ? e.message : undefined })
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Settings</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 lg:col-span-2">
          <div className="text-sm font-semibold">Listado</div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Key</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {settings.map((s) => (
                  <tr key={s.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-mono text-xs">{s.key}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{s.value ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          className="text-xs font-semibold text-brand-700 hover:underline"
                          onClick={() => {
                            setEditingId(s.id)
                            setForm({ key: s.key, value: s.value ?? '' })
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="text-xs font-semibold text-rose-600 hover:underline"
                          onClick={async () => {
                            if (!token) return
                            if (!confirm(`Eliminar setting "${s.key}"?`)) return
                            try {
                              await adminDeleteSetting(token, s.id)
                              setSettings((prev) => prev.filter((x) => x.id !== s.id))
                              if (editingId === s.id) {
                                setEditingId(null)
                                setForm(emptyForm())
                              }
                              push({ type: 'success', title: 'Setting eliminado' })
                            } catch (e) {
                              push({ type: 'error', title: 'No se pudo eliminar', message: e instanceof Error ? e.message : undefined })
                            }
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {settings.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-sm text-slate-600">
                      No hay settings.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <div className="text-sm font-semibold">{editingId ? `Editar #${editingId}` : 'Crear nuevo'}</div>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Key</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 font-mono text-xs outline-none focus:border-brand-600 disabled:bg-slate-50"
                value={form.key}
                disabled={!!editingId}
                onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
                placeholder="store.phone"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Value</label>
              <textarea
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                rows={6}
                value={form.value}
                onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
              />
            </div>

            <button
              className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              disabled={!form.key.trim()}
              onClick={submit}
            >
              Guardar
            </button>
            {editingId ? (
              <button
                className="w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setEditingId(null)
                  setForm(emptyForm())
                }}
              >
                Cancelar
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
