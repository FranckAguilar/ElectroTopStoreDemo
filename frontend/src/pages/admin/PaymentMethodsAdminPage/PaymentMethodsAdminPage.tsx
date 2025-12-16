import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { PaymentMethod } from '@/entities/paymentMethod/types'
import { useAuth } from '@/features/auth/AuthContext'
import {
  adminCreatePaymentMethod,
  adminDeletePaymentMethod,
  adminListPaymentMethods,
  adminUpdatePaymentMethod,
} from '@/features/admin/adminApi'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'
import { useToast } from '@/shared/components/ToastProvider'

type FormState = Omit<PaymentMethod, 'id'> & { name: string }

function emptyForm(): FormState {
  return {
    name: '',
    bank_name: '',
    account_number: '',
    cci_number: '',
    yape_number: '',
    owner_name: '',
    instructions: '',
  }
}

function normalize(form: FormState) {
  return {
    name: form.name.trim(),
    bank_name: form.bank_name?.trim() || null,
    account_number: form.account_number?.trim() || null,
    cci_number: form.cci_number?.trim() || null,
    yape_number: form.yape_number?.trim() || null,
    owner_name: form.owner_name?.trim() || null,
    instructions: form.instructions?.trim() || null,
  } satisfies Partial<PaymentMethod> & { name: string }
}

export function PaymentMethodsAdminPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const { push } = useToast()

  const [methods, setMethods] = useState<PaymentMethod[]>([])
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
        const result = await adminListPaymentMethods(token)
        if (!cancelled) setMethods(result.data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando métodos de pago.')
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
    const payload = normalize(form)
    if (!payload.name) return

    try {
      if (editingId) {
        const res = await adminUpdatePaymentMethod(token, editingId, payload)
        setMethods((prev) => prev.map((m) => (m.id === editingId ? res.payment_method : m)))
      } else {
        const res = await adminCreatePaymentMethod(token, payload)
        setMethods((prev) => [res.payment_method, ...prev])
      }
      setEditingId(null)
      setForm(emptyForm())
      push({ type: 'success', title: 'Método guardado' })
    } catch (e) {
      push({ type: 'error', title: 'No se pudo guardar', message: e instanceof Error ? e.message : undefined })
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Métodos de pago</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 lg:col-span-2">
          <div className="text-sm font-semibold">Listado</div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Cuenta / Yape</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((m) => (
                  <tr key={m.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-semibold">#{m.id}</td>
                    <td className="px-4 py-3">{m.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {m.account_number ?? m.yape_number ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          className="text-xs font-semibold text-brand-700 hover:underline"
                          onClick={() => {
                            setEditingId(m.id)
                            setForm({
                              name: m.name,
                              bank_name: m.bank_name ?? '',
                              account_number: m.account_number ?? '',
                              cci_number: m.cci_number ?? '',
                              yape_number: m.yape_number ?? '',
                              owner_name: m.owner_name ?? '',
                              instructions: m.instructions ?? '',
                            })
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="text-xs font-semibold text-rose-600 hover:underline"
                          onClick={async () => {
                            if (!token) return
                            if (!confirm(`Eliminar método #${m.id}?`)) return
                            try {
                              await adminDeletePaymentMethod(token, m.id)
                              setMethods((prev) => prev.filter((x) => x.id !== m.id))
                              if (editingId === m.id) {
                                setEditingId(null)
                                setForm(emptyForm())
                              }
                              push({ type: 'success', title: 'Método eliminado' })
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
                {methods.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-600">
                      No hay métodos.
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
              <label className="text-xs font-semibold text-slate-600">Nombre</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Yape / Transferencia"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Banco</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                value={form.bank_name ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, bank_name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Cuenta</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                  value={form.account_number ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, account_number: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">CCI</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                  value={form.cci_number ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, cci_number: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Yape</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                  value={form.yape_number ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, yape_number: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Titular</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                  value={form.owner_name ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, owner_name: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Instrucciones</label>
              <textarea
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                rows={4}
                value={form.instructions ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, instructions: e.target.value }))}
              />
            </div>

            <button
              className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              disabled={!form.name.trim()}
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
