import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { listBrands } from '@/entities/brand/api'
import type { Brand } from '@/entities/brand/types'
import { listCategories } from '@/entities/category/api'
import type { Category } from '@/entities/category/types'
import type { ProductImage } from '@/entities/product/types'
import { useAuth } from '@/features/auth/AuthContext'
import type { AdminProduct } from '@/features/admin/adminApi'
import {
  adminCreateProduct,
  adminDeleteProduct,
  adminDeleteProductImage,
  adminGetProduct,
  adminListProducts,
  adminReorderProductImages,
  adminSetPrimaryProductImage,
  adminUpdateProduct,
  adminUploadProductImage,
} from '@/features/admin/adminApi'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'
import { Pagination } from '@/shared/components/Pagination'
import { useToast } from '@/shared/components/ToastProvider'

type ProductForm = {
  codigo: string
  name: string
  description?: string | null
  category_id: number
  brand_id: number
  price: number
  stock_quantity: number
  status: 'active' | 'inactive'
}

function defaultForm(categories: Category[], brands: Brand[]): ProductForm {
  return {
    codigo: '',
    name: '',
    description: '',
    category_id: categories[0]?.id ?? 1,
    brand_id: brands[0]?.id ?? 1,
    price: 0,
    stock_quantity: 0,
    status: 'active',
  }
}

function toForm(product: AdminProduct, categories: Category[], brands: Brand[]): ProductForm {
  return {
    codigo: product.codigo,
    name: product.name,
    description: product.description ?? '',
    category_id: product.category?.id ?? categories[0]?.id ?? 1,
    brand_id: product.brand?.id ?? brands[0]?.id ?? 1,
    price: Number(product.price),
    stock_quantity: product.stock_quantity,
    status: (product.status as 'active' | 'inactive') ?? 'active',
  }
}

