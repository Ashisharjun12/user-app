import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../components/atoms/Typography';
import { Button } from '../components/atoms/Button';
import useAuthStore from '../store/authStore';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LocationPicker() {
    const router = useRouter();
    const { user, updateProfile } = useAuthStore();
    const mapRef = useRef<MapView>(null);

    const [region, setRegion] = useState<Region>({
        latitude: user?.location?.lat || 28.6139,
        longitude: user?.location?.lng || 77.2090,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });

    const [selectedLocation, setSelectedLocation] = useState({
        lat: user?.location?.lat || 28.6139,
        lng: user?.location?.lng || 77.2090,
    });

    const [address, setAddress] = useState(user?.address || 'Locating...');
    const [loading, setLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!user?.location) {
            getCurrentLocation();
        } else {
            reverseGeocode(user.location.lat, user.location.lng);
        }
    }, []);

    const getCurrentLocation = async () => {
        setLoading(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Allow location access to find restaurants near you.');
                setLoading(false);
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const newRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
            setRegion(newRegion);
            setSelectedLocation({ lat: location.coords.latitude, lng: location.coords.longitude });
            reverseGeocode(location.coords.latitude, location.coords.longitude);
            mapRef.current?.animateToRegion(newRegion, 1000);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const [selectedCity, setSelectedCity] = useState(user?.city || '');

    const reverseGeocode = async (lat: number, lng: number) => {
        try {
            const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
            if (result.length > 0) {
                const item = result[0];
                const addr = `${item.name || ''} ${item.street || ''}, ${item.district || item.city || ''}, ${item.region || ''}`.trim().replace(/^,|,$/g, '').replace(/\s+/g, ' ');
                setAddress(addr);
                setSelectedCity(item.city || item.district || item.region || '');
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleRegionChangeComplete = (newRegion: Region) => {
        setRegion(newRegion);
        setSelectedLocation({ lat: newRegion.latitude, lng: newRegion.longitude });
        reverseGeocode(newRegion.latitude, newRegion.longitude);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const success = await updateProfile({
                location: selectedLocation,
                address: address,
                city: selectedCity,
                locationEnabled: true
            });
            if (success) {
                router.back();
            } else {
                Alert.alert('Error', 'Failed to update location');
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Typography variant="h3" color="#fff">Select Delivery Location</Typography>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={region}
                    onRegionChangeComplete={handleRegionChangeComplete}
                    showsUserLocation
                />
                <View style={styles.markerFixed}>
                    <Ionicons name="location" size={40} color="#f27f0d" />
                </View>
                
                <TouchableOpacity style={styles.myLocationBtn} onPress={getCurrentLocation}>
                    <Ionicons name="locate" size={24} color="#f27f0d" />
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <View style={styles.addressContainer}>
                    <View style={styles.addressIcon}>
                        <Ionicons name="location-outline" size={20} color="#f27f0d" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Typography variant="caption" color="#888" style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Select Location</Typography>
                        <Typography variant="body" color="#fff" numberOfLines={2} style={{ fontWeight: '600' }}>
                            {loading ? 'Locating...' : address}
                        </Typography>
                    </View>
                </View>

                <Button
                    title="Confirm Location"
                    onPress={handleSave}
                    loading={isSaving}
                    style={styles.confirmBtn}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: '#000',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    markerFixed: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -20,
        marginTop: -40,
    },
    myLocationBtn: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    footer: {
        backgroundColor: '#0F0F0F',
        padding: 24,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderWidth: 1,
        borderColor: '#1A1A1A',
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    addressIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(242, 127, 13, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmBtn: {
        backgroundColor: '#f27f0d',
        height: 55,
        borderRadius: 16,
    }
});
