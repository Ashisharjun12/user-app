import { View, StyleSheet, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import useAuthStore from '../store/authStore';
import { Typography } from '../components/atoms/Typography';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

export default function OTP() {
  const { phone, name, isDemo } = useLocalSearchParams<{ phone: string, name?: string, isDemo?: string }>();
  const [otp, setOtp] = useState('');
  const router = useRouter();
  const { login, updateProfile, isLoading } = useAuthStore();

  const handleVerify = async () => {
    if (otp.length < 4) return;

    if (!phone) {
        alert("Phone number missing. Please go back.");
        return;
    }

    const success = await login(phone, otp, name);
    if (success) {
      // Request Location Permission immediately after login
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      // Standard Login Flow
      const user = useAuthStore.getState().user;
      if (!user?.name || !user?.dob) { // Incomplete profile
          router.replace('/setup-profile');
      } else {
          router.replace('/(tabs)/home');
      }
    } else {
        alert("Invalid OTP. Try again.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container}>
        <View style={styles.content}>
            <View style={styles.header}>
                <Typography variant="h2" color="#fff" align="center" style={{marginBottom: 10}}>Verify Phone</Typography>
                <Typography variant="body" color="#888" align="center">
                    Code sent to {phone}
                </Typography>
                {isDemo === 'true' && (
                    <Typography variant="body" color="#f27f0d" align="center" style={{marginTop: 5, fontWeight: 'bold'}}>
                        Demo Mode: Use 123456
                    </Typography>
                )}
            </View>

            <View style={styles.form}>
                <Input 
                    placeholder="Enter 4-digit OTP" 
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="number-pad"
                    icon="key-outline"
                    maxLength={6}
                    style={{marginBottom: 20}}
                />
                
                <Button 
                    title="Verify & Login" 
                    onPress={handleVerify} 
                    loading={isLoading}
                    disabled={otp.length < 4}
                />

                <Button 
                    title="Change Phone Number" 
                    onPress={() => router.back()} 
                    variant="outline"
                    style={{marginTop: 20, borderWidth: 0}}
                />
            </View>
        </View>
        </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 40,
  },
  form: {
    width: '100%',
  }
});
