import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Brand } from '@/entities/brand/types'
import { useAuth } from '@/features/auth/AuthContext'
import {
  adminCreateBrand,
  adminDeleteBrand,
  adminListBrands,
  adminUpdateBrand,
  adminUploadBrandLogo,
} from '@/features/admin/adminApi'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'
import { slugify } from '@/shared/utils/slug'
import { useToast } from '@/shared/components/ToastProvider'

type FormState = { name: string; slug: string }

function emptyForm(): FormState {
  return { name: '', slug: '' }
}

function sortBrandsById(list: Brand[]): Brand[] {
  return list.slice().sort((a, b) => a.id - b.id)
}

export function BrandsAdminPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const { push } = useToast()

  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoadingBrands, setIsLoadingBrands] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())

  const [logoBrandId, setLogoBrandId] = useState<number | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)

  useEffect(() => {
    if (!token) {
      navigate('/admin/login')
      return
    }

    let cancelled = false
    setIsLoadingBrands(true)
    setError(null)

    void (async () => {
      try {
        const result = await adminListBrands(token)
        if (!cancelled) setBrands(sortBrandsById(result.data))
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando marcas.')
      } finally {
        if (!cancelled) setIsLoadingBrands(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, navigate])

  if (isLoadingBrands) return <Loading />
  if (error) return <ErrorMessage message={error} />

  async function submit() {
    if (!token) return
    const payload = { name: form.name.trim(), slug: form.slug.trim() }
    if (!payload.name || !payload.slug) return

    try {
      if (editingId) {
        const res = await adminUpdateBrand(token, editingId, payload)
        setBrands((prev) => sortBrandsById(prev.map((b) => (b.id === editingId ? res.brand : b))))
      } else {
        const res = await adminCreateBrand(token, payload)
        setBrands((prev) => sortBrandsById([...prev, res.brand]))
      }
      setEditingId(null)
      setSlugTouched(false)
      setForm(emptyForm())
      push({ type: 'success', title: 'Marca guardada' })
    } catch (e) {
      push({ type: 'error', title: 'No se pudo guardar', message: e instanceof Error ? e.message : undefined })
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Marcas</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 lg:col-span-2">
          <div className="text-sm font-semibold">Listado</div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Logo</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((b) => (
                  <tr key={b.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-semibold">#{b.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex h-10 w-[120px] items-center justify-center overflow-hidden rounded-lg border bg-white px-2">
                        {b.logo_url ? (
                          <img
                            src={b.logo_url}
                            alt={b.name}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <div className="h-6 w-16 rounded bg-slate-100" aria-hidden="true" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{b.name}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{b.slug}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          className="text-xs font-semibold text-brand-700 hover:underline"
                          onClick={() => {
                            setEditingId(b.id)
                            setSlugTouched(true)
                            setForm({ name: b.name, slug: b.slug })
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="text-xs font-semibold text-brand-700 hover:underline"
                          onClick={() => {
                            setLogoBrandId(b.id)
                          }}
                        >
                          Logo
                        </button>
                        <button
                          className="text-xs font-semibold text-rose-600 hover:underline"
                          onClick={async () => {
                            if (!token) return
                            if (!confirm(`Eliminar marca #${b.id}?`)) return
                            try {
                              await adminDeleteBrand(token, b.id)
                              setBrands((prev) => prev.filter((x) => x.id !== b.id))
                              push({ type: 'success', title: 'Marca eliminada' })
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
                {brands.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-600">
                      No hay marcas.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
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
                  placeholder="Hikvision"
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
                  placeholder="hikvision"
                />
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

          <div className="rounded-2xl border bg-white p-6">
            <div className="text-sm font-semibold">Subir logo</div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Marca</label>
                <select
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
                  value={logoBrandId ?? ''}
                  onChange={(e) => setLogoBrandId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Selecciona</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      #{b.id} {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Archivo</label>
                <input
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <button
                className="w-full rounded-xl border bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-950 disabled:opacity-60"
                disabled={!token || !logoBrandId || !logoFile}
                onClick={async () => {
                  if (!token || !logoBrandId || !logoFile) return
                  try {
                    const res = await adminUploadBrandLogo(token, logoBrandId, logoFile)
                    setBrands((prev) => prev.map((b) => (b.id === logoBrandId ? res.brand : b)))
                    setLogoFile(null)
                    push({ type: 'success', title: 'Logo subido' })
                  } catch (e) {
                    push({ type: 'error', title: 'No se pudo subir', message: e instanceof Error ? e.message : undefined })
                  }
                }}
              >
                Subir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
