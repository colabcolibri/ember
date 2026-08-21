import type { AppSidebarNavGroup } from '@/components/app/AppSidebarNav.js';

type BuildMemberSidebarNavOptions = {
  t: (key: string) => string;
  profileComplete: boolean | null;
  isFacilitator: boolean;
  isOrgAdmin: boolean;
};

export function buildMemberSidebarNav({
  t,
  profileComplete,
  isFacilitator,
  isOrgAdmin,
}: BuildMemberSidebarNavOptions): {
  groups: AppSidebarNavGroup[];
  footerGroups: AppSidebarNavGroup[];
} {
  const groups: AppSidebarNavGroup[] = [];

  if (profileComplete !== false) {
    groups.push({
      id: 'participation',
      label: t('sidebar.groupParticipation'),
      items: [
        { to: '/presence', label: t('nav.presence') },
        { to: '/circles', label: t('nav.circles') },
      ],
    });
  }

  if (profileComplete !== false && (isFacilitator || isOrgAdmin)) {
    groups.push({
      id: 'facilitation',
      label: t('sidebar.groupFacilitation'),
      items: [
        { to: '/facilitator/gatherings', label: t('nav.gatherings') },
        { to: '/facilitator', label: t('nav.facilitator'), end: true },
      ],
    });
  }

  if (profileComplete !== false && isOrgAdmin) {
    groups.push({
      id: 'organization',
      label: t('sidebar.groupOrganization'),
      items: [
        { to: '/admin/community', label: t('nav.adminCommunity') },
        { to: '/admin/members', label: t('nav.adminMembers') },
      ],
    });
  }

  const footerGroups: AppSidebarNavGroup[] = [
    {
      id: 'account',
      label: t('sidebar.groupAccount'),
      items: [{ to: '/profile', label: t('nav.profile') }],
    },
  ];

  return { groups, footerGroups };
}

export function buildCatalogSidebarNav(t: (key: string) => string): AppSidebarNavGroup[] {
  return [
    {
      id: 'design',
      label: t('sidebar.groupDesign'),
      items: [
        { to: '/design', label: 'Overview' },
        { to: '/design/tokens', label: 'Tokens' },
        { to: '/design/components', label: 'Components' },
        { to: '/design/patterns', label: 'Patterns' },
      ],
    },
  ];
}
