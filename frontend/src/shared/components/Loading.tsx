export function Loading({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-sm text-slate-600">
      {label}
    </div>
  )
}

