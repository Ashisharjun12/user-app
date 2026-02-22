import { create } from 'zustand';
import api from '../api/api';

export interface Address {
  _id: string;
  title: string;
  address: string;
  city: string;
  location: {
    lat: number;
    lng: number;
  };
  isDefault: boolean;
}

interface AddressState {
  addresses: Address[];
  isLoading: boolean;
  fetchAddresses: () => Promise<void>;
  addAddress: (data: Omit<Address, '_id'>) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
}

const useAddressStore = create<AddressState>((set, get) => ({
  addresses: [],
  isLoading: false,

  fetchAddresses: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/addresses');
      set({ addresses: res.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      set({ isLoading: false });
    }
  },

  addAddress: async (data: any) => {
    set({ isLoading: true });
    try {
      await api.post('/addresses', data);
      await get().fetchAddresses(); // Refresh list
    } catch (error) {
      console.error('Failed to add address:', error);
      throw error;
    } finally {
        set({ isLoading: false });
    }
  },

  setDefaultAddress: async (id: string) => {
      try {
          await api.put(`/addresses/${id}/default`);
          await get().fetchAddresses();
      } catch (error) {
          console.error('Failed to set default address:', error);
      }
  },

  deleteAddress: async (id: string) => {
    try {
      await api.delete(`/addresses/${id}`);
      await get().fetchAddresses();
    } catch (error) {
      console.error('Failed to delete address:', error);
    }
  }
}));

export default useAddressStore;