export function ProductsAdminPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const { push } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1') || 1
  const q = searchParams.get('q') ?? ''
  const categoryId = Number(searchParams.get('category_id') ?? '0') || 0
  const brandId = Number(searchParams.get('brand_id') ?? '0') || 0
  const status = searchParams.get('status') ?? ''

  const [products, setProducts] = useState<AdminProduct[]>([])
  const [meta, setMeta] = useState<{ current_page: number; last_page: number } | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [isLoadingLookups, setIsLoadingLookups] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ProductForm>(() => defaultForm([], []))

  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null)
  const [imagesLoading, setImagesLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const sortedImages = useMemo<ProductImage[]>(
    () => (selectedProduct?.images ?? []).slice().sort((a, b) => a.order - b.order),
    [selectedProduct],
  )

  useEffect(() => {
    if (!token) {
      navigate('/admin/login')
      return
    }

    let cancelled = false
    setIsLoadingLookups(true)

    void (async () => {
      try {
        const [c, b] = await Promise.all([listCategories(), listBrands()])
        if (cancelled) return
        setCategories(c.data)
        setBrands(b.data)
        setForm((prev) => (editingId ? prev : defaultForm(c.data, b.data)))
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando catálogos.')
      } finally {
        if (!cancelled) setIsLoadingLookups(false)
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, navigate])

  useEffect(() => {
    if (!token) return

    let cancelled = false
    setIsLoadingProducts(true)
    setError(null)

    void (async () => {
      try {
        const p = await adminListProducts(token, {
          page,
          q: q.trim() || undefined,
          category_id: categoryId || undefined,
          brand_id: brandId || undefined,
          status: status || undefined,
          sort_by: 'id',
          sort_dir: 'asc',
        })
        if (cancelled) return
        setProducts(p.data)
        if (p.meta) setMeta({ current_page: p.meta.current_page, last_page: p.meta.last_page })
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando productos.')
      } finally {
        if (!cancelled) setIsLoadingProducts(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, page, q, categoryId, brandId, status])

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams)
    if (!value) next.delete(key)
    else next.set(key, value)
    next.delete('page')
    setSearchParams(next)
  }

  async function refreshSelected(productId: number) {
    if (!token) return
    setImagesLoading(true)
    try {
      const res = await adminGetProduct(token, productId)
      setSelectedProduct(res.product)
      setProducts((prev) => prev.map((p) => (p.id === productId ? res.product : p)))
    } catch (e) {
      push({ type: 'error', title: 'No se pudo cargar', message: e instanceof Error ? e.message : undefined })
    } finally {
      setImagesLoading(false)
    }
  }

  function resetForm() {
    setEditingId(null)
    setSelectedProduct(null)
    setImageFile(null)
    setForm(defaultForm(categories, brands))
  }

  const isLoading = isLoadingProducts || isLoadingLookups

  if (isLoading) return <Loading />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Productos</h1>

      <div className="rounded-2xl border bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Búsqueda (nombre o código)</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
              defaultValue={q}
              placeholder="Cámara / SKU-001"
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                const value = (e.target as HTMLInputElement).value.trim()
                setParam('q', value || null)
              }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Categoría</label>
            <select
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
              value={categoryId || ''}
              onChange={(e) => setParam('category_id', e.target.value ? String(e.target.value) : null)}
            >
              <option value="">Todas</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Marca</label>
            <select
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
              value={brandId || ''}
              onChange={(e) => setParam('brand_id', e.target.value ? String(e.target.value) : null)}
            >
              <option value="">Todas</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Estado</label>
            <select
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
              value={status}
              onChange={(e) => setParam('status', e.target.value || null)}
            >
              <option value="">Todos</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
          <div className="md:col-span-4">
            <button
              className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => setSearchParams(new URLSearchParams())}
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 lg:col-span-2">
          <div className="text-sm font-semibold">Listado</div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Imagen</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const img = p.images?.[0]?.url ?? null
                  return (
                    <tr key={p.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3 font-semibold">#{p.id}</td>
                      <td className="px-4 py-3">
                        {img ? (
                          <img
                            src={img}
                            alt={p.name}
                            loading="lazy"
                            decoding="async"
                            className="h-8 w-8 rounded-lg border bg-white object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-lg border bg-slate-50" aria-hidden="true" />
                        )}
                      </td>
                      <td className="px-4 py-3">{p.codigo}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-xs text-slate-600">{p.status}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold">S/ {p.price}</td>
                    <td className="px-4 py-3">{p.stock_quantity}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          className="text-xs font-semibold text-brand-700 hover:underline"
                          onClick={() => {
                            setEditingId(p.id)
                            setForm(toForm(p, categories, brands))
                            void refreshSelected(p.id)
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="text-xs font-semibold text-rose-600 hover:underline"
                          onClick={async () => {
                            if (!token) return
                            if (!confirm(`Eliminar producto #${p.id}?`)) return
                            try {
                              await adminDeleteProduct(token, p.id)
                              setProducts((prev) => prev.filter((x) => x.id !== p.id))
                              if (editingId === p.id) resetForm()
                              push({ type: 'success', title: 'Producto eliminado' })
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
                  )
                })}
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-600">
                      No hay productos.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-white p-6">
            <div className="text-sm font-semibold">{editingId ? `Editar #${editingId}` : 'Crear nuevo'}</div>
            <form
              className="mt-4 space-y-3"
              onSubmit={async (e) => {
                e.preventDefault()
                if (!token) return
                try {
                  if (editingId) {
                    const res = await adminUpdateProduct(token, editingId, form)
                    setProducts((prev) => prev.map((p) => (p.id === editingId ? res.product : p)))
                    setSelectedProduct(res.product)
                    push({ type: 'success', title: 'Producto actualizado' })
                  } else {
                    const res = await adminCreateProduct(token, form)
                    setProducts((prev) => [res.product, ...prev])
                    setEditingId(res.product.id)
                    setSelectedProduct(res.product)
                    push({ type: 'success', title: 'Producto creado' })
                  }
                } catch (err) {
                  push({ type: 'error', title: 'No se pudo guardar', message: err instanceof Error ? err.message : undefined })
                }
              }}
            >
              <div>
                <label className="text-xs font-semibold text-slate-600">Código</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                  value={form.codigo}
                  onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Nombre</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Descripción</label>
                <textarea
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                  rows={4}
                  value={form.description ?? ''}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Categoría</label>
                  <select
                    className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
                    value={form.category_id}
                    onChange={(e) => setForm((p) => ({ ...p, category_id: Number(e.target.value) }))}
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Marca</label>
                  <select
                    className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
                    value={form.brand_id}
                    onChange={(e) => setForm((p) => ({ ...p, brand_id: Number(e.target.value) }))}
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Precio</label>
                  <input
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Stock</label>
                  <input
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                    type="number"
                    min={0}
                    value={form.stock_quantity}
                    onChange={(e) => setForm((p) => ({ ...p, stock_quantity: Number(e.target.value) }))}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Estado</label>
                <select
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as 'active' | 'inactive' }))}
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
              </div>

              <button className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700">
                Guardar
              </button>
              {editingId ? (
                <button
                  type="button"
                  className="w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={resetForm}
                >
                  Cancelar
                </button>
              ) : null}
            </form>
          </div>

          <div className="rounded-2xl border bg-white p-6">
            <div className="text-sm font-semibold">Imágenes</div>
            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Archivo</label>
                <input
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <button
                className="w-full rounded-xl border bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-950 disabled:opacity-60"
                disabled={!token || !selectedProduct?.id || !imageFile}
                onClick={async () => {
                  if (!token || !selectedProduct?.id || !imageFile) return
                  try {
                    await adminUploadProductImage(token, selectedProduct.id, imageFile)
                    setImageFile(null)
                    await refreshSelected(selectedProduct.id)
                    push({ type: 'success', title: 'Imagen subida' })
                  } catch (e) {
                    push({ type: 'error', title: 'No se pudo subir', message: e instanceof Error ? e.message : undefined })
                  }
                }}
              >
                Subir
              </button>

              {!selectedProduct ? (
                <div className="rounded-xl border bg-slate-50 p-3 text-xs text-slate-600">
                  Selecciona un producto con “Editar” para gestionar sus imágenes.
                </div>
              ) : null}

              {selectedProduct ? (
                <div className="space-y-2">
                  {imagesLoading ? <div className="text-xs text-slate-600">Cargando…</div> : null}
                  <div className="grid grid-cols-3 gap-2">
                    {sortedImages.map((img, idx) => (
                      <div key={img.id} className="rounded-xl border bg-white p-2">
                        <div className="aspect-square overflow-hidden rounded-lg bg-slate-100">
                          {img.url ? <img src={img.url} alt="" className="h-full w-full object-cover" /> : null}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <button
                            className="rounded-md border px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            disabled={idx === 0 || !token}
                            onClick={async () => {
                              if (!token || !selectedProduct?.id) return
                              const ids = sortedImages.map((x) => x.id)
                              const next = ids.slice()
                              ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
                              try {
                                const res = await adminReorderProductImages(token, selectedProduct.id, next)
                                setSelectedProduct((p) => (p ? { ...p, images: res.images } : p))
                                setProducts((prev) =>
                                  prev.map((p) => (p.id === selectedProduct.id ? { ...p, images: res.images } : p)),
                                )
                              } catch (e) {
                                push({ type: 'error', title: 'No se pudo reordenar', message: e instanceof Error ? e.message : undefined })
                              }
                            }}
                          >
                            ↑
                          </button>
                          <button
                            className="rounded-md border px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            disabled={idx === sortedImages.length - 1 || !token}
                            onClick={async () => {
                              if (!token || !selectedProduct?.id) return
                              const ids = sortedImages.map((x) => x.id)
                              const next = ids.slice()
                              ;[next[idx + 1], next[idx]] = [next[idx], next[idx + 1]]
                              try {
                                const res = await adminReorderProductImages(token, selectedProduct.id, next)
                                setSelectedProduct((p) => (p ? { ...p, images: res.images } : p))
                                setProducts((prev) =>
                                  prev.map((p) => (p.id === selectedProduct.id ? { ...p, images: res.images } : p)),
                                )
                              } catch (e) {
                                push({ type: 'error', title: 'No se pudo reordenar', message: e instanceof Error ? e.message : undefined })
                              }
                            }}
                          >
                            ↓
                          </button>
                          <button
                            className="rounded-md border px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            disabled={!token}
                            onClick={async () => {
                              if (!token || !selectedProduct?.id) return
                              try {
                                await adminSetPrimaryProductImage(token, img.id)
                                await refreshSelected(selectedProduct.id)
                              } catch (e) {
                                push({ type: 'error', title: 'No se pudo marcar principal', message: e instanceof Error ? e.message : undefined })
                              }
                            }}
                          >
                            Principal
                          </button>
                          <button
                            className="rounded-md border px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
                            disabled={!token}
                            onClick={async () => {
                              if (!token || !selectedProduct?.id) return
                              if (!confirm('Eliminar imagen?')) return
                              try {
                                await adminDeleteProductImage(token, img.id)
                                await refreshSelected(selectedProduct.id)
                                push({ type: 'success', title: 'Imagen eliminada' })
                              } catch (e) {
                                push({ type: 'error', title: 'No se pudo eliminar', message: e instanceof Error ? e.message : undefined })
                              }
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {sortedImages.length === 0 ? <div className="text-xs text-slate-600">Sin imágenes.</div> : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {meta ? (
        <Pagination
          currentPage={meta.current_page}
          lastPage={meta.last_page}
          onPageChange={(nextPage) => {
            const next = new URLSearchParams(searchParams)
            next.set('page', String(nextPage))
            setSearchParams(next)
          }}
        />
      ) : null}
    </div>
  )
}
