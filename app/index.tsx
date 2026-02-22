import { View, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import useAuthStore from '../store/authStore';
import { Typography } from '../components/atoms/Typography';

export default function Index() {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
        await checkAuth();
        setIsReady(true);
    };
    init();
  }, []);

  if (!isReady) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
            <Typography variant="h1" color="#f27f0d" style={{ fontSize: 40, marginBottom: 20 }}>Foodie</Typography>
            <Typography variant="body" color="#fff" style={{ marginBottom: 40 }}>Delicious food, delivered.</Typography>
            <ActivityIndicator size="large" color="#f27f0d" />
        </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(tabs)/home' : '/login'} />;
}
