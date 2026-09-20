/**
 * Individual Lucide imports — avoids Metro EMFILE from the barrel export.
 */
export { default as AlertCircle } from 'lucide-react-native/icons/circle-alert';
export { default as AlertTriangle } from 'lucide-react-native/icons/triangle-alert';
export { default as ArrowLeft } from 'lucide-react-native/icons/arrow-left';
export { default as BarChart3 } from 'lucide-react-native/icons/chart-no-axes-column';
export { default as Bell } from 'lucide-react-native/icons/bell';
export { default as Boxes } from 'lucide-react-native/icons/boxes';
export { default as Building2 } from 'lucide-react-native/icons/building-2';
export { default as Camera } from 'lucide-react-native/icons/camera';
export { default as Calendar } from 'lucide-react-native/icons/calendar';
export { default as CalendarClock } from 'lucide-react-native/icons/calendar-clock';
export { default as CalendarDays } from 'lucide-react-native/icons/calendar-days';
export { default as CalendarPlus } from 'lucide-react-native/icons/calendar-plus';
export { default as Check } from 'lucide-react-native/icons/check';
export { default as CheckCircle2 } from 'lucide-react-native/icons/circle-check';
export { default as ChevronDown } from 'lucide-react-native/icons/chevron-down';
export { default as ChevronRight } from 'lucide-react-native/icons/chevron-right';
export { default as CircleHelp } from 'lucide-react-native/icons/circle-question-mark';
export { default as Clock } from 'lucide-react-native/icons/clock';
export { default as Coins } from 'lucide-react-native/icons/coins';
export { default as Download } from 'lucide-react-native/icons/download';
export { default as DoorOpen } from 'lucide-react-native/icons/door-open';
export { default as Eye } from 'lucide-react-native/icons/eye';
export { default as EyeOff } from 'lucide-react-native/icons/eye-off';
export { default as Globe } from 'lucide-react-native/icons/globe';
export { default as Heart } from 'lucide-react-native/icons/heart';
export { default as Home } from 'lucide-react-native/icons/house';
export { default as LayoutDashboard } from 'lucide-react-native/icons/layout-dashboard';
export { default as Lock } from 'lucide-react-native/icons/lock';
export { default as LogOut } from 'lucide-react-native/icons/log-out';
export { default as Map } from 'lucide-react-native/icons/map';
export { default as MapPin } from 'lucide-react-native/icons/map-pin';
export { default as LocateFixed } from 'lucide-react-native/icons/locate-fixed';
export { default as Share2 } from 'lucide-react-native/icons/share-2';
export { default as BadgeCheck } from 'lucide-react-native/icons/badge-check';
export { default as Banknote } from 'lucide-react-native/icons/banknote';
export { default as CreditCard } from 'lucide-react-native/icons/credit-card';
export { default as Fingerprint } from 'lucide-react-native/icons/fingerprint-pattern';
export { default as Filter } from 'lucide-react-native/icons/list-filter';
export { default as ImageIcon } from 'lucide-react-native/icons/image';
export { default as KeyRound } from 'lucide-react-native/icons/key-round';
export { default as Languages } from 'lucide-react-native/icons/languages';
export { default as Mail } from 'lucide-react-native/icons/mail';
export { default as Maximize2 } from 'lucide-react-native/icons/maximize-2';
export { default as Menu } from 'lucide-react-native/icons/menu';
export { default as Monitor } from 'lucide-react-native/icons/monitor';
export { default as Moon } from 'lucide-react-native/icons/moon';
export { default as RefreshCw } from 'lucide-react-native/icons/refresh-cw';
export { default as Navigation } from 'lucide-react-native/icons/navigation';
export { default as Package } from 'lucide-react-native/icons/package';
export { default as PanelLeftClose } from 'lucide-react-native/icons/panel-left-close';
export { default as PanelLeftOpen } from 'lucide-react-native/icons/panel-left-open';
export { default as Percent } from 'lucide-react-native/icons/percent';
export { default as Pencil } from 'lucide-react-native/icons/pencil';
export { default as Phone } from 'lucide-react-native/icons/phone';
export { default as Play } from 'lucide-react-native/icons/play';
export { default as Plus } from 'lucide-react-native/icons/plus';
export { default as Receipt } from 'lucide-react-native/icons/receipt';
export { default as ScanFace } from 'lucide-react-native/icons/scan-face';
export { default as Search } from 'lucide-react-native/icons/search';
export { default as Settings } from 'lucide-react-native/icons/settings';
export { default as Shield } from 'lucide-react-native/icons/shield';
export { default as Smartphone } from 'lucide-react-native/icons/smartphone';
export { default as SlidersHorizontal } from 'lucide-react-native/icons/sliders-horizontal';
export { default as Star } from 'lucide-react-native/icons/star';
export { default as Stethoscope } from 'lucide-react-native/icons/stethoscope';
export { default as Sun } from 'lucide-react-native/icons/sun';
export { default as TrendingDown } from 'lucide-react-native/icons/trending-down';
export { default as Trash2 } from 'lucide-react-native/icons/trash-2';
export { default as TrendingUp } from 'lucide-react-native/icons/trending-up';
export { default as UserPlus } from 'lucide-react-native/icons/user-plus';
export { default as UserRound } from 'lucide-react-native/icons/user-round';
export { default as Users } from 'lucide-react-native/icons/users';
export { default as Wallet } from 'lucide-react-native/icons/wallet';
export { default as Wrench } from 'lucide-react-native/icons/wrench';
export { default as X } from 'lucide-react-native/icons/x';

import type { ComponentType } from 'react';
import type { SvgProps } from 'react-native-svg';

export type LucideIcon = ComponentType<
  SvgProps & {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  }
>;
