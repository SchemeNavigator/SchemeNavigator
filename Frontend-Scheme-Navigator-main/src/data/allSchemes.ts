import { Scheme, SchemeCategory } from '../types';
import { SCHEMES_DATABASE } from './schemes';
import { ADDITIONAL_SCHEMES } from './moreSchemes';
import IMPORTED_SCHEMES from './importedSchemes.json';

export const ALL_SCHEMES: Scheme[] =
  Array.isArray(IMPORTED_SCHEMES) && IMPORTED_SCHEMES.length > 0
    ? (IMPORTED_SCHEMES as unknown as Scheme[])
    : [...SCHEMES_DATABASE, ...ADDITIONAL_SCHEMES];

export function getSchemeById(id: string): Scheme | undefined {
  return ALL_SCHEMES.find((s) => s.id === id || s.slug === id);
}

export function getSchemeBySlug(slug: string): Scheme | undefined {
  return ALL_SCHEMES.find((s) => s.slug === slug || s.id === slug);
}

export function getSchemesByCategory(category: SchemeCategory): Scheme[] {
  return ALL_SCHEMES.filter((s) => s.category === category);
}

export function getRelatedSchemes(currentSchemeId: string, limit = 3): Scheme[] {
  const current = getSchemeById(currentSchemeId);
  if (!current) return ALL_SCHEMES.slice(0, limit);

  return ALL_SCHEMES
    .filter((s) => s.id !== currentSchemeId && (s.category === current.category || s.level === current.level))
    .slice(0, limit);
}

export function searchSchemes(query: string, category?: string, state?: string): Scheme[] {
  const q = query.trim().toLowerCase();
  return ALL_SCHEMES.filter((scheme) => {
    const matchesQuery =
      !q ||
      scheme.name.toLowerCase().includes(q) ||
      scheme.tagline.toLowerCase().includes(q) ||
      scheme.shortDescription.toLowerCase().includes(q) ||
      scheme.verification.ministryOrAuthority.toLowerCase().includes(q) ||
      scheme.tags.some((t) => t.toLowerCase().includes(q));

    const matchesCategory = !category || category === 'All' || scheme.category === category;

    const matchesState =
      !state ||
      state === 'All' ||
      state === 'All India' ||
      scheme.coveredStates.includes('All India') ||
      scheme.coveredStates.includes(state);

    return matchesQuery && matchesCategory && matchesState;
  });
}
