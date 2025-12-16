import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import type { Role } from '@/entities/role/types'
import type { User } from '@/entities/user/types'
import { useAuth } from '@/features/auth/AuthContext'
import { adminDeleteUser, adminGetUser, adminListRoles, adminListUsers, adminUpdateUser } from '@/features/admin/adminApi'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'
import { Pagination } from '@/shared/components/Pagination'
import { useToast } from '@/shared/components/ToastProvider'

type EditForm = { name: string; phone: string; role_id: number }

export function UsersAdminPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const { push } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page') ?? '1') || 1
  const q = searchParams.get('q') ?? ''
  const roleId = Number(searchParams.get('role_id') ?? '0') || 0

  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [meta, setMeta] = useState<{ current_page: number; last_page: number } | null>(null)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isLoadingRoles, setIsLoadingRoles] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [selected, setSelected] = useState<User | null>(null)
  const [form, setForm] = useState<EditForm | null>(null)
  const [saving, setSaving] = useState(false)

  const rolesById = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles])

  useEffect(() => {
    if (!token) {
      navigate('/admin/login')
      return
    }

    let cancelled = false
    setIsLoadingRoles(true)

    void (async () => {
      try {
        const r = await adminListRoles(token)
        if (cancelled) return
        setRoles(r.data)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando roles.')
      } finally {
        if (!cancelled) setIsLoadingRoles(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, navigate])

  useEffect(() => {
    if (!token) return

    let cancelled = false
    setIsLoadingUsers(true)
    setError(null)

    void (async () => {
      try {
        const u = await adminListUsers(token, { page, q: q.trim() || undefined, role_id: roleId || undefined })
        if (cancelled) return
        setUsers(u.data)
        if (u.meta) setMeta({ current_page: u.meta.current_page, last_page: u.meta.last_page })
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando usuarios.')
      } finally {
        if (!cancelled) setIsLoadingUsers(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, page, q, roleId])

  useEffect(() => {
    if (!token) return
    if (!selectedId) {
      setSelected(null)
      setForm(null)
      return
    }

    let cancelled = false
    void (async () => {
      try {
        const res = await adminGetUser(token, selectedId)
        if (cancelled) return
        setSelected(res.user)
        setForm({
          name: res.user.name,
          phone: res.user.phone ?? '',
          role_id: res.user.role?.id ?? roles[0]?.id ?? 1,
        })
      } catch {
        // ignore
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, selectedId, roles])

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams)
    if (!value) next.delete(key)
    else next.set(key, value)
    next.delete('page')
    setSearchParams(next)
  }

  const isLoading = isLoadingUsers || isLoadingRoles
  if (isLoading) return <Loading />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Usuarios</h1>
          <p className="mt-1 text-sm text-slate-600">Cambia roles y datos básicos.</p>
        </div>
        <Link to="/admin/panel" className="rounded-lg border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Volver
        </Link>
      </div>

      <div className="rounded-2xl border bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className="text-xs font-semibold text-slate-600">Rol</label>
            <select
              className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
              value={roleId || ''}
              onChange={(e) => setParam('role_id', e.target.value ? String(e.target.value) : null)}
            >
              <option value="">Todos</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Búsqueda (nombre o email)</label>
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
              defaultValue={q}
              placeholder="admin@... / Juan"
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                const value = (e.target as HTMLInputElement).value.trim()
                setParam('q', value || null)
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white lg:col-span-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-semibold">#{u.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="text-xs text-slate-600">{u.phone ?? ''}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700">{u.email}</td>
                    <td className="px-4 py-3 text-xs text-slate-700">{u.role?.name ?? '\u2014'}</td>
                    <td className="px-4 py-3">
                      <button
                        className="text-xs font-semibold text-brand-700 hover:underline"
                        onClick={() => setSelectedId(u.id)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-600">
                      No hay usuarios.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <div className="text-sm font-semibold">Editar usuario</div>
          {!selected || !form ? (
            <div className="mt-3 rounded-xl border bg-slate-50 p-3 text-xs text-slate-600">
              Selecciona un usuario para editar.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="text-xs text-slate-600">
                <span className="font-semibold">#{selected.id}</span> \u2014 {selected.email}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Nombre</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                  value={form.name}
                  onChange={(e) => setForm((p) => (p ? { ...p, name: e.target.value } : p))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Teléfono</label>
                <input
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-brand-600"
                  value={form.phone}
                  onChange={(e) => setForm((p) => (p ? { ...p, phone: e.target.value } : p))}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Rol</label>
                <select
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:border-brand-600"
                  value={form.role_id}
                  onChange={(e) => setForm((p) => (p ? { ...p, role_id: Number(e.target.value) } : p))}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                disabled={saving || !token || !form.name.trim()}
                onClick={async () => {
                  if (!token || !selected) return
                  setSaving(true)
                  try {
                    const payload = { name: form.name.trim(), phone: form.phone.trim() || null, role_id: form.role_id }
                    const res = await adminUpdateUser(token, selected.id, payload)
                    setSelected(res.user)
                    setUsers((prev) => prev.map((u) => (u.id === selected.id ? res.user : u)))
                    push({ type: 'success', title: 'Usuario actualizado' })
                  } catch (e) {
                    push({ type: 'error', title: 'No se pudo actualizar', message: e instanceof Error ? e.message : undefined })
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                Guardar
              </button>
              <button
                className="w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                disabled={saving || !token}
                onClick={async () => {
                  if (!token || !selected) return
                  if (!confirm(`Eliminar usuario #${selected.id}?`)) return
                  setSaving(true)
                  try {
                    await adminDeleteUser(token, selected.id)
                    setUsers((prev) => prev.filter((u) => u.id !== selected.id))
                    setSelected(null)
                    setForm(null)
                    setSelectedId(null)
                    push({ type: 'success', title: 'Usuario eliminado' })
                  } catch (e) {
                    push({ type: 'error', title: 'No se pudo eliminar', message: e instanceof Error ? e.message : undefined })
                  } finally {
                    setSaving(false)
                  }
                }}
              >
                Eliminar
              </button>
              <button
                className="w-full rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                disabled={saving}
                onClick={() => {
                  setSelected(null)
                  setForm(null)
                  setSelectedId(null)
                }}
              >
                Cerrar
              </button>

              <div className="rounded-xl border bg-slate-50 p-3 text-xs text-slate-600">
                Roles disponibles: {roles.map((r) => rolesById.get(r.id)?.name).join(', ')}
              </div>
            </div>
          )}
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
