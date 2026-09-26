import 'server-only';
import { siteConfig } from './config';
import { bundledMedia, defaultCollections, defaultSettings } from '../data/defaults';
export type * from './cms-types';
import type {
  Client,
  CmsMedia,
  GalleryPhoto,
  NewsPost,
  Project,
  Service,
  Settings,
  TeamMember,
  TitleDescription,
} from './cms-types';

/*
 * Typed fetchers for CMS content. Responses are cached and tagged so the API
 * can refresh them on publish (see app/api/revalidate); `revalidate` is the
 * safety net if a refresh ping is ever missed.
 */

const API_URL = process.env.API_INTERNAL_URL || siteConfig.apiUrl;
const REVALIDATE_SECONDS = 300;

/** Fetches CMS data; returns null (and logs) if the API cannot be reached. */
async function cmsFetch<T>(path: string, tag: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { tags: [tag], revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (error) {
    console.warn(`[cms] ${API_URL}${path} unavailable, showing default content: ${(error as Error).message}`);
    return null;
  }
}

export type SiteSettings = {
  values: Partial<Settings>;
  media: Record<string, CmsMedia>;
};

const fetchSettings = () => cmsFetch<SiteSettings>('/settings', 'settings');

/**
 * The original content is shown instead of CMS data when the API is down or
 * the database has not been seeded (no settings at all), so pages are never
 * blank. Once the CMS has content, its collections are used as-is — even if
 * staff empty one on purpose.
 */
async function collection<T>(path: string, tag: string, fallback: T[]): Promise<T[]> {
  const [rows, settings] = await Promise.all([cmsFetch<T[]>(path, tag), fetchSettings()]);
  const cmsReady = !!settings && Object.keys(settings.values).length > 0;
  return rows && cmsReady ? rows : fallback;
}

export const getServices = () => collection<Service>('/services', 'services', defaultCollections.services);
export const getProjects = () => collection<Project>('/projects', 'projects', defaultCollections.projects);
export const getGallery = () => collection<GalleryPhoto>('/gallery', 'gallery', defaultCollections.gallery);
export const getClients = () => collection<Client>('/clients', 'clients', defaultCollections.clients);
export const getTeam = () => collection<TeamMember>('/team', 'team', defaultCollections.team);
export const getCoreValues = () => collection<TitleDescription>('/values', 'values', defaultCollections.values);
export const getNews = () => collection<NewsPost>('/news', 'news', defaultCollections.news);
export const getWhyUs = () => collection<TitleDescription>('/why-us', 'why-us', defaultCollections.whyUs);

export async function getSettings() {
  const data = await fetchSettings();
  // Any setting not saved in the CMS yet falls back to the original content.
  const values: Settings = { ...defaultSettings, ...data?.values };
  return {
    ...values,
    /** Resolves a media id stored in a setting (or a bundled default file path). */
    media: (id?: string): CmsMedia | undefined =>
      !id ? undefined : id.startsWith('/') ? bundledMedia(id) : data?.media[id],
  };
}
