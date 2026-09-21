import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ClientTabBar } from '@/components/client/ClientTabBar';

export default function ClientTabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <ClientTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.home') }} />
      <Tabs.Screen name="search" options={{ title: t('tabs.search') }} />
      <Tabs.Screen name="appointments" options={{ title: t('tabs.my_appointments') }} />
      <Tabs.Screen name="favorites" options={{ title: t('tabs.favorites') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
