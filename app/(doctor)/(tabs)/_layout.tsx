import { Tabs } from 'expo-router';
import {
  CalendarDays,
  LayoutDashboard,
  UserRound,
  Users,
  Wallet,
} from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { mobileTabBarStyle, mobileTabLabelStyle } from '@/components/mobile';
import { useTheme } from '@/theme';

export default function DoctorTabsLayout() {
  const { t } = useTranslation();
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: mobileTabBarStyle(colors, insets.bottom),
        tabBarLabelStyle: {
          ...mobileTabLabelStyle,
          fontFamily: typography.caption.fontFamily,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.dashboard'),
          tabBarIcon: ({ color, size, focused }) => (
            <LayoutDashboard color={color} size={size - 2} strokeWidth={focused ? 2.2 : 1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('tabs.calendar'),
          tabBarIcon: ({ color, size, focused }) => (
            <CalendarDays color={color} size={size - 2} strokeWidth={focused ? 2.2 : 1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: t('tabs.patients'),
          tabBarIcon: ({ color, size, focused }) => (
            <Users color={color} size={size - 2} strokeWidth={focused ? 2.2 : 1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: t('tabs.finance'),
          tabBarIcon: ({ color, size, focused }) => (
            <Wallet color={color} size={size - 2} strokeWidth={focused ? 2.2 : 1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size, focused }) => (
            <UserRound color={color} size={size - 2} strokeWidth={focused ? 2.2 : 1.75} />
          ),
        }}
      />
    </Tabs>
  );
}
