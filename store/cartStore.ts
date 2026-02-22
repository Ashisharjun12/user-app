
import { create } from 'zustand';
import api from '../api/api';

interface CartItem {
  _id: string; // Product ID
  name: string;
  price: number;
  quantity: number;
  restaurantId: string;
  image?: string;
}

interface CartState {
  cart: CartItem[];
  isLoading: boolean;
  total: number;
  fetchCart: () => Promise<void>;
  addItem: (product: any) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  incrementItem: (productId: string) => Promise<void>;
  decrementItem: (productId: string) => Promise<void>;
  clearCart: (localOnly?: boolean) => Promise<void>;
}

const useCartStore = create<CartState>((set, get) => ({
  cart: [],
  total: 0,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/cart');
      const cartData = res.data;
      
      if (!cartData || !cartData.items) {
          set({ cart: [], total: 0, isLoading: false });
          return;
      }

      const mappedItems: CartItem[] = cartData.items.map((item: any) => ({
        _id: item.product._id,
        name: item.product.name,
        price: item.price,
        quantity: item.quantity,
        restaurantId: item.restaurant,
        image: item.product.image
      }));

      set({ 
        cart: mappedItems, 
        total: cartData.totalAmount,
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      set({ isLoading: false });
    }
  },

  addItem: async (product) => {
    try {
      await api.post('/cart/add', {
        productId: product._id,
        quantity: 1
      });
      await get().fetchCart();
    } catch (error: any) {
      console.error('Failed to add item:', error);
    }
  },

  incrementItem: async (productId) => {
    try {
      await api.post('/cart/update', { productId, action: 'increment' });
      await get().fetchCart();
    } catch (error) {
      console.error('Failed to increment item:', error);
    }
  },

  decrementItem: async (productId) => {
    try {
      // The backend handles qty <= 0 removal automatically
      await api.post('/cart/update', { productId, action: 'decrement' });
      await get().fetchCart();
    } catch (error) {
      console.error('Failed to decrement item:', error);
    }
  },

  removeItem: async (productId) => {
    try {
      await api.post('/cart/remove', { productId });
      await get().fetchCart();
    } catch (error) {
       console.error('Failed to remove item:', error);
    }
  },

  clearCart: async (localOnly = false) => {
    try {
      if (!localOnly) {
          await api.delete('/cart');
      }
      set({ cart: [], total: 0 });
    } catch (error: any) {
      console.error('Failed to clear cart:', error);
      if (error.response?.status === 401) {
          set({ cart: [], total: 0 });
      }
    }
  }
}));

export default useCartStore;
