import { Link } from 'react-router-dom'

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-white px-6 py-14 sm:px-10 sm:py-16">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <svg
          className="absolute -left-24 top-0 h-[520px] w-[520px] text-slate-200"
          viewBox="0 0 520 520"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="260" cy="260" r="110" stroke="currentColor" strokeWidth="1" />
          <circle cx="260" cy="260" r="190" stroke="currentColor" strokeWidth="1" />
          <circle cx="260" cy="260" r="270" stroke="currentColor" strokeWidth="1" />
        </svg>
        <svg
          className="absolute -bottom-40 right-[-140px] h-[560px] w-[560px] text-slate-100"
          viewBox="0 0 560 560"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="280" cy="280" r="120" stroke="currentColor" strokeWidth="1" />
          <circle cx="280" cy="280" r="210" stroke="currentColor" strokeWidth="1" />
          <circle cx="280" cy="280" r="300" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>

      <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
          {`La mejor tecnolog\u00eda al`}
          <br />
          <span className="text-slate-900">mejor precio</span>, <span className="text-slate-500">al alcance de</span>
          <br />
          <span className="text-slate-900">un clic.</span>
        </h1>
        <p className="mt-5 text-sm text-slate-600 sm:text-base">
          {`Descubre tel\u00e9fonos, c\u00e1maras, aud\u00edfonos y gadgets con ofertas exclusivas para ti.`}
          <br />
          {`Compra f\u00e1cil, r\u00e1pido y seguro.`}
        </p>

        <Link
          to="/productos"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-slate-900 px-7 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          Comprar ahora <span aria-hidden="true">{'\u2192'}</span>
        </Link>
      </div>
    </section>
  )
}
