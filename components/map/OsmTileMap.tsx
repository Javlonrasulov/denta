import { useMemo, useRef, useState } from 'react';
import {
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Text } from '@/components/ui/Text';
import { TASHKENT_REGION } from './mapUtils';
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

function streetTile(z: number, x: number, y: number) {
  // Voyager is reliable on Android emulator (no Google Maps key needed).
  return `https://basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;
}

function satelliteTile(z: number, x: number, y: number) {
  return `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
}

function shortTitle(name: string, max = 16) {
  const cleaned = name.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1)}…`;
}

type Props = {
  clinics: Clinic[];
  satellite?: boolean;
  onSelectClinic?: (id: string) => void;
};

export function OsmTileMap({ clinics, satellite, onSelectClinic }: Props) {
  const { colors, shadows } = useTheme();
  const [size, setSize] = useState({ width: 0, height: 260 });
  const [center, setCenter] = useState({
    lat: TASHKENT_REGION.latitude,
    lon: TASHKENT_REGION.longitude,
  });
  const [zoom, setZoom] = useState(13);

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
          dragStart.current = {
            lat: centerRef.current.lat,
            lon: centerRef.current.lon,
          };
        },
        onPanResponderMove: (_, g) => {
          const z = zoomRef.current;
          const worldX = lonToX(dragStart.current.lon, z);
          const worldY = latToY(dragStart.current.lat, z);
          setCenter({
            lat: yToLat(worldY - g.dy, z),
            lon: xToLon(worldX - g.dx, z),
          });
        },
      }),
    [],
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
    const minTx = Math.floor(originX / TILE);
    const maxTx = Math.floor((originX + width) / TILE);
    const minTy = Math.floor(originY / TILE);
    const maxTy = Math.floor((originY + height) / TILE);

    const nextTiles = [];
    for (let x = minTx; x <= maxTx; x++) {
      for (let y = minTy; y <= maxTy; y++) {
        if (x < 0 || y < 0 || x >= 2 ** z || y >= 2 ** z) continue;
        nextTiles.push({
          key: `${z}-${x}-${y}`,
          left: x * TILE - originX,
          top: y * TILE - originY,
          uri: satellite ? satelliteTile(z, x, y) : streetTile(z, x, y),
        });
      }
    }

    const nextMarkers = clinics.slice(0, 20).map((clinic) => ({
      id: clinic.id,
      left: lonToX(clinic.coordinates.longitude, z) - originX,
      top: latToY(clinic.coordinates.latitude, z) - originY,
      name: clinic.name,
      open: clinic.isOpenNow,
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

      {markers.map((m) => (
        <Pressable
          key={m.id}
          onPress={() => onSelectClinic?.(m.id)}
          style={[
            styles.pin,
            shadows.sm,
            {
              left: m.left - 42,
              top: m.top - 16,
              backgroundColor: m.open ? colors.success : colors.primary,
              borderColor: '#FFFFFF',
            },
          ]}
        >
          <Text
            variant="caption"
            color="#FFFFFF"
            numberOfLines={1}
            style={styles.pinText}
          >
            {shortTitle(m.name)}
          </Text>
        </Pressable>
      ))}

      <View style={styles.zoomCol} pointerEvents="box-none">
        <Pressable
          onPress={() => setZoom((z) => Math.min(MAX_ZOOM, z + 1))}
          style={[styles.zoomBtn, { backgroundColor: colors.surface }]}
        >
          <Text variant="h3" color={colors.text}>
            +
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setZoom((z) => Math.max(MIN_ZOOM, z - 1))}
          style={[styles.zoomBtn, { backgroundColor: colors.surface }]}
        >
          <Text variant="h3" color={colors.text}>
            −
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#D6D3D1',
  },
  pin: {
    position: 'absolute',
    minWidth: 64,
    maxWidth: 128,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  pinText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
  zoomCol: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    gap: 8,
    zIndex: 3,
  },
  zoomBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
});
