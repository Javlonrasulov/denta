import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Image,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text as RNText,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import type { MapType, Region } from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import Svg, { Polyline } from 'react-native-svg';

import { TASHKENT_REGION } from './mapUtils';
import { satelliteTileUrl, shortClinicTitle, streetTileUrl } from './mapTiles';
import { useTheme } from '@/theme';
import type { Clinic } from '@/types';

const TILE = 256;
const MIN_ZOOM = 11;
const MAX_ZOOM = 17;

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

function deltaToZoom(longitudeDelta: number) {
  const z = Math.round(Math.log2(360 / Math.max(longitudeDelta, 0.01)));
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
}

function zoomToDelta(zoom: number): Pick<Region, 'latitudeDelta' | 'longitudeDelta'> {
  const longitudeDelta = 360 / 2 ** zoom;
  return { longitudeDelta, latitudeDelta: longitudeDelta * 0.75 };
}

export type DentalMapHandle = {
  animateToRegion: (region: Region, duration?: number) => void;
  fitToClinics: (clinics: Clinic[]) => void;
  fitToCoordinates: (
    points: { latitude: number; longitude: number }[],
    padding?: { top?: number; bottom?: number; left?: number; right?: number },
  ) => void;
};

type Props = {
  clinics: Clinic[];
  selectedClinicId?: string | null;
  userLocation?: { latitude: number; longitude: number } | null;
  /** Real driving-route polyline (road geometry). Never a straight A→B. */
  routeCoordinates?: { latitude: number; longitude: number }[];
  onSelectClinic?: (clinicId: string) => void;
  onRegionChangeComplete?: (region: Region) => void;
  initialRegion?: Region;
  mapType?: MapType;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Fullscreen marketplace map — ArcGIS street tiles (same as Home).
 * Avoids empty beige Google MapView when Maps SDK key/billing is incomplete.
 */
export const DentalMap = forwardRef<DentalMapHandle, Props>(
  function DentalMap(
    {
      clinics,
      selectedClinicId,
      userLocation,
      routeCoordinates,
      onSelectClinic,
      onRegionChangeComplete,
      initialRegion = TASHKENT_REGION,
      mapType = 'standard',
      compact = false,
      style,
    },
    ref,
  ) {
    const { colors } = useTheme();
    const useSatellite = mapType === 'satellite';
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [center, setCenter] = useState({
      lat: initialRegion.latitude,
      lon: initialRegion.longitude,
    });
    const [zoom, setZoom] = useState(deltaToZoom(initialRegion.longitudeDelta));

    const centerRef = useRef(center);
    const zoomRef = useRef(zoom);
    const sizeRef = useRef(size);
    const onRegionRef = useRef(onRegionChangeComplete);
    centerRef.current = center;
    zoomRef.current = zoom;
    sizeRef.current = size;
    onRegionRef.current = onRegionChangeComplete;
    const dragStart = useRef({ lat: 0, lon: 0 });

    const fitPoints = useCallback(
      (
        points: { latitude: number; longitude: number }[],
        padding?: { top?: number; bottom?: number; left?: number; right?: number },
      ) => {
        if (points.length < 1) return;
        const lats = points.map((p) => p.latitude);
        const lons = points.map((p) => p.longitude);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        const latSpan = Math.max(maxLat - minLat, 0.008);
        const lonSpan = Math.max(maxLon - minLon, 0.008);
        // Extra pad so top chrome + bottom sheet don't clip the route.
        const padY = 1 + (padding?.top ?? 0.35) + (padding?.bottom ?? 0.45);
        const padX = 1 + (padding?.left ?? 0.2) + (padding?.right ?? 0.2);
        setCenter({
          lat: (minLat + maxLat) / 2,
          lon: (minLon + maxLon) / 2,
        });
        setZoom(deltaToZoom(Math.max(lonSpan * padX, latSpan * padY * 1.25)));
      },
      [],
    );

    const emitRegion = useCallback(() => {
      const z = zoomRef.current;
      const deltas = zoomToDelta(z);
      onRegionRef.current?.({
        latitude: centerRef.current.lat,
        longitude: centerRef.current.lon,
        ...deltas,
      });
    }, []);

    useImperativeHandle(ref, () => ({
      animateToRegion(region) {
        setCenter({ lat: region.latitude, lon: region.longitude });
        setZoom(deltaToZoom(region.longitudeDelta));
      },
      fitToClinics(list) {
        if (!list.length) return;
        fitPoints(list.map((c) => c.coordinates));
      },
      fitToCoordinates(points, padding) {
        fitPoints(points, padding);
      },
    }));

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
          onPanResponderRelease: () => emitRegion(),
          onPanResponderTerminate: () => emitRegion(),
        }),
      [emitRegion],
    );

    const { tiles, markers, userDot, routePoints } = useMemo(() => {
      const { width, height } = size;
      const z = Math.round(zoom);
      if (width < 8 || height < 8) {
        return {
          tiles: [] as { key: string; left: number; top: number; uri: string }[],
          markers: [] as {
            id: string;
            name: string;
            left: number;
            top: number;
            open: boolean;
            selected: boolean;
          }[],
          userDot: null as { left: number; top: number } | null,
          routePoints: '' as string,
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
            uri: useSatellite ? satelliteTileUrl(z, x, y) : streetTileUrl(z, x, y),
          });
        }
      }

      const limit = compact ? 20 : 48;
      const nextMarkers = clinics.slice(0, limit).map((clinic) => ({
        id: clinic.id,
        name: clinic.name,
        left: lonToX(clinic.coordinates.longitude, z) - originX,
        top: latToY(clinic.coordinates.latitude, z) - originY,
        open: !!clinic.isOpenNow,
        selected: clinic.id === selectedClinicId,
      }));

      let nextUser: { left: number; top: number } | null = null;
      if (userLocation) {
        nextUser = {
          left: lonToX(userLocation.longitude, z) - originX,
          top: latToY(userLocation.latitude, z) - originY,
        };
      }

      // Downsample dense polylines for SVG performance.
      const raw = routeCoordinates ?? [];
      const step = raw.length > 400 ? Math.ceil(raw.length / 400) : 1;
      const pts: string[] = [];
      for (let i = 0; i < raw.length; i += step) {
        const p = raw[i];
        const x = lonToX(p.longitude, z) - originX;
        const y = latToY(p.latitude, z) - originY;
        pts.push(`${x},${y}`);
      }
      if (raw.length > 1 && (raw.length - 1) % step !== 0) {
        const p = raw[raw.length - 1];
        pts.push(
          `${lonToX(p.longitude, z) - originX},${latToY(p.latitude, z) - originY}`,
        );
      }

      return {
        tiles: nextTiles,
        markers: nextMarkers,
        userDot: nextUser,
        routePoints: pts.join(' '),
      };
    }, [
      center.lat,
      center.lon,
      clinics,
      compact,
      routeCoordinates,
      selectedClinicId,
      size,
      useSatellite,
      userLocation,
      zoom,
    ]);

    // Soft recenter when parent supplies a new initial camera (user GPS).
    const seeded = useRef(false);
    useEffect(() => {
      if (seeded.current) return;
      if (
        initialRegion.latitude !== TASHKENT_REGION.latitude ||
        initialRegion.longitude !== TASHKENT_REGION.longitude
      ) {
        seeded.current = true;
        setCenter({ lat: initialRegion.latitude, lon: initialRegion.longitude });
        setZoom(deltaToZoom(initialRegion.longitudeDelta));
      }
    }, [initialRegion]);

    return (
      <View
        style={[styles.fill, style]}
        collapsable={false}
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

        {routePoints ? (
          <Svg
            pointerEvents="none"
            width={size.width}
            height={size.height}
            style={StyleSheet.absoluteFill}
          >
            <Polyline
              points={routePoints}
              fill="none"
              stroke={colors.primary}
              strokeWidth={5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.92}
            />
          </Svg>
        ) : null}

        {userDot ? (
          <View
            pointerEvents="none"
            style={[
              styles.userOuter,
              { left: userDot.left - 14, top: userDot.top - 14 },
            ]}
          >
            <View style={[styles.userInner, { backgroundColor: colors.primary }]} />
          </View>
        ) : null}

        {markers.map((m) => {
          const fill = m.selected
            ? colors.primary
            : m.open
              ? colors.secondary
              : '#64748B';
          const showLabel = !compact || zoom >= 12 || m.selected;
          if (showLabel) {
            const label = shortClinicTitle(m.name, m.selected ? 26 : 20);
            const approxW = Math.min(168, Math.max(64, label.length * 6.4 + 16));
            return (
              <Pressable
                key={m.id}
                accessibilityRole="button"
                accessibilityLabel={m.name}
                onPress={() => {
                  void Haptics.selectionAsync();
                  onSelectClinic?.(m.id);
                }}
                hitSlop={8}
                style={[
                  styles.labelWrap,
                  {
                    left: m.left - approxW / 2,
                    top: m.top - 14,
                    minWidth: approxW,
                    maxWidth: 168,
                    zIndex: m.selected ? 24 : m.open ? 12 : 6,
                    backgroundColor: fill,
                    borderColor: '#FFFFFF',
                    transform: [{ scale: m.selected ? 1.05 : 1 }],
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
          }

          return (
            <Pressable
              key={m.id}
              accessibilityRole="button"
              accessibilityLabel={m.name}
              onPress={() => {
                void Haptics.selectionAsync();
                onSelectClinic?.(m.id);
              }}
              hitSlop={10}
              style={[
                styles.markerWrap,
                {
                  left: m.left - 16,
                  top: m.top - 36,
                  zIndex: m.selected ? 20 : m.open ? 10 : 5,
                },
              ]}
            >
              <View
                style={[
                  styles.pin,
                  { backgroundColor: fill, borderColor: '#FFFFFF' },
                ]}
              >
                <View style={styles.dot} />
              </View>
              <View style={[styles.stem, { borderTopColor: fill }]} />
            </Pressable>
          );
        })}

        {!compact ? (
          <View style={styles.zoomCol} pointerEvents="box-none">
            <Pressable
              onPress={() => {
                setZoom((z) => Math.min(MAX_ZOOM, z + 1));
                setTimeout(emitRegion, 0);
              }}
              style={[styles.zoomBtn, { backgroundColor: '#FFFFFF' }]}
            >
              <View style={[styles.zoomBarH, { backgroundColor: colors.text }]} />
              <View style={[styles.zoomBarV, { backgroundColor: colors.text }]} />
            </Pressable>
            <Pressable
              onPress={() => {
                setZoom((z) => Math.max(MIN_ZOOM, z - 1));
                setTimeout(emitRegion, 0);
              }}
              style={[styles.zoomBtn, { backgroundColor: '#FFFFFF' }]}
            >
              <View style={[styles.zoomBarH, { backgroundColor: colors.text }]} />
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    minHeight: 160,
    overflow: 'hidden',
    backgroundColor: '#DCE6F0',
  },
  markerWrap: {
    position: 'absolute',
    width: 32,
    height: 40,
    alignItems: 'center',
  },
  labelWrap: {
    position: 'absolute',
    height: 24,
    maxWidth: 168,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 4,
  },
  pin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.28,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  stem: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  userOuter: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,79,200,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  userInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  zoomCol: {
    position: 'absolute',
    left: 16,
    bottom: 120,
    gap: 8,
    zIndex: 8,
  },
  zoomBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(15,23,42,0.08)',
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  zoomBarH: {
    position: 'absolute',
    width: 14,
    height: 2,
    borderRadius: 1,
  },
  zoomBarV: {
    position: 'absolute',
    width: 2,
    height: 14,
    borderRadius: 1,
  },
});
