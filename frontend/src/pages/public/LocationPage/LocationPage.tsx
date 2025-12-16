import { useSettings } from '@/features/settings/SettingsContext'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'

export function LocationPage() {
  const { isLoading, error, get } = useSettings()
  const address = get('store.address', '')
  const mapsUrl = get('store.maps_url', '')
  const mapsEmbedUrl = get('store.maps_embed_url', '')
  const effectiveEmbed = mapsEmbedUrl || (address ? `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed` : '')

  if (isLoading) return <Loading />
  if (error) return <ErrorMessage message={error} />

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Ubicación</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-6 lg:col-span-2">
          <div className="text-sm font-semibold">Mapa</div>
          {effectiveEmbed ? (
            <div className="mt-4 overflow-hidden rounded-xl border bg-slate-50">
              <iframe
                title="Mapa"
                src={effectiveEmbed}
                className="h-[360px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          ) : (
            <div className="mt-4 rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
              {mapsUrl ? (
                <a href={mapsUrl} target="_blank" rel="noreferrer" className="font-semibold text-brand-700 hover:underline">
                  Abrir en Google Maps
                </a>
              ) : (
                'Configura store.maps_embed_url o store.maps_url en Settings.'
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-6">
          <div className="text-sm font-semibold">Dirección</div>
          <div className="mt-2 text-sm text-slate-700">{address || 'Configura store.address en Settings.'}</div>
          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex rounded-lg border px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Ver en Maps
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )
}
