import { Tabs } from 'expo-router';
import { View } from 'react-native';
import {
  CalendarDays,
  Heart,
  Home,
  Search,
  UserRound,
} from '@/components/icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { clientTabBarStyle, mobileTabLabelStyle, tabBarBottomInset } from '@/components/mobile';
import { useTheme } from '@/theme';

export default function ClientTabsLayout() {
  const { t } = useTranslation();
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      safeAreaInsets={{ bottom: tabBarBottomInset(insets.bottom) }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: clientTabBarStyle(colors, insets.bottom),
        tabBarLabelStyle: {
          ...mobileTabLabelStyle,
          fontFamily: typography.caption.fontFamily,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                backgroundColor: focused ? colors.primaryMuted : 'transparent',
                borderRadius: 12,
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
            >
              <Home color={color} size={size - 2} strokeWidth={focused ? 2.2 : 1.75} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({ color, size, focused }) => (
            <Search color={color} size={size - 2} strokeWidth={focused ? 2.2 : 1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: t('tabs.my_appointments'),
          tabBarIcon: ({ color, size, focused }) => (
            <CalendarDays color={color} size={size - 2} strokeWidth={focused ? 2.2 : 1.75} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: t('tabs.favorites'),
          tabBarIcon: ({ color, size, focused }) => (
            <Heart color={color} size={size - 2} strokeWidth={focused ? 2.2 : 1.75} />
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
