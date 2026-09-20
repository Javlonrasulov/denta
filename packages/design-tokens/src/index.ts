/** Shared design tokens for DENTA.UZ products (Clinic Web primary consumer). */

export const colors = {
  primary: '#4338CA',
  primaryMuted: '#EEF2FF',
  primaryPressed: '#3730A3',
  secondary: '#0891B2',
  secondaryMuted: '#ECFEFF',
  success: '#16A34A',
  successMuted: '#F0FDF4',
  warning: '#F59E0B',
  warningMuted: '#FFFBEB',
  error: '#EF4444',
  errorMuted: '#FEF2F2',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSoft: '#F1F5F9',
  sidebar: '#1E1B4B',
  sidebarBorder: 'rgba(255,255,255,0.08)',
  sidebarText: '#FFFFFF',
  sidebarTextMuted: '#A5B4FC',
  sidebarItem: '#EEF2FF',
  sidebarActiveBg: 'rgba(8, 145, 178, 0.22)',
  sidebarActiveAccent: '#22D3EE',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
} as const;

export const layout = {
  sidebarWidth: 252,
  sidebarCollapsedWidth: 80,
  headerHeight: 64,
  contentMaxWidth: 1280,
} as const;
