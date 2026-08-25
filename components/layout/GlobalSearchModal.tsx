import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
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
import {
  MOCK_APPOINTMENTS,
  MOCK_DOCTORS,
  MOCK_INVENTORY,
  MOCK_PATIENTS,
  MOCK_ROOMS,
} from '@/mocks/data';
import { useTheme } from '@/theme';

type SearchKind = 'patient' | 'doctor' | 'appointment' | 'room' | 'inventory' | 'service';

interface SearchHit {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  href: Href;
}

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function matches(query: string, ...parts: (string | undefined | null)[]) {
  const q = normalize(query);
  if (!q) return false;
  return parts.some((p) => p && normalize(p).includes(q));
}

function buildIndex(): SearchHit[] {
  const services = new Map<string, SearchHit>();
  for (const doctor of MOCK_DOCTORS) {
    for (const service of doctor.services) {
      if (services.has(service.id)) continue;
      services.set(service.id, {
        id: service.id,
        kind: 'service',
        title: service.name,
        subtitle: service.category,
        href: '/(clinic)/(shell)/services',
      });
    }
  }

  return [
    ...MOCK_PATIENTS.map((p) => ({
      id: p.id,
      kind: 'patient' as const,
      title: p.fullName,
      subtitle: p.phone,
      href: `/(clinic)/patient/${p.id}` as Href,
    })),
    ...MOCK_DOCTORS.map((d) => ({
      id: d.id,
      kind: 'doctor' as const,
      title: d.fullName,
      subtitle: d.specialization,
      href: `/(clinic)/doctor/${d.id}` as Href,
    })),
    ...MOCK_APPOINTMENTS.map((a) => ({
      id: a.id,
      kind: 'appointment' as const,
      title: `${a.patientName} · ${a.serviceName}`,
      subtitle: `${a.date} ${a.time} · ${a.doctorName}`,
      href: '/(clinic)/(shell)/appointments' as Href,
    })),
    ...MOCK_ROOMS.map((r) => ({
      id: r.id,
      kind: 'room' as const,
      title: r.name,
      subtitle: `#${r.number}${r.doctorName ? ` · ${r.doctorName}` : ''}`,
      href: '/(clinic)/(shell)/rooms' as Href,
    })),
    ...MOCK_INVENTORY.map((i) => ({
      id: i.id,
      kind: 'inventory' as const,
      title: i.name,
      subtitle: `${i.supplier} · ${i.quantity} ${i.unit}`,
      href: '/(clinic)/(shell)/inventory' as Href,
    })),
    ...services.values(),
  ];
}

const KIND_META: Record<SearchKind, { icon: LucideIcon; labelKey: string }> = {
  patient: { icon: Users, labelKey: 'crm.nav.patients' },
  doctor: { icon: Stethoscope, labelKey: 'crm.nav.doctors' },
  appointment: { icon: CalendarDays, labelKey: 'crm.nav.appointments' },
  room: { icon: DoorOpen, labelKey: 'crm.nav.rooms' },
  inventory: { icon: Package, labelKey: 'crm.nav.inventory' },
  service: { icon: Wrench, labelKey: 'crm.nav.services' },
};

const ALL_HITS = buildIndex();

interface GlobalSearchModalProps {
  visible: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ visible, onClose }: GlobalSearchModalProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius, shadows, iconSizes } = useTheme();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const results = useMemo(() => {
    const q = query.trim();
    if (q.length < 1) return [];
    return ALL_HITS.filter((hit) => matches(q, hit.title, hit.subtitle, hit.kind)).slice(0, 40);
  }, [query]);

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
            contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing['2xl'] }}
          >
            {query.trim().length === 0 ? (
              <Text variant="bodySmall" muted center>
                {t('crm.search.hint')}
              </Text>
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
