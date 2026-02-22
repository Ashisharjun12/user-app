import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';

export default function Layout() {
  const { isAuthenticated, checkAuth, user } = useAuthStore();
  const { fetchCart, clearCart } = useCartStore();
  const router = useRouter();
  const didRedirect = useRef(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && user && !didRedirect.current) {
      didRedirect.current = true;
      if (!user.isProfileComplete) {
        router.replace('/setup-profile');
      }
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      clearCart(true); // Clear local cart only on logout/init
    }
  }, [isAuthenticated]);

  return <Stack screenOptions={{ headerShown: false }} />;
}
