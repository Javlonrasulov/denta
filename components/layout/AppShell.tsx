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
  const { colors, spacing, layout, isDesktop, isDark, shadows, windowWidth } = useTheme();
  const insets = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const pad = isDesktop ? layout.contentPadding : layout.contentPaddingMobile;
  const drawerWidth = Math.min(layout.sidebarWidth, Math.max(260, windowWidth * 0.86));

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.background, minWidth: 0 }}>
      {isDesktop ? (
        <View style={{ flexShrink: 0, height: '100%', zIndex: 40 }}>
          <Sidebar />
        </View>
      ) : null}

      <View style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <View
          style={{
            paddingTop: isDesktop ? 0 : insets.top,
            backgroundColor: isDark ? colors.surfaceElevated : colors.surface,
            zIndex: 30,
          }}
        >
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
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
        >
          <ContentMax>{children}</ContentMax>
        </ScrollView>
      </View>

      {!isDesktop ? (
        <Modal
          visible={drawerOpen}
          animationType="fade"
          transparent
          onRequestClose={() => setDrawerOpen(false)}
        >
          <View style={{ flex: 1, flexDirection: 'row' }}>
            <View
              style={{
                width: drawerWidth,
                ...shadows.lg,
                paddingTop: insets.top,
                height: '100%',
                backgroundColor: colors.sidebar,
              }}
            >
              <Sidebar forceExpanded showClose onNavigate={() => setDrawerOpen(false)} />
            </View>
            <Pressable
              style={{ flex: 1, backgroundColor: colors.overlay }}
              onPress={() => setDrawerOpen(false)}
            />
          </View>
        </Modal>
      ) : null}
    </View>
  );
}
