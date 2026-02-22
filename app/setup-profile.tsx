import { View, StyleSheet, TouchableOpacity, Switch, ScrollView, Modal, TextInput, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import useAuthStore from '../store/authStore';
import api from '../api/api';
import { Typography } from '../components/atoms/Typography';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { Header } from '../components/molecules/Header';

export default function SetupProfile() {
  const router = useRouter();
  const { user, updateProfile, isLoading } = useAuthStore();
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [dob, setDob] = useState(user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '');
  const [city, setCity] = useState(user?.city || '');
  const [locationEnabled, setLocationEnabled] = useState(user?.locationEnabled || false);
  const [image, setImage] = useState<string | null>(user?.image || null);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(user?.location || null);

  const [cities, setCities] = useState([]);
  const [showCityModal, setShowCityModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
        const res = await api.get('/admin/cities');
        setCities(res.data);
    } catch (error) {
        console.log("Failed to fetch cities");
    }
  };

  const toggleLocation = async (value: boolean) => {
      if (value) {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
              Alert.alert('Permission to access location was denied');
              return;
          }

          let location = await Location.getCurrentPositionAsync({});
          setUserLocation({
              lat: location.coords.latitude,
              lng: location.coords.longitude
          });
          setLocationEnabled(true);
      } else {
          setLocationEnabled(false);
          setUserLocation(null);
      }
  };

  const [showDatePicker, setShowDatePicker] = useState(false);

  const onChangeDOB = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDob(selectedDate.toISOString().split('T')[0]);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    const formData = new FormData();
    formData.append('file', {
      uri: uri,
      name: 'profile.jpg',
      type: 'image/jpeg',
    } as any);

    try {
        const res = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res.data.url;
    } catch (e) {
        console.error("Upload failed", e);
        return null;
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
      if (!name || !email || !dob || !city) {
          Alert.alert("Missing Fields", "Please fill all required fields");
          return;
      }

      setIsSaving(true);
      try {
          let imageUrl = image;
          if (image && !image.startsWith('http')) {
              imageUrl = await uploadImage(image);
              if (!imageUrl) {
                  Alert.alert("Upload Failed", "Could not upload profile image. Saving without image?");
                  // Optionally return or continue. Let's continue for now but maybe without image update?
                  // Or just fail.
                  setIsSaving(false);
                  return;
              }
          }

          const success = await updateProfile({
              name,
              email,
              dob,
              city,
              locationEnabled,
              image: imageUrl,
              location: userLocation 
          });

          if (success) {
              router.replace('/(tabs)/home');
          } else {
              Alert.alert("Error", "Failed to update profile. Please try again.");
          }
      } catch (error: any) {
          console.error("Save error:", error);
          const msg = error?.response?.data?.message || error?.message || "An unexpected error occurred.";
          Alert.alert("Profile Update Failed", msg);
      } finally {
          setIsSaving(false);
      }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Setup Profile" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Profile Image */}
        <View style={styles.imageContainer}>
            <View style={styles.imageWrapper}>
                <Image 
                    source={image ? { uri: image } : require('../assets/images/react-logo.png')} // Fallback if no local asset
                    style={styles.image}
                    contentFit="cover"
                />
                <TouchableOpacity style={styles.cameraBtn} onPress={pickImage}>
                    <Ionicons name="camera" size={16} color="#fff" />
                </TouchableOpacity>
            </View>
            <Typography variant="h3" style={{marginTop: 15}}>Add Profile Photo</Typography>
            <Typography variant="caption">Tap to personalize your profile</Typography>
        </View>

        {/* Form */}
        <View style={styles.form}>
            <Input 
                label="Full Name"
                placeholder="Enter your full name" 
                value={name}
                onChangeText={setName}
                icon="person-outline"
            />
             <Input 
                label="Phone Number"
                value={user?.phone || ''}
                editable={false}
                icon="call-outline"
                style={{opacity: 0.7}}
            />
             <Input 
                label="Email Address"
                placeholder="hello@example.com" 
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                icon="mail-outline"
            />
             <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <Input 
                    label="Date of Birth"
                    placeholder="YYYY-MM-DD" 
                    value={dob}
                    editable={false}
                    icon="calendar-outline"
                    pointerEvents="none"
                />
            </TouchableOpacity>
            
            {showDatePicker && (
                <DateTimePicker
                    value={dob ? new Date(dob) : new Date()}
                    mode="date"
                    display="default"
                    onChange={onChangeDOB}
                    maximumDate={new Date()}
                />
            )}

            <TouchableOpacity onPress={() => setShowCityModal(true)}>
                <Input 
                    label="City"
                    placeholder="Select City" 
                    value={city}
                    onChangeText={() => {}}
                    icon="map-outline"
                    // @ts-ignore
                    editable={false}
                    pointerEvents="none"
                />
            </TouchableOpacity>

            {/* Location Toggle */}
            <View style={styles.locationContainer}>
                <View style={[styles.locationIcon, locationEnabled && {backgroundColor: 'rgba(76, 175, 80, 0.2)'}]}>
                    <Ionicons name="location" size={24} color={locationEnabled ? "#4CAF50" : "#f27f0d"} />
                </View>
                <View style={{flex: 1, marginLeft: 15}}>
                    <Typography variant="body" style={{fontWeight: 'bold'}}>Enable Location</Typography>
                    <Typography variant="caption">{userLocation ? 'Location captured' : 'For accurate delivery tracking'}</Typography>
                </View>
                <Switch 
                    value={locationEnabled}
                    onValueChange={toggleLocation}
                    trackColor={{ false: "#333", true: "#f27f0d" }}
                    thumbColor="#fff"
                />
            </View>

            <Button 
                title="Save & Continue" 
                onPress={handleSave} 
                loading={isSaving || isLoading}
                disabled={!name || !email || !dob || !city || isSaving}
                style={{marginTop: 30}}
            />
        </View>

        {/* City Selection Modal */}
        <Modal visible={showCityModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Typography variant="h3">Select City</Typography>
                        <TouchableOpacity onPress={() => setShowCityModal(false)}>
                            <Ionicons name="close-circle" size={28} color="#666" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.searchBox}>
                        <Ionicons name="search" size={20} color="#666" />
                        <TextInput 
                            style={styles.searchInput}
                            placeholder="Search city..."
                            placeholderTextColor="#666"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                    </View>

                    <FlatList
                        // @ts-ignore
                        data={cities.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                        keyExtractor={(item: any) => item._id}
                        renderItem={({ item }: { item: any }) => (
                            <TouchableOpacity 
                                style={styles.cityItem}
                                onPress={() => { setCity(item.name); setShowCityModal(false); setSearchQuery(''); }}
                            >
                                <Ionicons name="location-sharp" size={18} color="#888" style={{marginRight: 10}} />
                                <Typography variant="body">{item.name}</Typography>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </View>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000', // Dark background
    paddingHorizontal: 20
  },
  scrollContent: {
      paddingBottom: 40
  },
  imageContainer: {
      alignItems: 'center',
      marginVertical: 20
  },
  imageWrapper: {
      position: 'relative'
  },
  image: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#f2bd9d' // Placeholder color from screenshot
  },
  cameraBtn: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: '#f27f0d',
      padding: 8,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: '#000'
  },
  form: {
      marginTop: 20
  },
  locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#1E1B16', // Dark Brown/Gold tint
      padding: 15,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#332211',
      marginTop: 10
  },
  locationIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(242, 127, 13, 0.2)',
      justifyContent: 'center',
      alignItems: 'center'
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1E1E1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%', padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#121212', borderRadius: 12, paddingHorizontal: 15, height: 50, marginBottom: 20 },
  searchInput: { flex: 1, marginLeft: 10, color: '#fff', fontSize: 16 },
  cityItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#252525', flexDirection: 'row', alignItems: 'center' },
});
