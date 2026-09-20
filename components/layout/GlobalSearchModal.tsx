import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from 'react-native';
import { Href, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  CalendarDays,
  DoorOpen,
  Package,
  Stethoscope,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from '@/components/icons';

import { SearchInput } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { apiGet, useMockApi } from '@/services/apiClient';
import { useTheme } from '@/theme';

type SearchKind = 'patient' | 'doctor' | 'appointment' | 'room' | 'inventory' | 'service';

interface SearchHit {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  href: Href;
}

type ApiSearchResult = {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
};

const KIND_META: Record<SearchKind, { icon: LucideIcon; labelKey: string }> = {
  patient: { icon: Users, labelKey: 'crm.nav.patients' },
  doctor: { icon: Stethoscope, labelKey: 'crm.nav.doctors' },
  appointment: { icon: CalendarDays, labelKey: 'crm.nav.appointments' },
  room: { icon: DoorOpen, labelKey: 'crm.nav.rooms' },
  inventory: { icon: Package, labelKey: 'crm.nav.inventory' },
  service: { icon: Wrench, labelKey: 'crm.nav.services' },
};

function mapApiHit(item: ApiSearchResult): SearchHit | null {
  const type = item.type.toLowerCase();
  if (type === 'patient') {
    return {
      id: item.id,
      kind: 'patient',
      title: item.title,
      subtitle: item.subtitle ?? '',
      href: `/(clinic)/patient/${item.id}`,
    };
  }
  if (type === 'doctor') {
    return {
      id: item.id,
      kind: 'doctor',
      title: item.title,
      subtitle: item.subtitle ?? '',
      href: `/(clinic)/doctor/${item.id}`,
    };
  }
  if (type === 'appointment') {
    return {
      id: item.id,
      kind: 'appointment',
      title: item.title,
      subtitle: item.subtitle ?? '',
      href: '/(clinic)/(shell)/appointments',
    };
  }
  if (type === 'service') {
    return {
      id: item.id,
      kind: 'service',
      title: item.title,
      subtitle: item.subtitle ?? '',
      href: '/(clinic)/(shell)/services',
    };
  }
  if (type === 'room') {
    return {
      id: item.id,
      kind: 'room',
      title: item.title,
      subtitle: item.subtitle ?? '',
      href: '/(clinic)/(shell)/rooms',
    };
  }
  if (type === 'inventory') {
    return {
      id: item.id,
      kind: 'inventory',
      title: item.title,
      subtitle: item.subtitle ?? '',
      href: '/(clinic)/(shell)/inventory',
    };
  }
  return null;
}

interface GlobalSearchModalProps {
  visible: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ visible, onClose }: GlobalSearchModalProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows, iconSizes } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
      setLoading(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      void (async () => {
        if (useMockApi()) {
          if (!cancelled) {
            setResults([]);
            setLoading(false);
          }
          return;
        }
        try {
          const data = await apiGet<{ results?: ApiSearchResult[] }>('/search', {
            q,
            limit: 20,
          });
          if (cancelled) return;
          const hits = (data.results ?? [])
            .map(mapApiHit)
            .filter((hit): hit is SearchHit => hit != null);
          setResults(hits);
        } catch {
          if (!cancelled) setResults([]);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, visible]);

  const grouped = useMemo(() => {
    const map = new Map<SearchKind, SearchHit[]>();
    for (const hit of results) {
      const list = map.get(hit.kind) ?? [];
      list.push(hit);
      map.set(hit.kind, list);
    }
    return [...map.entries()];
  }, [results]);

  const openHit = (hit: SearchHit) => {
    onClose();
    router.push(hit.href);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: colors.overlay,
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingTop: 72,
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xl,
        }}
      >
        <Pressable
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          onPress={onClose}
        />
        <View
          style={{
            width: '100%',
            maxWidth: 560,
            maxHeight: '85%',
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: colors.borderSubtle,
            overflow: 'hidden',
            ...shadows.lg,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              padding: spacing.lg,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderSubtle,
            }}
          >
            <View style={{ flex: 1 }}>
              <SearchInput
                value={query}
                onChangeText={setQuery}
                onClear={() => setQuery('')}
                placeholder={t('crm.search.placeholder')}
              />
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              style={{
                width: 40,
                height: 40,
                borderRadius: radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surfaceSoft,
              }}
            >
              <X size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              padding: spacing.lg,
              gap: spacing.lg,
              paddingBottom: spacing['2xl'],
            }}
          >
            {query.trim().length < 2 ? (
              <Text variant="bodySmall" muted center>
                {t('crm.search.hint')}
              </Text>
            ) : loading ? (
              <ActivityIndicator color={colors.primary} />
            ) : results.length === 0 ? (
              <Text variant="bodySmall" muted center>
                {t('search.no_results')}
              </Text>
            ) : (
              grouped.map(([kind, hits]) => {
                const meta = KIND_META[kind];
                const Icon = meta.icon;
                return (
                  <View key={kind} style={{ gap: spacing.sm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <Icon size={14} color={colors.textMuted} />
                      <Text variant="caption" muted>
                        {t(meta.labelKey)} · {hits.length}
                      </Text>
                    </View>
                    {hits.map((hit) => (
                      <Pressable
                        key={`${hit.kind}-${hit.id}`}
                        onPress={() => openHit(hit)}
                        style={({ pressed }) => ({
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.md,
                          padding: spacing.md,
                          borderRadius: radius.lg,
                          backgroundColor: pressed ? colors.primaryMuted : colors.surfaceSoft,
                          borderWidth: 1,
                          borderColor: colors.borderSubtle,
                        })}
                      >
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: radius.md,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: colors.surface,
                          }}
                        >
                          <Icon size={iconSizes.sm} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text variant="label" numberOfLines={1}>
                            {hit.title}
                          </Text>
                          <Text variant="caption" muted numberOfLines={1}>
                            {hit.subtitle}
                          </Text>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
