'use client';

import 'leaflet/dist/leaflet.css';

import type { Map as LeafletMap, Marker } from 'leaflet';
import { Crosshair, Loader2, MapPin, Search } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';

import { cn } from '@/lib/cn';

export type GeoPoint = { latitude: number; longitude: number };

export type ResolvedAddress = {
  address: string;
  city: string;
  region: string;
};

type NominatimAddress = Record<string, string | undefined>;

type NominatimPlace = {
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  address?: NominatimAddress;
};

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    osm_type?: string;
    osm_id?: number;
    type?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    /** [minLon, maxLat, maxLon, minLat] */
    extent?: [number, number, number, number];
  };
};

type Suggestion = {
  key: string;
  label: string;
  detail: string;
  point: GeoPoint;
  extent?: [number, number, number, number];
  isArea: boolean;
  resolved: ResolvedAddress;
};

const TASHKENT: GeoPoint = { latitude: 41.311081, longitude: 69.240562 };
const NOMINATIM = 'https://nominatim.openstreetmap.org';
// Public Nominatim forbids search-as-you-type; Photon (also OSM data) is built for it.
const PHOTON = 'https://photon.komoot.io/api/';
const UZ_BBOX = '55.9,37.1,73.2,45.6';
const AREA_TYPES = new Set(['country', 'state', 'county', 'city', 'district', 'locality']);
const SUGGEST_DEBOUNCE_MS = 350;

const PIN_HTML = `
<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg" style="display:block;filter:drop-shadow(0 2px 3px rgba(15,23,42,.35))">
  <path d="M17 0C7.6 0 0 7.5 0 16.8 0 29.4 17 44 17 44s17-14.6 17-27.2C34 7.5 26.4 0 17 0z" fill="#4f46e5"/>
  <circle cx="17" cy="16.5" r="6.5" fill="#fff"/>
</svg>`;

function toResolved(place: NominatimPlace): ResolvedAddress {
  const a = place.address ?? {};
  const road = a.road ?? a.pedestrian ?? a.street;
  const area = a.neighbourhood ?? a.residential ?? a.suburb ?? a.quarter;
  const district = a.city_district ?? a.district;
  const name = place.name && place.name !== road ? place.name : undefined;
  // Without a named road (common in Uzbek OSM data) the mahalla/massiv leads the house number.
  const parts = [name, road ?? area, a.house_number, road ? area : undefined, district];
  return {
    address: [...new Set(parts.filter(Boolean))].join(', '),
    city: a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? '',
    region: a.state ?? a.region ?? '',
  };
}

