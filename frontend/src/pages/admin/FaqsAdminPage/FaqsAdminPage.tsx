import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Faq } from '@/entities/faq/types'
import { useAuth } from '@/features/auth/AuthContext'
import { adminCreateFaq, adminDeleteFaq, adminListFaqs, adminUpdateFaq } from '@/features/admin/adminApi'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'
import { useToast } from '@/shared/components/ToastProvider'

type FormState = Omit<Faq, 'id'> & { question: string; answer: string; order: number }

function emptyForm(): FormState {
  return { question: '', answer: '', order: 0 }
}

export function FaqsAdminPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const { push } = useToast()

  const [faqs, setFaqs] = useState<Faq[]>([])
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
        const result = await adminListFaqs(token)
        if (!cancelled) setFaqs(result.data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando FAQs.')
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
    const payload = { question: form.question.trim(), answer: form.answer.trim(), order: form.order ?? 0 }
    if (!payload.question || !payload.answer) return

    try {
      if (editingId) {
        const res = await adminUpdateFaq(token, editingId, payload)
        setFaqs((prev) => prev.map((f) => (f.id === editingId ? res.faq : f)))
      } else {
        const res = await adminCreateFaq(token, payload)
        setFaqs((prev) => [res.faq, ...prev])
      }
      setEditingId(null)
      setForm(emptyForm())
      push({ type: 'success', title: 'FAQ guardada' })
    } catch (e) {
      push({ type: 'error', title: 'No se pudo guardar', message: e instanceof Error ? e.message : undefined })
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">FAQs</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 lg:col-span-2">
          <div className="text-sm font-semibold">Listado</div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Orden</th>
                  <th className="px-4 py-3">Pregunta</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {faqs.map((f) => (
                  <tr key={f.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-semibold">{f.order}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{f.question}</div>
                      <div className="mt-1 max-w-[36rem] truncate text-xs text-slate-600">{f.answer}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          className="text-xs font-semibold text-brand-700 hover:underline"
                          onClick={() => {
                            setEditingId(f.id)
                            setForm({ question: f.question, answer: f.answer, order: f.order })
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="text-xs font-semibold text-rose-600 hover:underline"
                          onClick={async () => {
                            if (!token) return
                            if (!confirm(`Eliminar FAQ #${f.id}?`)) return
                            try {
                              await adminDeleteFaq(token, f.id)
                              setFaqs((prev) => prev.filter((x) => x.id !== f.id))
                              if (editingId === f.id) {
                                setEditingId(null)
                                setForm(emptyForm())
                              }
                              push({ type: 'success', title: 'FAQ eliminada' })
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
                {faqs.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-sm text-slate-600">
                      No hay FAQs.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <div className="text-sm font-semibold">{editingId ? `Editar #${editingId}` : 'Crear nueva'}</div>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Orden</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                type="number"
                value={form.order}
                onChange={(e) => setForm((p) => ({ ...p, order: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Pregunta</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                value={form.question}
                onChange={(e) => setForm((p) => ({ ...p, question: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Respuesta</label>
              <textarea
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                rows={6}
                value={form.answer}
                onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))}
              />
            </div>

            <button
              className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              disabled={!form.question.trim() || !form.answer.trim()}
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
