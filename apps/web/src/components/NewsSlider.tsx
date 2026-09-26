'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowIcon } from './Icons';
import { InlineText } from './RichText';

export type NewsSlide = {
  slug: string;
  title: string;
  dateLabel: string;
  highlight: string;
  image: { path: string; alt: string };
};

/**
 * Horizontally sliding "floating" cards for the latest news. Each card is a
 * photo with a highlight footer and links to the post on /news. Auto-advances
 * every `seconds` (paused on hover/focus/touch, and off for reduced motion).
 */
export function NewsSlider({ slides, seconds }: { slides: NewsSlide[]; seconds: number }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const cards = () => Array.from(track.current?.children ?? []) as HTMLElement[];

  const goTo = useCallback((index: number) => {
    const el = track.current;
    const items = Array.from(el?.children ?? []) as HTMLElement[];
    if (!el || !items.length) return;
    const i = (index + items.length) % items.length;
    el.scrollTo({ left: items[i].offsetLeft - items[0].offsetLeft, behavior: 'smooth' });
  }, []);

  // Track which card is nearest the left edge (for the dots).
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => {
      const items = cards();
      const left = el.scrollLeft + (items[0]?.offsetLeft ?? 0);
      let best = 0;
      items.forEach((c, i) => {
        if (Math.abs(c.offsetLeft - left) < Math.abs(items[best].offsetLeft - left)) best = i;
      });
      setActive(best);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-advance; wraps to the first card after the last one fits on screen.
  useEffect(() => {
    if (!seconds || paused || slides.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => {
      const el = track.current;
      if (!el || document.hidden) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      goTo(atEnd ? 0 : active + 1);
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [seconds, paused, active, slides.length, goTo]);

  const arrow =
    'hidden h-11 w-11 items-center justify-center rounded-full bg-white text-charcoal-900 shadow-lg ring-1 ring-charcoal-100 transition hover:bg-gold hover:text-on-gold md:flex';

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      aria-roledescription="carousel"
      aria-label="Latest news and activities"
    >
      <div
        ref={track}
        className="-mx-4 flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth px-4 pb-10 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((s, i) => (
          <Link
            key={s.slug}
            href={`/news#${s.slug}`}
            aria-label={`${s.title} — read on the News & Activities page`}
            aria-roledescription="slide"
            aria-posinset={i + 1}
            aria-setsize={slides.length}
            className="group w-[85%] shrink-0 snap-start overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-charcoal-100 transition duration-300 hover:-translate-y-2 hover:shadow-2xl sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={s.image.path}
                alt={s.image.alt}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 85vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute left-3 top-3 rounded-full bg-charcoal-900/80 px-3 py-1 text-xs font-bold text-gold backdrop-blur">
                {s.dateLabel}
              </span>
            </div>
            <div className="border-t-4 border-gold p-5">
              <h3 className="font-bold leading-snug text-charcoal-900">{s.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-charcoal-700">
                <InlineText text={s.highlight} links={false} />
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700">
                Read more
                <ArrowIcon className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>

      {slides.length > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button type="button" className={arrow} onClick={() => goTo(active - 1)} aria-label="Previous">
            <ArrowIcon className="h-5 w-5 rotate-180" />
          </button>
          <div className="flex gap-2">
            {slides.map((s, i) => (
              <button
                key={s.slug}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === active}
                className={`h-2.5 rounded-full transition-all ${i === active ? 'w-8 bg-gold' : 'w-2.5 bg-charcoal-100 hover:bg-gold-300'}`}
              />
            ))}
          </div>
          <button type="button" className={arrow} onClick={() => goTo(active + 1)} aria-label="Next">
            <ArrowIcon className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}
