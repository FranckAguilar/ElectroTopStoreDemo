import { Link } from 'react-router-dom'
import { useCart } from '@/features/cart/CartContext'
import { ErrorMessage } from '@/shared/components/ErrorMessage'
import { Loading } from '@/shared/components/Loading'

export function CartPage() {
  const { cart, isLoading, setQuantity, remove } = useCart()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Carrito</h1>
        <Link
          to="/checkout"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Ir a pagar
        </Link>
      </div>
      {isLoading ? <Loading /> : null}
      {!isLoading && !cart ? <ErrorMessage message="No se pudo cargar el carrito." /> : null}

      {cart ? (
        <div className="space-y-3">
          <div className="rounded-2xl border bg-white p-4">
            <div className="text-sm text-slate-600">
              Total: <span className="font-semibold text-slate-900">S/ {cart.total_amount}</span>
            </div>
          </div>

          {cart.items.length === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">
              Tu carrito está vacío.
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.id} className="rounded-2xl border bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {item.product?.name ?? `Producto #${item.product?.id ?? item.id}`}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">Unit: S/ {item.unit_price}</div>
                  </div>
                  <button
                    className="text-xs font-semibold text-rose-600 hover:underline"
                    onClick={() => remove(item.id)}
                  >
                    Quitar
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <button
                    className="h-9 w-9 rounded-lg border text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => setQuantity(item.id, Math.max(0, item.quantity - 1))}
                  >
                    -
                  </button>
                  <div className="min-w-12 text-center text-sm font-semibold">{item.quantity}</div>
                  <button
                    className="h-9 w-9 rounded-lg border text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    onClick={() => setQuantity(item.id, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
