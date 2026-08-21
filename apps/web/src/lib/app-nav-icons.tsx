import type { LucideIcon } from 'lucide-react';
import {
  CalendarCheck,
  CalendarDays,
  CircleUser,
  LayoutDashboard,
  LogIn,
  Palette,
  Shapes,
  Sparkles,
  SwatchBook,
  UserRound,
  Users,
  UsersRound,
} from 'lucide-react';

export function resolveNavIcon(path: string): LucideIcon {
  if (path === '/presence' || path.startsWith('/presence/')) return CalendarCheck;
  if (path === '/circles' || path.startsWith('/circles/')) return Users;
  if (path === '/profile') return UserRound;
  if (path.startsWith('/facilitator/gatherings')) return CalendarDays;
  if (path === '/facilitator') return Sparkles;
  if (path === '/admin/community') return Palette;
  if (path === '/admin/members') return UsersRound;
  if (path === '/design') return LayoutDashboard;
  if (path === '/design/tokens') return SwatchBook;
  if (path === '/design/components') return Shapes;
  if (path === '/design/patterns') return CircleUser;
  if (path.includes('login')) return LogIn;
  return LayoutDashboard;
}
