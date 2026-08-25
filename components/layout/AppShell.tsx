import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContentMax } from './ContentMax';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { useTheme } from '@/theme';

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AppShell({ title, subtitle, children }: AppShellProps) {
  const { colors, spacing, layout, isDesktop, isDark, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const pad = isDesktop ? layout.contentPadding : layout.contentPaddingMobile;

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background }}>
      {isDesktop ? <Sidebar /> : null}

      <View style={{ flex: 1 }}>
        <View style={{ paddingTop: isDesktop ? 0 : insets.top, backgroundColor: isDark ? colors.surfaceElevated : colors.surface }}>
          <TopHeader
            title={title}
            subtitle={subtitle}
            showMenu={!isDesktop}
            onMenuPress={() => setDrawerOpen(true)}
          />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: pad,
            paddingBottom: insets.bottom + spacing['4xl'],
          }}
          showsVerticalScrollIndicator={false}
        >
          <ContentMax>{children}</ContentMax>
        </ScrollView>
      </View>

      <Modal visible={drawerOpen} animationType="fade" transparent onRequestClose={() => setDrawerOpen(false)}>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <View style={{ ...shadows.lg }}>
            <View style={{ paddingTop: insets.top, height: '100%', backgroundColor: colors.sidebar }}>
              <Sidebar showClose onNavigate={() => setDrawerOpen(false)} />
            </View>
          </View>
          <Pressable style={{ flex: 1, backgroundColor: colors.overlay }} onPress={() => setDrawerOpen(false)} />
        </View>
      </Modal>
    </View>
  );
}
