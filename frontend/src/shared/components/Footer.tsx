import { useSettings } from '@/features/settings/SettingsContext'

export function Footer() {
  const { get } = useSettings()
  const phone = get('store.phone', '')
  const email = get('store.email', '')

  return (
    <footer className="border-t bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-slate-600">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>© {new Date().getFullYear()} ElectroTopStore</div>
          <div className="flex flex-wrap items-center gap-3">
            {phone ? <div>{phone}</div> : null}
            {email ? <div>{email}</div> : null}
          </div>
        </div>
      </div>
    </footer>
  )
}

