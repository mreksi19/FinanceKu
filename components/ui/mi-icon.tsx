// Generic Material Icons wrapper for user-selectable icons (income sources, allocation pockets).
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';

type MIName = ComponentProps<typeof MaterialIcons>['name'];

// Curated set of icons users can pick from when creating an income source or allocation pocket.
export const ICON_CHOICES: MIName[] = [
  'payments',
  'account-balance',
  'account-balance-wallet',
  'savings',
  'work',
  'home',
  'restaurant',
  'directions-car',
  'shopping-cart',
  'local-hospital',
  'school',
  'flight',
  'sports-esports',
  'pets',
  'card-giftcard',
  'fitness-center',
  'receipt-long',
  'credit-card',
];

export function MiIcon({
  name,
  size = 22,
  color = '#0F1B2D',
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  return <MaterialIcons name={(name as MIName) || 'payments'} size={size} color={color} />;
}
