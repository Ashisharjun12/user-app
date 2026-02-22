import { View, StyleSheet, TouchableWithoutFeedback, Keyboard, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import useAuthStore from '../store/authStore';
import { Typography } from '../components/atoms/Typography';
import { Input } from '../components/atoms/Input';
import { Button } from '../components/atoms/Button';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Register() {
  const [formData, setFormData] = useState({
      name: '',
      phone: ''
  });
  const router = useRouter();
  const { sendOtp, checkUser, isLoading } = useAuthStore();

  const handleRegister = async () => {
    if (formData.phone.length < 10 || !formData.name) {
      alert("Please fill all fields");
      return;
    }
    const fullPhone = '+91' + formData.phone;

    // Check if user already exists
    const exists = await checkUser(fullPhone);
    if (exists) {
        alert("User already exists with this number. Please Login.");
        router.push('/login');
        return;
    }

    const success = await sendOtp(fullPhone);
    if (success) {
      // Pass name to OTP screen to update profile after verification
      router.push({ 
          pathname: '/otp', 
          params: { 
              phone: fullPhone,
              name: formData.name
          } 
      });
    } else {
        alert("Failed to send OTP. Try again.");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <Typography variant="h1" color="#f27f0d" align="center" style={{marginBottom: 10}}>Create Account</Typography>
                <Typography variant="body" color="#888" align="center">Sign up to get started</Typography>
            </View>

            <View style={styles.form}>
                <Input 
                    placeholder="Full Name" 
                    value={formData.name}
                    onChangeText={(text) => setFormData({...formData, name: text})}
                    icon="person-outline"
                />
                <Input 
                    placeholder="Phone Number" 
                    value={formData.phone}
                    onChangeText={(text) => setFormData({...formData, phone: text})}
                    keyboardType="phone-pad"
                    icon="call-outline"
                    maxLength={10}
                    prefix="+91"
                />
                
                <Button 
                    title="Register" 
                    onPress={handleRegister} 
                    loading={isLoading}
                    disabled={formData.phone.length < 10 || !formData.name}
                    style={{marginTop: 20}}
                />

                <TouchableOpacity onPress={() => router.back()} style={{marginTop: 20, alignSelf: 'center'}}>
                    <Typography variant="body" color="#888">
                        Already have an account? <Typography variant="body" color="#f27f0d">Login</Typography>
                    </Typography>
                </TouchableOpacity>
            </View>
        </ScrollView>
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
    flexGrow: 1,
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
