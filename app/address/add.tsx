import {
  View, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Dimensions, Platform, KeyboardAvoidingView, ScrollView, StatusBar
} from 'react-native';
import { Typography } from '../../components/atoms/Typography';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import useAddressStore from '../../store/addressStore';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

// India center as fallback default
const INDIA_DEFAULT: Region = {
  latitude: 20.5937,
  longitude: 78.9629,
  latitudeDelta: 15,
  longitudeDelta: 15,
};

const ADDRESS_TYPES = [
  { label: 'Home', icon: 'home-outline' as const },
  { label: 'Work', icon: 'briefcase-outline' as const },
  { label: 'Other', icon: 'location-outline' as const },
];

export default function AddAddress() {
  const router = useRouter();
  const { addAddress } = useAddressStore();
  const mapRef = useRef<MapView>(null);

  const [region, setRegion] = useState<Region>(INDIA_DEFAULT);
  const [markerCoord, setMarkerCoord] = useState({ latitude: INDIA_DEFAULT.latitude, longitude: INDIA_DEFAULT.longitude });
  const [title, setTitle] = useState('Home');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(true);

  // Get GPS on mount → reverse geocode → auto-fill city
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocating(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const gpsRegion: Region = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        };

        setRegion(gpsRegion);
        setMarkerCoord({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

        // Animate map to GPS position
        mapRef.current?.animateToRegion(gpsRegion, 800);

        // Reverse geocode to auto-fill city
        const [place] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (place) {
          setCity(place.city || place.subregion || place.region || '');
          if (place.street && place.name) {
            setAddressLine(`${place.name}, ${place.street}`);
          }
        }
      } catch (e) {
        console.error('Location error:', e);
      } finally {
        setLocating(false);
      }
    })();
  }, []);

  // When map stops moving, update marker + reverse geocode city
  const handleRegionChange = async (newRegion: Region) => {
    setRegion(newRegion);
    setMarkerCoord({ latitude: newRegion.latitude, longitude: newRegion.longitude });
    try {
      const [place] = await Location.reverseGeocodeAsync({
        latitude: newRegion.latitude,
        longitude: newRegion.longitude,
      });
      if (place?.city || place?.subregion) {
        setCity(place.city || place.subregion || '');
      }
    } catch (_) {}
  };

  const goToMyLocation = async () => {
    setLocating(true);
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const gpsRegion: Region = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.008,
        longitudeDelta: 0.008,
      };
      setRegion(gpsRegion);
      setMarkerCoord({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      mapRef.current?.animateToRegion(gpsRegion, 600);
    } catch (e) {
      Alert.alert('Error', 'Could not get current location.');
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    if (!addressLine.trim() || !city.trim()) {
      Alert.alert('Incomplete', 'Please fill in City and Full Address fields.');
      return;
    }
    setLoading(true);
    try {
      await addAddress({
        title,
        address: addressLine,
        city,
        location: { lat: markerCoord.latitude, lng: markerCoord.longitude },
        isDefault: false,
      });
      Alert.alert('Saved!', 'Your address has been saved.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.message || 'Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: '#000' }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <Typography variant="h3" style={{ fontSize: 18 }}>Add Address</Typography>
          <View style={{ width: 38 }} />
        </View>
      </SafeAreaView>

      {/* Map Section */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={INDIA_DEFAULT}
          onRegionChangeComplete={handleRegionChange}
          showsUserLocation
          showsMyLocationButton={false}
        />

        {/* Floating DELIVERY HERE pin in center */}
        <View style={styles.pinContainer} pointerEvents="none">
          <View style={styles.deliveryBadge}>
            <Ionicons name="bicycle" size={14} color="#fff" />
            <Typography variant="caption" color="#fff" style={styles.deliveryBadgeText}>
              DELIVERY HERE
            </Typography>
          </View>
          <Ionicons name="location" size={44} color="#f27f0d" style={{ marginTop: -2 }} />
          <View style={styles.pinShadow} />
        </View>

        {/* GPS button */}
        <TouchableOpacity style={styles.gpsBtn} onPress={goToMyLocation}>
          {locating ? (
            <ActivityIndicator size="small" color="#f27f0d" />
          ) : (
            <Ionicons name="locate" size={20} color="#f27f0d" />
          )}
        </TouchableOpacity>
      </View>

      {/* Bottom Form Sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.sheet}
      >
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Save As */}
          <Typography variant="caption" color="#888" style={styles.sectionLabel}>
            SAVE AS
          </Typography>
          <View style={styles.typeRow}>
            {ADDRESS_TYPES.map(({ label, icon }) => (
              <TouchableOpacity
                key={label}
                style={[styles.typeBtn, title === label && styles.typeBtnActive]}
                onPress={() => setTitle(label)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={icon}
                  size={15}
                  color={title === label ? '#fff' : '#888'}
                  style={{ marginRight: 5 }}
                />
                <Typography
                  variant="caption"
                  color={title === label ? '#fff' : '#888'}
                  style={{ fontWeight: '600' }}
                >
                  {label}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>

          {/* City */}
          <Typography variant="caption" color="#888" style={styles.inputLabel}>
            <Ionicons name="business-outline" size={12} color="#888" />&nbsp; City
          </Typography>
          <TextInput
            style={styles.input}
            placeholder="e.g., Mumbai"
            placeholderTextColor="#444"
            value={city}
            onChangeText={setCity}
          />

          {/* Full Address */}
          <Typography variant="caption" color="#888" style={styles.inputLabel}>
            <Ionicons name="map-outline" size={12} color="#888" />&nbsp; Full Address
          </Typography>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            placeholder="e.g., Apartment 4B, 72 Market Street, Financial District"
            placeholderTextColor="#444"
            value={addressLine}
            onChangeText={setAddressLine}
            multiline
            numberOfLines={3}
          />

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Typography variant="h3" color="#fff" style={{ fontSize: 16 }}>
                Save Address
              </Typography>
            </>
          )}
        </TouchableOpacity>
        <View style={{ height: Platform.OS === 'ios' ? 24 : 16 }} />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1C1C1C',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Map
  mapContainer: {
    height: height * 0.38,
    width: '100%',
  },

  // Center pin
  pinContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f27f0d',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 4,
    shadowColor: '#f27f0d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  deliveryBadgeText: {
    fontWeight: 'bold',
    letterSpacing: 0.5,
    marginLeft: 5,
  },
  pinShadow: {
    width: 12,
    height: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    marginTop: -2,
  },

  // GPS button
  gpsBtn: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },

  // Sheet
  sheet: {
    flex: 1,
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    marginTop: -20,
  },

  // Save As
  sectionLabel: {
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    backgroundColor: '#1A1A1A',
  },
  typeBtnActive: {
    backgroundColor: '#f27f0d',
    borderColor: '#f27f0d',
  },

  // Inputs
  inputLabel: {
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    color: '#fff',
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 18,
  },
  inputMulti: {
    minHeight: 90,
    textAlignVertical: 'top',
  },

  // Save button
  saveBtn: {
    backgroundColor: '#f27f0d',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 0,
    shadowColor: '#f27f0d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
