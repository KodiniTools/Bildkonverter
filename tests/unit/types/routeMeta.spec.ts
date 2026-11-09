/** Typvertrag für route.meta (src/types/router.d.ts) und eigene Umgebungsvariablen. */
import { describe, expectTypeOf, it } from 'vitest';
import type { RouteMeta } from 'vue-router';
import router from '@/router';

describe('RouteMeta', () => {
  it('kennt die SEO-Felder der Routen', () => {
    expectTypeOf<RouteMeta['title']>().toEqualTypeOf<string | undefined>();
    expectTypeOf<RouteMeta['noIndex']>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<NonNullable<RouteMeta['en']>['description']>().toEqualTypeOf<string | undefined>();
  });

  it('alle Routen mit Meta passen zum Typ', () => {
    for (const route of router.getRoutes()) {
      expectTypeOf(route.meta).toMatchTypeOf<RouteMeta>();
    }
  });
});

describe('ImportMetaEnv', () => {
  it('eigene Variablen sind optionale Strings', () => {
    expectTypeOf(import.meta.env.VITE_API_BASE_URL).toEqualTypeOf<string | undefined>();
    expectTypeOf(import.meta.env.VITE_APP_VERSION).toEqualTypeOf<string | undefined>();
  });
});