async function reverseGeocode(point: GeoPoint, lang: string) {
  const url =
    `${NOMINATIM}/reverse?format=jsonv2&addressdetails=1` +
    `&lat=${point.latitude}&lon=${point.longitude}&accept-language=${lang}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) return null;
  const place = (await res.json()) as NominatimPlace;
  return toResolved(place);
}

function uniqueParts(parts: (string | undefined)[]): string[] {
  return [...new Set(parts.filter((p): p is string => Boolean(p)))];
}

function fromPhoton(f: PhotonFeature): Suggestion {
  const p = f.properties;
  const [lon, lat] = f.geometry.coordinates;
  const isArea = AREA_TYPES.has(p.type ?? '');
  const streetLine = uniqueParts([p.street, p.housenumber]).join(', ');
  const label = p.name || streetLine;
  return {
    key: `${p.osm_type}${p.osm_id}`,
    label,
    detail: uniqueParts([p.name ? streetLine : undefined, p.district, p.city, p.county, p.state])
      .filter((x) => x !== label)
      .join(', '),
    point: { latitude: lat, longitude: lon },
    extent: p.extent,
    isArea,
    resolved: {
      address: isArea ? '' : uniqueParts([p.name, streetLine, p.district]).join(', '),
      city: p.city ?? (p.type === 'city' ? p.name : undefined) ?? p.county ?? '',
      region: p.state ?? (p.type === 'state' ? p.name : undefined) ?? '',
    },
  };
}

async function suggestPlaces(query: string, signal: AbortSignal): Promise<Suggestion[]> {
  // lang=default returns the local (Uzbek) OSM names instead of following the browser language.
  const url = `${PHOTON}?limit=6&lang=default&bbox=${UZ_BBOX}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { features?: PhotonFeature[] };
  const seen = new Set<string>();
  return (data.features ?? []).map(fromPhoton).filter((s) => {
    const sig = `${s.label}|${s.detail}`;
    if (!s.label || seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
}

export function LocationPicker({
  value,
  onChange,
  onAddressResolved,
  disabled,
  lang,
  labels,
}: {
  value: GeoPoint | null;
  onChange: (point: GeoPoint) => void;
  /** Called after the pin moves and OpenStreetMap returns an address for it. */
  onAddressResolved?: (address: ResolvedAddress) => void;
  disabled?: boolean;
  lang: string;
  labels: {
    searchPlaceholder: string;
    search: string;
    myLocation: string;
    noResults: string;
    searchFailed: string;
    geoFailed: string;
    hint: string;
  };
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const placeMarkerRef = useRef<(p: GeoPoint) => void>(() => undefined);
  const onChangeRef = useRef(onChange);
  const onResolvedRef = useRef(onAddressResolved);
  const langRef = useRef(lang);
  onChangeRef.current = onChange;
  onResolvedRef.current = onAddressResolved;
  langRef.current = lang;

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const skipSuggestRef = useRef(false);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState('');

  function commit(point: GeoPoint, resolve = true) {
    onChangeRef.current(point);
    if (!resolve) return;
    void reverseGeocode(point, langRef.current)
      .then((addr) => {
        if (addr) onResolvedRef.current?.(addr);
      })
      .catch(() => undefined);
  }

  useEffect(() => {
    let cancelled = false;

    void import('leaflet').then(({ default: L }) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const start = value ?? TASHKENT;
      const map = L.map(containerRef.current, {
        center: [start.latitude, start.longitude],
        zoom: value ? 16 : 12,
        scrollWheelZoom: true,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);

      const icon = L.divIcon({
        html: PIN_HTML,
        className: '',
        iconSize: [34, 44],
        iconAnchor: [17, 44],
      });

      placeMarkerRef.current = (p: GeoPoint) => {
        const ll = L.latLng(p.latitude, p.longitude);
        if (markerRef.current) {
          markerRef.current.setLatLng(ll);
          return;
        }
        const marker = L.marker(ll, { icon, draggable: !disabled }).addTo(map);
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          commit({ latitude: pos.lat, longitude: pos.lng });
        });
        markerRef.current = marker;
      };

      if (value) placeMarkerRef.current(value);

      if (!disabled) {
        map.on('click', (e) => {
          const p = { latitude: e.latlng.lat, longitude: e.latlng.lng };
          placeMarkerRef.current(p);
          commit(p);
        });
      }

      mapRef.current = map;
      // Panels may finish layout after mount; recompute tile grid.
      setTimeout(() => map.invalidateSize(), 0);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Map is created once; later value changes are synced below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  useEffect(() => {
    if (!value || !mapRef.current) return;
    placeMarkerRef.current(value);
    const map = mapRef.current;
    if (!map.getBounds().contains([value.latitude, value.longitude])) {
      map.setView([value.latitude, value.longitude], Math.max(map.getZoom(), 15));
    }
  }, [value?.latitude, value?.longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  function flyTo(point: GeoPoint) {
    placeMarkerRef.current(point);
    mapRef.current?.setView([point.latitude, point.longitude], 17);
  }

  /** Moves the viewport to a suggestion without touching the pin. */
  function preview(s: Suggestion) {
    const map = mapRef.current;
    if (!map) return;
    if (s.extent) {
      const [minLon, maxLat, maxLon, minLat] = s.extent;
      map.fitBounds(
        [
          [minLat, minLon],
          [maxLat, maxLon],
        ],
        { maxZoom: 17 },
      );
    } else {
      map.setView([s.point.latitude, s.point.longitude], s.isArea ? 13 : 17);
    }
  }

  async function runSearch(q: string, signal: AbortSignal) {
    setSearching(true);
    try {
      const rows = await suggestPlaces(q, signal);
      if (signal.aborted) return;
      setSuggestions(rows);
      setActive(0);
      setOpen(true);
      setMessage(rows.length ? '' : labels.noResults);
      if (rows[0]) preview(rows[0]);
    } catch {
      if (signal.aborted) return;
      setSuggestions([]);
      setMessage(labels.searchFailed);
    } finally {
      if (!signal.aborted) setSearching(false);
    }
  }

  useEffect(() => {
    if (skipSuggestRef.current) {
      skipSuggestRef.current = false;
      return;
    }
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setOpen(false);
      setSearching(false);
      setMessage('');
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => void runSearch(q, ctrl.signal), SUGGEST_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  function pick(s: Suggestion) {
    skipSuggestRef.current = true;
    setQuery(uniqueParts([s.label, s.detail]).join(', '));
    setOpen(false);
    preview(s);
    placeMarkerRef.current(s.point);
    commit(s.point, false);
    onResolvedRef.current?.(s.resolved);
  }

  function onSearchKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!suggestions.length) return;
      e.preventDefault();
      setOpen(true);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      setActive((i) => (i + step + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const chosen = open ? suggestions[active] : undefined;
      if (chosen) pick(chosen);
      else if (query.trim()) void runSearch(query.trim(), new AbortController().signal);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setMessage(labels.geoFailed);
      return;
    }
    setLocating(true);
    setMessage('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const point = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        flyTo(point);
        commit(point);
      },
      () => {
        setLocating(false);
        setMessage(labels.geoFailed);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  return (
    <div className="space-y-3">
      {!disabled ? (
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onSearchKey}
                onFocus={() => suggestions.length && setOpen(true)}
                onBlur={() => setOpen(false)}
                placeholder={labels.searchPlaceholder}
                role="combobox"
                aria-expanded={open}
                aria-autocomplete="list"
                autoComplete="off"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-9 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              />
              {searching ? (
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                </span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                const q = query.trim();
                if (q) void runSearch(q, new AbortController().signal);
              }}
              disabled={searching}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              {labels.search}
            </button>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              title={labels.myLocation}
              aria-label={labels.myLocation}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {locating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Crosshair className="h-4 w-4" />
              )}
            </button>
          </div>

          {open && suggestions.length > 0 ? (
            <ul
              role="listbox"
              className="absolute left-0 right-0 top-full z-[1100] mt-1 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
            >
              {suggestions.map((s, i) => (
                <li key={s.key} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    // Keep input focus so onBlur doesn't close the list before the click lands.
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(s)}
                    className={cn(
                      'flex w-full items-start gap-2.5 px-3 py-2 text-left',
                      i === active ? 'bg-primary/5' : 'hover:bg-slate-50',
                    )}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-800">
                        {s.label}
                      </span>
                      {s.detail ? (
                        <span className="block truncate text-xs text-slate-500">{s.detail}</span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div
        ref={containerRef}
        className="isolate h-[360px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
      />

      {message ? <p className="text-xs font-medium text-rose-600">{message}</p> : null}
      {!disabled ? <p className="text-xs text-slate-400">{labels.hint}</p> : null}
    </div>
  );
}
