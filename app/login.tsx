import { View, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import useAuthStore from '../store/authStore';
import { Typography } from '../components/atoms/Typography';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Login() {
  const [phone, setPhone] = useState('');
  const router = useRouter();
  const { sendOtp, checkUser, isLoading } = useAuthStore();

  const handleSendOtp = async () => {
    if (phone.length < 10) {
      alert("Please enter a valid phone number");
      return;
    }

    const fullPhone = '+91' + phone;

    // Demo Mode Detection
    if (phone === '1234567890') {
        alert("Demo Mode Detected: Use OTP 123456");
        router.push({ pathname: '/otp', params: { phone: fullPhone, isDemo: 'true' } });
        return;
    }

    // Check if registered
    const exists = await checkUser(fullPhone);
    if (!exists) {
        alert("Account not found. Please register first.");
        return;
    }

    const success = await sendOtp(fullPhone);
    if (success) {
      router.push({ pathname: '/otp', params: { phone: fullPhone } });
    } else {
        alert("Failed to send OTP. Try again.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container}>
        <View style={styles.content}>
            <View style={styles.header}>
                <Typography variant="h1" color="#f27f0d" align="center" style={{marginBottom: 10}}>Welcome Foodie!</Typography>
                <Typography variant="body" color="#888" align="center">Enter your phone number to continue</Typography>
            </View>

            <View style={styles.form}>
                <Input 
                    placeholder="Enter Phone Number" 
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    icon="call-outline"
                    maxLength={10}
                    prefix="+91"
                />
                
                <Button 
                    title="Send OTP" 
                    onPress={handleSendOtp} 
                    loading={isLoading}
                    disabled={phone.length < 10}
                    style={{marginTop: 20}}
                />

                <TouchableWithoutFeedback onPress={() => router.push('/register')}>
                    <View style={{marginTop: 20, alignSelf: 'center'}}>
                        <Typography variant="body" color="#888">
                            Don't have an account? <Typography variant="body" color="#f27f0d">Create one</Typography>
                        </Typography>
                    </View>
                </TouchableWithoutFeedback>
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
    marginBottom: 50,
  },
  form: {
    width: '100%',
  }
});
