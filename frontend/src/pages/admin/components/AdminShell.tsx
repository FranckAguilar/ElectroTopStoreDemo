import { Outlet } from 'react-router-dom'
import { AdminSidebar } from '@/pages/admin/components/AdminSidebar'
import { AdminTopbar } from '@/pages/admin/components/AdminTopbar'

export function AdminShell() {
  return (
    <div className="flex min-h-dvh flex-col">
      <AdminTopbar />
      <div className="flex flex-1 items-stretch">
        <AdminSidebar />
        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

