import { clientLogos } from '@/data/company';

export function ClientLogos() {
  return (
    <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {clientLogos.map((src, i) => (
        <div
          key={src}
          className="flex h-24 items-center justify-center rounded-xl border border-charcoal-100 bg-white p-4 shadow-sm"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`Client logo ${i + 1}`}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}
