import type { Client } from '@/lib/cms';
import { renditionUrl } from '@/lib/media';

export function ClientLogos({ clients }: { clients: Client[] }) {
  const withLogos = clients.filter((c) => c.logo);
  return (
    <div className="mx-auto mt-10 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {withLogos.map((client) => {
        const logo = (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={renditionUrl(client.logo!)}
            alt={client.logo!.alt || client.name}
            className="max-h-full max-w-full object-contain"
            loading="lazy"
          />
        );
        return (
          <div
            key={client.id}
            className="flex h-24 items-center justify-center rounded-xl border border-charcoal-100 bg-white p-4 shadow-sm"
          >
            {client.websiteUrl ? (
              <a
                href={client.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={client.name}
                className="flex h-full w-full items-center justify-center"
              >
                {logo}
              </a>
            ) : (
              logo
            )}
          </div>
        );
      })}
    </div>
  );
}
