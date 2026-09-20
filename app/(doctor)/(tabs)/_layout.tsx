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

import { doctorTabBarStyle, doctorTabLabelStyle } from '@/components/mobile';
import { useTheme } from '@/theme';

export default function DoctorTabsLayout() {
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: doctorTabBarStyle(colors, insets.bottom, isDark),
        tabBarLabelStyle: doctorTabLabelStyle,
        tabBarAllowFontScaling: false,
        tabBarItemStyle: { paddingHorizontal: 0 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('doctor_app.tab_home'),
          tabBarIcon: ({ color, size, focused }) => (
            <LayoutDashboard color={color} size={size - 2} strokeWidth={focused ? 2.2 : 1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('doctor_app.tab_calendar'),
          tabBarIcon: ({ color, size, focused }) => (
            <CalendarDays color={color} size={size - 2} strokeWidth={focused ? 2.2 : 1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: t('doctor_app.tab_patients'),
          tabBarIcon: ({ color, size, focused }) => (
            <Users color={color} size={size - 2} strokeWidth={focused ? 2.2 : 1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: t('doctor_app.tab_finance'),
          tabBarIcon: ({ color, size, focused }) => (
            <Wallet color={color} size={size - 2} strokeWidth={focused ? 2.2 : 1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('doctor_app.tab_profile'),
          tabBarIcon: ({ color, size, focused }) => (
            <UserRound color={color} size={size - 2} strokeWidth={focused ? 2.2 : 1.75} />
          ),
        }}
      />
    </Tabs>
  );
}
