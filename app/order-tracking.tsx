import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, ActivityIndicator, Image, Linking, Platform,
  Modal, TextInput, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import api, { submitReview, getOrderReview } from '../api/api';
import useSocketStore from '../store/socketStore';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Pending', sub: 'Order received at {time}' },
  { key: 'preparing', label: 'Preparing your food', sub: 'Chef started cooking at {time}' },
  { key: 'ready', label: 'Ready for Pickup', sub: 'Packed and ready at {time}' },
  { key: 'out_for_delivery', label: 'Out for Delivery', sub: 'Courier is on the way to you' },
  { key: 'delivered', label: 'Delivered', sub: 'Estimated by {time}' },
];

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
];

export default function OrderTracking() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { socket } = useSocketStore();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Review States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await api.get(`/users/orders/${id}`);
      setOrder(res.data);
    } catch (e) {
      console.error('fetchOrder error:', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (order?.status === 'delivered') {
      fetchExistingReview();
    }
  }, [order?.status]);

  const fetchExistingReview = async () => {
    try {
      const res = await getOrderReview(id as string);
      setExistingReview(res.data);
    } catch (e) {
      console.log('No existing review found');
    }
  };

  // Real-time updates
  useEffect(() => {
    if (!socket || !id) return;
    const handler = (data: any) => {
      if (data.orderId === id) {
        setOrder((prev: any) => ({ ...prev, status: data.status }));
      }
    };
    socket.on('order_status_update', handler);
    return () => { socket.off('order_status_update', handler); };
  }, [socket, id]);

  const handleCall = () => {
    if (order?.restaurant?.phone) {
      Linking.openURL(`tel:${order.restaurant.phone}`);
    }
  };

  const handleSubmitReview = async () => {
    if (!rating) return Alert.alert('Error', 'Please select a rating');
    setSubmitting(true);
    try {
      const res = await submitReview({
        restaurantId: order.restaurant._id,
        orderId: id as string,
        rating,
        comment
      });
      setExistingReview(res.data.review);
      setShowReviewModal(false);
      Alert.alert('Success', 'Thank you for your review!');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.safe, styles.centered]}>
        <ActivityIndicator color="#f27f0d" size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.safe, styles.centered]}>
        <Text style={{ color: '#fff' }}>Order not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
           <Text style={{ color: '#f27f0d' }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentStatusIdx = STATUS_STEPS.findIndex(s => s.key === order.status);
  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0B0B" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Track Order</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status Highlight */}
        <View style={styles.statusSection}>
           <View style={styles.badge}>
              <View style={styles.dot} />
              <Text style={styles.badgeText}>Real-time Updates</Text>
           </View>
           <Text style={styles.mainStatus}>
             {isCancelled ? 'Order Cancelled' : order.status.replace(/_/g, ' ').toUpperCase()}
           </Text>
           {!isCancelled && !isDelivered && (
             <Text style={styles.etaText}>Estimated Arrival: {new Date(new Date().getTime() + 20*60*1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
           )}
        </View>

        {/* Real-time Map Section */}
        {!isCancelled && !isDelivered && order.restaurant?.location && order.deliveryAddress?.location && (
          <View style={styles.mapContainer}>
             <MapView
               provider={PROVIDER_GOOGLE}
               style={styles.map}
               initialRegion={{
                 latitude: (order.restaurant.location.lat + order.deliveryAddress.location.lat) / 2,
                 longitude: (order.restaurant.location.lng + order.deliveryAddress.location.lng) / 2,
                 latitudeDelta: Math.abs(order.restaurant.location.lat - order.deliveryAddress.location.lat) * 1.5 || 0.02,
                 longitudeDelta: Math.abs(order.restaurant.location.lng - order.deliveryAddress.location.lng) * 1.5 || 0.02,
               }}
               customMapStyle={darkMapStyle}
             >
                <Marker 
                  coordinate={{ latitude: order.restaurant.location.lat, longitude: order.restaurant.location.lng }}
                  title={order.restaurant.restaurantName}
                >
                   <View style={styles.markerContainer}>
                      <Ionicons name="restaurant" size={20} color="#fff" />
                   </View>
                </Marker>
                
                <Marker 
                  coordinate={{ latitude: order.deliveryAddress.location.lat, longitude: order.deliveryAddress.location.lng }}
                  title="Your Location"
                >
                   <View style={[styles.markerContainer, { backgroundColor: '#f27f0d' }]}>
                      <Ionicons name="home" size={20} color="#fff" />
                   </View>
                </Marker>

                <Polyline
                  coordinates={[
                    { latitude: order.restaurant.location.lat, longitude: order.restaurant.location.lng },
                    { latitude: order.deliveryAddress.location.lat, longitude: order.deliveryAddress.location.lng }
                  ]}
                  strokeColor="#f27f0d"
                  strokeWidth={3}
                  lineDashPattern={[5, 5]}
                />
             </MapView>
             <View style={styles.mapOverlayInfo}>
                <Ionicons name="navigate" size={16} color="#f27f0d" />
                <Text style={styles.mapInfoText}>Real-time delivery tracking active</Text>
             </View>
          </View>
        )}

        {/* Timeline */}
        {!isCancelled && (
          <View style={styles.timeline}>
            {STATUS_STEPS.map((step, index) => {
              const isDone = index <= currentStatusIdx;
              const isLast = index === STATUS_STEPS.length - 1;

              return (
                <View key={step.key} style={styles.timelineItem}>
                  <View style={styles.markerCol}>
                    <View style={[styles.marker, isDone && styles.markerActive]}>
                      {isDone ? (
                        <Ionicons name={step.key === 'out_for_delivery' ? 'bicycle' : 'checkmark'} size={14} color="#fff" />
                      ) : (
                        <Ionicons name={step.key === 'out_for_delivery' ? 'bicycle' : 'ellipse'} size={14} color="#333" />
                      )}
                    </View>
                    {!isLast && <View style={[styles.line, isDone && (index < currentStatusIdx) && styles.lineActive]} />}
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={[styles.stepLabel, isDone && styles.textActive]}>{step.label}</Text>
                    <Text style={styles.stepSub}>
                      {step.sub.replace('{time}', new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Order Details Card */}
        <View style={styles.detailsCard}>
           <View style={styles.detailsHeader}>
              <View>
                <Text style={styles.detailsLabel}>ORDER ID</Text>
                <Text style={styles.detailsVal}>{order.orderId}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.detailsLabel}>TOTAL AMOUNT</Text>
                <Text style={styles.detailsPrice}>₹{order.totalAmount.toFixed(2)}</Text>
              </View>
           </View>

           <View style={styles.itemsList}>
              {order.items?.map((item: any, idx: number) => (
                <View key={idx} style={styles.productRow}>
                   <View style={styles.qtyBadge}>
                      <Text style={styles.qtyText}>{item.quantity}x</Text>
                   </View>
                   {item.product?.image && (
                     <Image source={{ uri: item.product.image }} style={styles.productThumb} />
                   )}
                   <Text style={styles.productName}>{item.product?.name}</Text>
                   <Text style={styles.productPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
                </View>
              ))}
           </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
           <TouchableOpacity style={styles.callMainBtn} onPress={handleCall}>
              <Ionicons name="call" size={20} color="#fff" />
              <Text style={styles.callMainBtnText}>Call Restaurant</Text>
           </TouchableOpacity>

           {isDelivered && !existingReview && (
             <TouchableOpacity 
               style={[styles.callMainBtn, { backgroundColor: '#1A1A1A', marginTop: 15, borderColor: '#f27f0d', borderWidth: 1 }]} 
               onPress={() => setShowReviewModal(true)}
             >
                <Ionicons name="star" size={20} color="#f27f0d" />
                <Text style={[styles.callMainBtnText, { color: '#f27f0d' }]}>Rate & Review</Text>
             </TouchableOpacity>
           )}

           {existingReview && (
             <View style={styles.reviewSummary}>
                <View style={styles.reviewHeader}>
                   <Text style={styles.reviewLabel}>YOUR REVIEW</Text>
                   <View style={styles.starsRow}>
                      {[1,2,3,4,5].map(s => (
                        <Ionicons key={s} name="star" size={14} color={s <= existingReview.rating ? '#FFC107' : '#333'} />
                      ))}
                   </View>
                </View>
                {existingReview.comment ? (
                  <Text style={styles.reviewText}>"{existingReview.comment}"</Text>
                ) : null}
             </View>
           )}
        </View>

        {/* Review Modal */}
        <Modal
          visible={showReviewModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowReviewModal(false)}
        >
           <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                 <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Rate Your Experience</Text>
                    <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                       <Ionicons name="close" size={24} color="#555" />
                    </TouchableOpacity>
                 </View>

                 <Text style={styles.restaurantNameReview}>{order.restaurant?.restaurantName}</Text>
                 
                 <View style={styles.starPicker}>
                    {[1, 2, 3, 4, 5].map((s) => (
                       <TouchableOpacity key={s} onPress={() => setRating(s)}>
                          <Ionicons 
                             name={s <= rating ? "star" : "star-outline"} 
                             size={40} 
                             color={s <= rating ? "#FFC107" : "#333"} 
                          />
                       </TouchableOpacity>
                    ))}
                 </View>

                 <TextInput
                    style={styles.reviewInput}
                    placeholder="Write your feedback here (optional)..."
                    placeholderTextColor="#555"
                    multiline
                    numberOfLines={4}
                    value={comment}
                    onChangeText={setComment}
                 />

                 <TouchableOpacity 
                    style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
                    onPress={handleSubmitReview}
                    disabled={submitting}
                 >
                    {submitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.submitBtnText}>Submit Review</Text>
                    )}
                 </TouchableOpacity>
              </View>
           </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0B0B0B' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15,
  },
  iconBtn: { padding: 8, backgroundColor: '#1A1A1A', borderRadius: 12 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  scroll: { padding: 20, paddingBottom: 100 },
  backBtn: { marginTop: 20, padding: 10 },

  statusSection: { alignItems: 'center', marginBottom: 24 },
  badge: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(242,127,13,0.1)', 
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 12
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f27f0d', marginRight: 8 },
  badgeText: { color: '#f27f0d', fontSize: 12, fontWeight: '600' },
  mainStatus: { color: '#fff', fontSize: 32, fontWeight: '800', textAlign: 'center' },
  etaText: { color: '#777', fontSize: 14, marginTop: 6 },

  mapContainer: { 
    height: 220, borderRadius: 24, overflow: 'hidden', marginBottom: 30,
    backgroundColor: '#111', borderWidth: 1, borderColor: '#1A1A1A'
  },
  map: { flex: 1 },
  markerContainer: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#1A1A1A',
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 5, elevation: 5
  },
  mapOverlayInfo: { 
    position: 'absolute', bottom: 12, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 10, backgroundColor: 'rgba(22,22,22,0.9)', 
    borderRadius: 12, borderWidth: 1, borderColor: '#1A1A1A'
  },
  mapInfoText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  timeline: { marginBottom: 30, paddingLeft: 10 },
  timelineItem: { flexDirection: 'row', minHeight: 70 },
  markerCol: { alignItems: 'center', width: 30, marginRight: 15 },
  marker: { 
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#1A1A1A', 
    justifyContent: 'center', alignItems: 'center', zIndex: 1, borderWidth: 1, borderColor: '#333'
  },
  markerActive: { backgroundColor: '#f27f0d', borderColor: '#f27f0d' },
  line: { width: 2, flex: 1, backgroundColor: '#333', marginTop: -4 },
  lineActive: { backgroundColor: '#f27f0d' },
  stepContent: { flex: 1, paddingTop: 4 },
  stepLabel: { color: '#555', fontSize: 16, fontWeight: '700' },
  textActive: { color: '#fff' },
  stepSub: { color: '#666', fontSize: 12, marginTop: 4 },

  detailsCard: { 
    backgroundColor: '#111', borderRadius: 20, padding: 20, marginBottom: 20,
    borderWidth: 1, borderColor: '#1A1A1A'
  },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  detailsLabel: { color: '#555', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  detailsVal: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 4 },
  detailsPrice: { color: '#f27f0d', fontSize: 20, fontWeight: '800', marginTop: 4 },

  itemsList: { borderTopWidth: 1, borderTopColor: '#1A1A1A', paddingTop: 15 },
  productRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  productThumb: { width: 40, height: 40, borderRadius: 8, marginRight: 12, backgroundColor: '#1A1A1A' },
  qtyBadge: { backgroundColor: '#1A1A1A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 10 },
  qtyText: { color: '#f27f0d', fontSize: 11, fontWeight: '800' },
  productName: { color: '#999', fontSize: 14, flex: 1 },
  productPrice: { color: '#fff', fontSize: 14, fontWeight: '600' },

  actions: { marginTop: 10 },
  callMainBtn: { 
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, height: 64, borderRadius: 20, backgroundColor: '#f27f0d',
    shadowColor: '#f27f0d', shadowOpacity: 0.3, shadowRadius: 10, elevation: 4
  },
  callMainBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },

  // Review Summary UI
  reviewSummary: {
    backgroundColor: '#161616', borderRadius: 20, padding: 18, 
    marginTop: 15, borderWidth: 1, borderColor: '#1A1A1A'
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  reviewLabel: { color: '#f27f0d', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewText: { color: '#ddd', fontSize: 14, fontStyle: 'italic', lineHeight: 20 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#111', borderTopLeftRadius: 30, borderTopRightRadius: 30, 
    padding: 25, minHeight: 450, borderTopWidth: 1, borderTopColor: '#1A1A1A' 
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  restaurantNameReview: { color: '#777', fontSize: 16, textAlign: 'center', marginBottom: 25 },
  starPicker: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginBottom: 30 },
  reviewInput: { 
    backgroundColor: '#1A1A1A', borderRadius: 15, padding: 15, color: '#fff', 
    fontSize: 15, height: 120, textAlignVertical: 'top', marginBottom: 30,
    borderWidth: 1, borderColor: '#222'
  },
  submitBtn: { 
    backgroundColor: '#f27f0d', height: 60, borderRadius: 18, 
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#f27f0d', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5
  },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
