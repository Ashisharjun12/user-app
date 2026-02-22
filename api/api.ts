
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: 'https://opposite-delivery-news-pickup.trycloudflare.com/api',
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const submitReview = (data: { restaurantId: string; orderId: string; rating: number; comment: string }) => 
    api.post('/reviews', data);

export const getOrderReview = (orderId: string) => 
    api.get(`/reviews/order/${orderId}`);

export const getRestaurantReviews = (restaurantId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/reviews/restaurant/${restaurantId}`, { params });

export default api;
