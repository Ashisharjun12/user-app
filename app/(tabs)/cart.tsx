
import {
  View, TouchableOpacity, StyleSheet,
  Alert, Image, ScrollView, StatusBar, Platform
} from 'react-native';
import { Fragment } from 'react';
import useCartStore from '../../store/cartStore';
import useAddressStore from '../../store/addressStore';
import api from '../../api/api';
import { useRouter } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../components/atoms/Typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator } from 'react-native';

const DELIVERY_FEE = 0;
const TAX_RATE = 0; // No tax charged yet

export default function Cart() {
  const { cart, total, clearCart, incrementItem, decrementItem } = useCartStore();
  const { addresses, fetchAddresses } = useAddressStore();
  const router = useRouter();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAddresses();
    if (cart.length > 0) {
      fetchRestaurantStatus();
    }
  }, [cart[0]?.restaurantId]);

  const fetchRestaurantStatus = async () => {
    if (!cart[0]?.restaurantId) return;
    setLoading(true);
    try {
      const res = await api.get(`/users/restaurants/${cart[0].restaurantId}`);
      setRestaurant(res.data);
    } catch (error) {
      console.error("Failed to fetch restaurant status", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedAddress = useMemo(() => {
    return addresses.find(a => a.isDefault) || addresses[0];
  }, [addresses]);

  const itemsTotal = total;
  const taxes = parseFloat((itemsTotal * TAX_RATE).toFixed(2));
  const grandTotal = parseFloat((itemsTotal + DELIVERY_FEE + taxes).toFixed(2));

  const handlePlaceOrder = async () => {
    if (cart.length === 0 || loading) return;

    if (restaurant?.isOpen === false) {
      Alert.alert('Restaurant Closed', 'This restaurant is currently closed and not accepting orders.');
      return;
    }

    if (!selectedAddress) {
      Alert.alert('No Address', 'Please add a delivery address first.', [
        { text: 'Add Address', onPress: () => router.push('/address/add') }
      ]);
      return;
    }

    try {
      const orderData = {
        restaurantId: cart[0].restaurantId,
        items: cart.map(item => ({
          product: item._id,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: grandTotal,
        paymentMethod: 'cod',
        deliveryAddress: {
          address: selectedAddress.address,
          city: selectedAddress.city,
          location: selectedAddress.location,
        },
      };

      await api.post('/users/orders', orderData);
      Alert.alert('Success', 'Order Placed Successfully!');
      clearCart();
      router.replace('/(tabs)/orders');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to place order');
    }
  };

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={80} color="#333" />
      <Typography variant="h3" color="#666" style={{ marginTop: 20 }}>
        Your cart is empty
      </Typography>
      <Typography variant="body" color="#444" style={{ marginTop: 8, textAlign: 'center' }}>
        Add some delicious items from a restaurant!
      </Typography>
      <TouchableOpacity
        style={styles.browseBtn}
        onPress={() => router.replace('/(tabs)/home')}
      >
        <Typography variant="body" color="#fff" style={{ fontWeight: 'bold' }}>
          Browse Restaurants
        </Typography>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <Image
        source={item.image ? { uri: item.image } : require('../../assets/images/react-logo.png')}
        style={[styles.itemImage, restaurant?.isOpen === false && styles.imageClosed]}
      />
      <View style={styles.itemInfo}>
        <Typography variant="h3" style={{ fontSize: 15 }} numberOfLines={1}>
          {item.name}
        </Typography>
        <Typography variant="body" color="#f27f0d" style={{ fontWeight: 'bold', marginTop: 2 }}>
          ₹{item.price}
        </Typography>
      </View>

      {/* Qty Stepper */}
      <View style={styles.stepper}>
        <TouchableOpacity
          style={styles.stepperBtn}
          onPress={() => decrementItem(item._id)}
        >
          <Ionicons name="remove" size={16} color="#fff" />
        </TouchableOpacity>
        <Typography variant="body" color="#fff" style={styles.stepperQty}>
          {item.quantity}
        </Typography>
        <TouchableOpacity
          style={[styles.stepperBtn, styles.stepperBtnOrange]}
          onPress={() => incrementItem(item._id)}
        >
          <Ionicons name="add" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Typography variant="h2" style={{ fontSize: 20 }}>Your Cart</Typography>
        <TouchableOpacity
          style={styles.headerBack}
          onPress={() =>
            Alert.alert('Clear Cart', 'Remove all items?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Clear', style: 'destructive', onPress: () => clearCart() },
            ])
          }
        >
          <Ionicons name="trash-outline" size={22} color="#f27f0d" />
        </TouchableOpacity>
      </View>

      {cart.length === 0 ? (
        renderEmptyCart()
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

            {/* Delivery Address */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Typography variant="caption" color="#888" style={styles.sectionTitle}>
                  DELIVERY ADDRESS
                </Typography>
                <TouchableOpacity onPress={() => router.push('/address' as any)}>
                  <Typography variant="caption" color="#f27f0d" style={{ fontWeight: 'bold' }}>
                    Change
                  </Typography>
                </TouchableOpacity>
              </View>

              <View style={styles.addressCard}>
                <View style={styles.addressIcon}>
                  <Ionicons name="location" size={20} color="#f27f0d" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Typography variant="h3" style={{ fontSize: 15 }}>
                    {selectedAddress?.title || 'No Address'}
                  </Typography>
                  <Typography variant="caption" color="#888" numberOfLines={1} style={{ marginTop: 3 }}>
                    {selectedAddress
                      ? `${selectedAddress.address}, ${selectedAddress.city}`
                      : 'Add a delivery address'}
                  </Typography>
                </View>
              </View>
            </View>

            {/* Items in Cart */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Typography variant="caption" color="#888" style={styles.sectionTitle}>
                  ITEMS IN CART ({cart.length})
                </Typography>
              </View>

              {cart.map(item => (
                <Fragment key={item._id}>
                  {renderItem({ item })}
                </Fragment>
              ))}
            </View>

            {/* Payment Method */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Typography variant="caption" color="#888" style={styles.sectionTitle}>
                  PAYMENT METHOD
                </Typography>
                <Typography variant="caption" color="#f27f0d" style={{ fontWeight: 'bold' }}>
                  COD
                </Typography>
              </View>
              <View style={styles.paymentCard}>
                <View style={styles.paymentIcon}>
                  <Ionicons name="cash-outline" size={20} color="#f27f0d" />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Typography variant="body" style={{ fontWeight: '600' }}>
                    Cash on Delivery
                  </Typography>
                  <Typography variant="caption" color="#888" style={{ marginTop: 2 }}>
                    Pay when your order arrives
                  </Typography>
                </View>
                <View style={styles.paymentCheck}>
                  <Ionicons name="checkmark-circle" size={22} color="#f27f0d" />
                </View>
              </View>
            </View>

            {/* Bill Details */}
            <View style={styles.section}>
              <Typography variant="caption" color="#888" style={{ fontWeight: '700', letterSpacing: 0.6, marginBottom: 16 }}>
                BILL DETAILS
              </Typography>

              <View style={styles.billRow}>
                <Typography variant="body" color="#aaa">Items Total</Typography>
                <Typography variant="body" color="#fff">₹{itemsTotal.toFixed(2)}</Typography>
              </View>
              <View style={styles.billRow}>
                <Typography variant="body" color="#aaa">Delivery Fee</Typography>
                <Typography variant="body" color="#2ecc71">Free</Typography>
              </View>
              <View style={styles.billRow}>
                <Typography variant="body" color="#aaa">Taxes &amp; Charges</Typography>
                <Typography variant="body" color="#aaa">₹0.00</Typography>
              </View>

              <View style={styles.billDivider} />

              <View style={styles.billRow}>
                <Typography variant="h3" style={{ fontSize: 16 }}>Total Amount</Typography>
                <Typography variant="h3" color="#f27f0d" style={{ fontSize: 16 }}>
                  ₹{grandTotal.toFixed(2)}
                </Typography>
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>

          <View style={styles.fixedBottomContainer}>
            {restaurant?.isOpen === false && (
              <View style={[styles.closedWarning, { backgroundColor: '#e74c3c', borderColor: '#e74c3c', marginBottom: 12 }]}>
                <Ionicons name="alert-circle" size={20} color="#fff" />
                <Typography variant="body" color="#fff" style={{ marginLeft: 8, fontWeight: 'bold' }}>
                  RESTAURANT IS CURRENTLY CLOSED
                </Typography>
              </View>
            )}

            {/* Place Order CTA */}
            <View style={styles.ctaContainer}>
              <TouchableOpacity 
                style={[styles.ctaBtn, (restaurant?.isOpen === false || loading) && { backgroundColor: '#333' }]} 
                onPress={handlePlaceOrder} 
                activeOpacity={0.85}
                disabled={restaurant?.isOpen === false || loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Typography variant="h3" color={restaurant?.isOpen === false ? "#888" : "#fff"} style={{ fontSize: 16 }}>
                      {restaurant?.isOpen === false ? 'Restaurant Closed' : 'Place Order'}
                    </Typography>
                    <View style={styles.ctaDivider} />
                    <Typography variant="h3" color={restaurant?.isOpen === false ? "#888" : "#fff"} style={{ fontSize: 16 }}>
                      ₹{grandTotal.toFixed(2)}
                    </Typography>
                  </>
                )}
              </TouchableOpacity>
              <Typography variant="caption" color="#444" style={styles.ctaNote}>
                BY PLACING YOUR ORDER, YOU AGREE TO OUR TERMS OF SERVICE
              </Typography>
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1C',
  },
  headerBack: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1C1C1C',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Sections
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: 0.6,
  },

  // Address
  addressCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(242,127,13,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Cart Item
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#333',
  },
  imageClosed: {
    opacity: 0.2,
  },
  fixedBottomContainer: {
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
    paddingTop: 12,
  },
  closedWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: 12,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 24,
    padding: 3,
  },
  stepperBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperBtnOrange: {
    backgroundColor: '#f27f0d',
  },
  stepperQty: {
    minWidth: 28,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Payment
  paymentCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  paymentIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(242,127,13,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentCheck: {
    marginLeft: 'auto',
  },

  // Bill
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  billDivider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 12,
  },

  // CTA
  ctaContainer: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 18,
  },
  ctaBtn: {
    backgroundColor: '#f27f0d',
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f27f0d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 16,
  },
  ctaNote: {
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 0.3,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  browseBtn: {
    marginTop: 28,
    backgroundColor: '#f27f0d',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
});
