import { Tabs } from 'expo-router';
import {
  CalendarDays,
  LayoutDashboard,
  UserRound,
  Users,
  Wallet,
} from '@/components/icons';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';

export default function DoctorTabsLayout() {
  const { t } = useTranslation();
  const { colors, typography } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSubtle,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: {
          fontFamily: typography.caption.fontFamily,
          fontSize: 10,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.dashboard'),
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard color={color} size={size - 2} strokeWidth={1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('tabs.calendar'),
          tabBarIcon: ({ color, size }) => (
            <CalendarDays color={color} size={size - 2} strokeWidth={1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: t('tabs.patients'),
          tabBarIcon: ({ color, size }) => <Users color={color} size={size - 2} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: t('tabs.finance'),
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size - 2} strokeWidth={1.75} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <UserRound color={color} size={size - 2} strokeWidth={1.75} />
          ),
        }}
      />
    </Tabs>
  );
}
