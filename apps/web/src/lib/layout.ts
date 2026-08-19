/** Layout tokens alinhados a docs/09_design_system.md e docs/stitch/DESIGN.md */
export const LAYOUT = {
  /** Largura máxima do conteúdo — fluxos de membro e auth */
  memberMax: 'max-w-member',
  /** Largura máxima — painel do facilitador */
  facilitatorMax: 'max-w-facilitator',
  /** Nav pill — membro e auth */
  navMemberMax: 'max-w-nav',
  /** Nav pill — facilitador e catálogo */
  navWideMax: 'max-w-nav-wide',
  /** Padding horizontal de página */
  pageX: 'px-page-x',
} as const;

export type AppShellVariant = 'auth' | 'app' | 'facilitator' | 'catalog';

export function contentMaxWidth(variant: AppShellVariant): string {
  switch (variant) {
    case 'facilitator':
    case 'catalog':
      return LAYOUT.facilitatorMax;
    case 'auth':
    case 'app':
    default:
      return LAYOUT.memberMax;
  }
}

export function navMaxWidth(variant: AppShellVariant): string {
  switch (variant) {
    case 'facilitator':
    case 'catalog':
      return LAYOUT.navWideMax;
    case 'auth':
      return 'max-w-fit';
    case 'app':
    default:
      return LAYOUT.navMemberMax;
  }
}
