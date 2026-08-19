import { cn } from '@/lib/utils';

/**
 * Cinco larguras padrão do produto Ember.
 * Nav e conteúdo compartilham o MESMO max-w (um único container no shell).
 *
 * sm  — 480px  (reservado)
 * md  — 640px  (reservado)
 * lg  — 768px  (reservado)
 * xl  — 960px  padrão de TODAS as telas
 * 2xl — 1200px (reservado)
 */
export const EMBER_WIDTH = {
  sm: 'max-w-ember-sm',
  md: 'max-w-ember-md',
  lg: 'max-w-ember-lg',
  xl: 'max-w-ember-xl',
  '2xl': 'max-w-ember-2xl',
} as const;

export type EmberWidth = keyof typeof EMBER_WIDTH;

export const DEFAULT_EMBER_WIDTH: EmberWidth = 'xl';

export function emberWidthClass(width: EmberWidth = DEFAULT_EMBER_WIDTH): string {
  return EMBER_WIDTH[width];
}

/** Padding horizontal de página — único token */
export const EMBER_PAGE_X = 'px-page-x';

export function shellContainerClass(width: EmberWidth = DEFAULT_EMBER_WIDTH, className?: string) {
  return cn('mx-auto w-full', EMBER_PAGE_X, emberWidthClass(width), className);
}
