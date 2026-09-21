import { useMemo, useRef, useState } from 'react';
import {
  Image,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';

import { TASHKENT_REGION } from './mapUtils';
import { satelliteTileUrl, shortClinicTitle, streetTileUrl } from './mapTiles';
import { useTheme } from '@/theme';
import type { Clinic } from '@/types';

const TILE = 256;
const MIN_ZOOM = 11;
const MAX_ZOOM = 16;

function lonToX(lon: number, zoom: number) {
  return ((lon + 180) / 360) * 2 ** zoom * TILE;
}

function latToY(lat: number, zoom: number) {
  const sin = Math.sin((lat * Math.PI) / 180);
  return (
    (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * 2 ** zoom * TILE
  );
}

function xToLon(x: number, zoom: number) {
  return (x / (TILE * 2 ** zoom)) * 360 - 180;
}

function yToLat(y: number, zoom: number) {
  const n = Math.PI - (2 * Math.PI * y) / (TILE * 2 ** zoom);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

type Props = {
  clinics: Clinic[];
  satellite?: boolean;
  onSelectClinic?: (id: string) => void;
  onPressMap?: () => void;
  /** Hide built-in zoom (parent may render its own). */
  hideZoom?: boolean;
};

/**
 * Compact tile map for Home — same basemap + marker language as fullscreen DentalMap.
 */
export function OsmTileMap({
  clinics,
  satellite,
  onSelectClinic,
  onPressMap,
  hideZoom,
}: Props) {
  const { colors } = useTheme();
  const [size, setSize] = useState({ width: 0, height: 260 });
  const [center, setCenter] = useState({
    lat: TASHKENT_REGION.latitude,
    lon: TASHKENT_REGION.longitude,
  });
  const [zoom, setZoom] = useState(13);
  const moved = useRef(false);

  const centerRef = useRef(center);
  const zoomRef = useRef(zoom);
  centerRef.current = center;
  zoomRef.current = zoom;
  const dragStart = useRef({ lat: 0, lon: 0 });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
        onPanResponderGrant: () => {
          moved.current = false;
          dragStart.current = {
            lat: centerRef.current.lat,
            lon: centerRef.current.lon,
          };
        },
        onPanResponderMove: (_, g) => {
          if (Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3) moved.current = true;
          const z = zoomRef.current;
          const worldX = lonToX(dragStart.current.lon, z);
          const worldY = latToY(dragStart.current.lat, z);
          setCenter({
            lat: yToLat(worldY - g.dy, z),
            lon: xToLon(worldX - g.dx, z),
          });
        },
        onPanResponderRelease: () => {
          if (!moved.current) onPressMap?.();
        },
      }),
    [onPressMap],
  );

  const { tiles, markers } = useMemo(() => {
    const { width, height } = size;
    const z = Math.round(zoom);
    if (width < 8 || height < 8) {
      return {
        tiles: [] as { key: string; left: number; top: number; uri: string }[],
        markers: [] as {
          id: string;
          left: number;
          top: number;
          name: string;
          open: boolean;
        }[],
      };
    }

    const worldX = lonToX(center.lon, z);
    const worldY = latToY(center.lat, z);
    const originX = worldX - width / 2;
    const originY = worldY - height / 2;
    const minTx = Math.floor(originX / TILE) - 1;
    const maxTx = Math.floor((originX + width) / TILE) + 1;
    const minTy = Math.floor(originY / TILE) - 1;
    const maxTy = Math.floor((originY + height) / TILE) + 1;

    const nextTiles = [];
    for (let x = minTx; x <= maxTx; x++) {
      for (let y = minTy; y <= maxTy; y++) {
        if (x < 0 || y < 0 || x >= 2 ** z || y >= 2 ** z) continue;
        nextTiles.push({
          key: `${z}-${x}-${y}`,
          left: x * TILE - originX,
          top: y * TILE - originY,
          uri: satellite ? satelliteTileUrl(z, x, y) : streetTileUrl(z, x, y),
        });
      }
    }

    const nextMarkers = clinics.slice(0, 12).map((clinic) => ({
      id: clinic.id,
      left: lonToX(clinic.coordinates.longitude, z) - originX,
      top: latToY(clinic.coordinates.latitude, z) - originY,
      name: clinic.name,
      open: !!clinic.isOpenNow,
    }));

    return { tiles: nextTiles, markers: nextMarkers };
  }, [center.lat, center.lon, clinics, satellite, size, zoom]);

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (
          Math.abs(width - size.width) > 1 ||
          Math.abs(height - size.height) > 1
        ) {
          setSize({ width, height });
        }
      }}
      {...panResponder.panHandlers}
    >
      {tiles.map((tile) => (
        <Image
          key={tile.key}
          source={{ uri: tile.uri }}
          style={{
            position: 'absolute',
            left: tile.left,
            top: tile.top,
            width: TILE,
            height: TILE,
          }}
        />
      ))}

      {markers.map((m) => {
        const fill = m.open ? colors.secondary : colors.primary;
        const label = shortClinicTitle(m.name, 14);
        const approxW = Math.min(132, Math.max(56, label.length * 6.2 + 14));
        return (
          <Pressable
            key={m.id}
            accessibilityRole="button"
            accessibilityLabel={m.name}
            onPress={() => {
              void Haptics.selectionAsync();
              onSelectClinic?.(m.id);
            }}
            hitSlop={6}
            style={[
              styles.label,
              {
                left: m.left - approxW / 2,
                top: m.top - 14,
                minWidth: approxW,
                backgroundColor: fill,
              },
            ]}
          >
            <RNText
              numberOfLines={1}
              style={{
                color: '#FFFFFF',
                fontSize: 10,
                lineHeight: 12,
                fontWeight: '700',
                includeFontPadding: false,
                fontFamily:
                  Platform.OS === 'android' ? 'sans-serif-medium' : undefined,
              }}
            >
              {label}
            </RNText>
          </Pressable>
        );
      })}

      {!hideZoom ? (
        <View style={styles.zoomCol} pointerEvents="box-none">
          <Pressable
            onPress={() => setZoom((z) => Math.min(MAX_ZOOM, z + 1))}
            style={styles.zoomBtn}
          >
            <View style={[styles.zoomBarH, { backgroundColor: colors.text }]} />
            <View style={[styles.zoomBarV, { backgroundColor: colors.text }]} />
          </Pressable>
          <Pressable
            onPress={() => setZoom((z) => Math.max(MIN_ZOOM, z - 1))}
            style={styles.zoomBtn}
          >
            <View style={[styles.zoomBarH, { backgroundColor: colors.text }]} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#DCE6F0',
  },
  label: {
    position: 'absolute',
    height: 24,
    maxWidth: 132,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#0F172A',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  zoomCol: {
    position: 'absolute',
    right: 10,
    bottom: 56,
    gap: 8,
    zIndex: 3,
  },
  zoomBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  zoomBarH: {
    position: 'absolute',
    width: 12,
    height: 2,
    borderRadius: 1,
  },
  zoomBarV: {
    position: 'absolute',
    width: 2,
    height: 12,
    borderRadius: 1,
  },
});
