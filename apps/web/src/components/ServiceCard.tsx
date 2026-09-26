import Link from 'next/link';
import type { Service } from '@/lib/cms';
import { serviceIcon, ArrowIcon } from './Icons';

export function ServiceCard({ service }: { service: Service }) {
  const Icon = serviceIcon(service.slug);
  return (
    <Link
      href={`/services#${service.slug}`}
      className="group flex flex-col rounded-xl border border-charcoal-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-gold-200 hover:shadow-lg"
    >
      <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-gold-50 text-gold-600 transition group-hover:bg-gold group-hover:text-charcoal-900">
        <Icon />
      </span>
      <h3 className="text-lg font-bold text-charcoal-900">{service.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-charcoal-700">
        {service.summary}
      </p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700">
        Learn more
        <ArrowIcon className="h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
