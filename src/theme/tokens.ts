import { colors } from './colors';

export const radius = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20,
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const typography = {
  title: { fontSize: 22, fontWeight: '900' as const, color: colors.text },
  h2: { fontSize: 16, fontWeight: '900' as const, color: colors.text },
  body: { fontSize: 14, fontWeight: '600' as const, color: colors.text },
  muted: { fontSize: 13, fontWeight: '600' as const, color: colors.muted },
  mono: { fontSize: 12, fontWeight: '700' as const, color: colors.muted, fontFamily: 'monospace' },
} as const;

