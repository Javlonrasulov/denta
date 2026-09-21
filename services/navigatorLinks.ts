import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

type LatLng = { latitude: number; longitude: number };

export async function openYandexNavigator(dest: LatLng): Promise<boolean> {
  const { latitude: lat, longitude: lon } = dest;
  // yandexnavi://build_route_on_map?lat_to=&lon_to=
  const appUrl = `yandexnavi://build_route_on_map?lat_to=${lat}&lon_to=${lon}`;
  const webUrl = `https://yandex.com/maps/?rtext=~${lat},${lon}&rtt=auto`;

  try {
    const can = await Linking.canOpenURL(appUrl);
    if (can) {
      await Linking.openURL(appUrl);
      return true;
    }
  } catch {
    // continue to web
  }

  await Linking.openURL(webUrl);
  return false;
}

export async function openGoogleMapsDriving(dest: LatLng): Promise<boolean> {
  const { latitude: lat, longitude: lon } = dest;
  const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`;

  const appUrl =
    Platform.OS === 'ios'
      ? `comgooglemaps://?daddr=${lat},${lon}&directionsmode=driving`
      : `google.navigation:q=${lat},${lon}&mode=d`;

  try {
    const can = await Linking.canOpenURL(appUrl);
    if (can) {
      await Linking.openURL(appUrl);
      return true;
    }
  } catch {
    // continue
  }

  // Android geo intent as secondary attempt
  if (Platform.OS === 'android') {
    try {
      const geo = `geo:${lat},${lon}?q=${lat},${lon}`;
      const canGeo = await Linking.canOpenURL(geo);
      if (canGeo) {
        await Linking.openURL(
          `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`,
        );
        return true;
      }
    } catch {
      // fall through
    }
  }

  await Linking.openURL(webUrl);
  return false;
}
