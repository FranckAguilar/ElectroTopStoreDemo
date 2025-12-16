import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Category } from '@/entities/category/types'
import { useAuth } from '@/features/auth/AuthContext'
import {
  adminCreateCategory,
  adminDeleteCategory,
  adminListCategories,
  adminUpdateCategory,
} from '@/features/admin/adminApi'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'
import { slugify } from '@/shared/utils/slug'
import { useToast } from '@/shared/components/ToastProvider'

type FormState = { name: string; slug: string; parent_id: number | null }

function emptyForm(): FormState {
  return { name: '', slug: '', parent_id: null }
}

function sortCategoriesById(list: Category[]): Category[] {
  return list.slice().sort((a, b) => a.id - b.id)
}

export function CategoriesAdminPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const { push } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())

  const byId = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

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
        const result = await adminListCategories(token)
        if (!cancelled) setCategories(sortCategoriesById(result.data))
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando categorías.')
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
    const payload = { name: form.name.trim(), slug: form.slug.trim(), parent_id: form.parent_id }
    if (!payload.name || !payload.slug) return

    try {
      if (editingId) {
        const res = await adminUpdateCategory(token, editingId, payload)
        setCategories((prev) => sortCategoriesById(prev.map((c) => (c.id === editingId ? res.category : c))))
      } else {
        const res = await adminCreateCategory(token, payload)
        setCategories((prev) => sortCategoriesById([...prev, res.category]))
      }
      setEditingId(null)
      setSlugTouched(false)
      setForm(emptyForm())
      push({ type: 'success', title: 'Categoría guardada' })
    } catch (e) {
      push({ type: 'error', title: 'No se pudo guardar', message: e instanceof Error ? e.message : undefined })
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Categorías</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 lg:col-span-2">
          <div className="text-sm font-semibold">Listado</div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Padre</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-semibold">#{c.id}</td>
                    <td className="px-4 py-3">{c.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{c.slug}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {c.parent_id ? byId.get(c.parent_id)?.name ?? `#${c.parent_id}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          className="text-xs font-semibold text-brand-700 hover:underline"
                          onClick={() => {
                            setEditingId(c.id)
                            setSlugTouched(true)
                            setForm({ name: c.name, slug: c.slug, parent_id: c.parent_id ?? null })
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="text-xs font-semibold text-rose-600 hover:underline"
                          onClick={async () => {
                            if (!token) return
                            if (!confirm(`Eliminar categoría #${c.id}?`)) return
                            try {
                              await adminDeleteCategory(token, c.id)
                              setCategories((prev) => prev.filter((x) => x.id !== c.id))
                              if (editingId === c.id) {
                                setEditingId(null)
                                setSlugTouched(false)
                                setForm(emptyForm())
                              }
                              push({ type: 'success', title: 'Categoría eliminada' })
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
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-600">
                      No hay categorías.
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
              <label className="text-xs font-semibold text-slate-600">Nombre</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value
                  setForm((p) => ({ ...p, name, slug: slugTouched ? p.slug : slugify(name) }))
                }}
                placeholder="CCTV"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Slug</label>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  setForm((p) => ({ ...p, slug: e.target.value }))
                }}
                placeholder="cctv"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Categoría padre (opcional)</label>
              <select
                className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
                value={form.parent_id ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, parent_id: e.target.value ? Number(e.target.value) : null }))}
              >
                <option value="">Sin padre</option>
                {categories
                  .filter((c) => c.id !== editingId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>

            <button
              className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              disabled={!form.name.trim() || !form.slug.trim()}
              onClick={submit}
            >
              Guardar
            </button>
            {editingId ? (
              <button
                className="w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  setEditingId(null)
                  setSlugTouched(false)
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
