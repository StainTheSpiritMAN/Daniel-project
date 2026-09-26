/** Section title block. Colours follow the surrounding section's tone. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div
      className={`${center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}`}
    >
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="text-3xl font-extrabold leading-tight text-t-strong md:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base leading-relaxed text-t-body">{subtitle}</p>
      )}
    </div>
  );
}
