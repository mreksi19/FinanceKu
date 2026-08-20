// FinanceKu design tokens

export const Colors = {
  // base
  background: '#F5F6F8',
  card: '#FFFFFF',
  border: '#ECEFF3',
  borderLight: '#F2F4F7',

  // text
  text: '#0F1B2D',
  textSecondary: '#64748B',
  muted: '#94A3B8',
  placeholder: '#94A3B8',
  disabled: '#CBD5E1',

  // brand / hero card (dark navy)
  navyFrom: '#0B1220',
  navyTo: '#1B2A44',
  navyAccent: '#22D3EE',

  // accents
  tint: '#0F766E', // teal - primary brand accent (shield logo)
  green: '#10B981',
  greenBg: '#E7F8F1',
  orange: '#F59E0B',
  orangeBg: '#FFF4E0',
  blue: '#3B82F6',
  blueBg: '#EAF1FF',
  red: '#EF4444',
  redBg: '#FDECEC',
  purple: '#8B5CF6',
  purpleBg: '#F1EBFD',

  // semantic (kept for compatibility with older components)
  success: '#0F9D63',
  successBg: '#E7F8F1',
  danger: '#EF4444',
  warning: '#F59E0B',
  warningBg: '#FFF4E0',
  icon: '#64748B',
};

export const Shadows = {
  sm: {
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#0B1220',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
};

export const Radius = {
  sm: 10,
  md: 16,
  lg: 24,
  xl: 28,
};
