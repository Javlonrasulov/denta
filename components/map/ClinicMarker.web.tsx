import { View } from 'react-native';

type Props = {
  id: string;
  coordinate: { latitude: number; longitude: number };
  title: string;
  selected?: boolean;
  availableToday?: boolean;
  onPress?: (id: string) => void;
};

/** Web stub — markers are rendered by OsmTileMap / DentalMap.web. */
export function ClinicMarker(_props: Props) {
  return <View />;
}
