import { View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CalendarDays,
  Heart,
  Home,
  Search,
  UserRound,
} from '@/components/icons';
import { Text } from '@/components/ui/Text';
import { tabBarBottomInset } from '@/components/mobile';
import { useTheme } from '@/theme';

const ICONS = {
  index: Home,
  search: Search,
  appointments: CalendarDays,
  favorites: Heart,
  profile: UserRound,
} as const;

type TabBarProps = {
  state: {
    index: number;
    routes: { key: string; name: string; params?: object }[];
  };
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: {
    emit: (event: {
      type: string;
      target: string;
      canPreventDefault: boolean;
    }) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
};

export function ClientTabBar({ state, descriptors, navigation }: TabBarProps) {
  const { colors, shadows, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottom = tabBarBottomInset(insets.bottom);

  return (
    <View
      style={[
        shadows.md,
        {
          flexDirection: 'row',
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: isDark ? colors.borderSubtle : 'rgba(15,23,42,0.06)',
          paddingTop: 8,
          paddingBottom: bottom,
          paddingHorizontal: 6,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const label = String(options.title ?? route.name);
        const Icon = ICONS[route.name as keyof typeof ICONS] ?? Home;
        const color = focused ? colors.primary : colors.tabInactive;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            }}
            style={{
              flex: 1,
              alignItems: 'center',
              gap: 4,
              paddingVertical: 2,
            }}
          >
            <View
              style={{
                width: 42,
                height: 32,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? colors.primaryMuted : 'transparent',
              }}
            >
              <Icon size={20} color={color} strokeWidth={focused ? 2.25 : 1.75} />
            </View>
            <Text
              variant="caption"
              weight={focused ? 'semibold' : 'medium'}
              color={color}
              numberOfLines={1}
              style={{ fontSize: 10, lineHeight: 12, letterSpacing: -0.2 }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
