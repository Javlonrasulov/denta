import { Platform, Pressable, Text as RNText, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CalendarDays,
  Heart,
  Home,
  Search,
  UserRound,
} from '@/components/icons';
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
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = tabBarBottomInset(insets.bottom);

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: isDark ? colors.borderSubtle : 'rgba(15,23,42,0.07)',
          paddingBottom: bottomPad,
          ...Platform.select({
            ios: {
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
            },
            android: {
              elevation: 8,
            },
          }),
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
            accessibilityLabel={label.replace(/\n/g, ' ')}
            hitSlop={4}
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
            style={styles.item}
          >
            <View
              style={[
                styles.iconWrap,
                {
                  backgroundColor: focused ? colors.primaryMuted : 'transparent',
                },
              ]}
            >
              <Icon
                size={22}
                color={color}
                strokeWidth={focused ? 2.3 : 1.8}
                fill={focused && route.name === 'favorites' ? color : 'transparent'}
              />
            </View>
            <RNText
              allowFontScaling={false}
              numberOfLines={2}
              // System UI font — custom fonts clip / inflate Cyrillic on Android
              style={[
                styles.label,
                {
                  color,
                  fontWeight: focused ? '700' : '500',
                },
              ]}
            >
              {label}
            </RNText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  item: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 2,
  },
  iconWrap: {
    width: 44,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    width: '100%',
    minHeight: 26,
    textAlign: 'center',
    textAlignVertical: 'top',
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: -0.2,
    includeFontPadding: false,
    ...(Platform.OS === 'android' ? { fontFamily: 'sans-serif-medium' } : {}),
  },
});
