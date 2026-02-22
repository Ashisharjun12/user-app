import { useEffect, useState, useCallback } from 'react';
import {
  View, StyleSheet, FlatList, Text,
  StatusBar, ActivityIndicator, TouchableOpacity, Image
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../../api/api';
import useAuthStore from '../../store/authStore';
import useSocketStore from '../../store/socketStore';

const STATUS_COLOR: Record<string, string> = {
  pending: '#f27f0d',
  preparing: '#3498db',
  ready: '#2ecc71',
  out_for_delivery: '#9b59b6',
  delivered: '#27ae60',
  cancelled: '#e74c3c',
};

const STATUS_ICON: Record<string, any> = {
  pending: 'time-outline',
  preparing: 'restaurant-outline',
  ready: 'checkmark-circle-outline',
  out_for_delivery: 'bicycle-outline',
  delivered: 'checkmark-done-circle-outline',
  cancelled: 'close-circle-outline',
};

export default function Orders() {
  const { user } = useAuthStore();
  const { socket, connect, disconnect, isConnected } = useSocketStore();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const fetchOrders = useCallback(async (pageNum = 1, shouldAppend = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '12',
      });
      if (startDate) params.append('startDate', startDate.toISOString().split('T')[0]);
      if (endDate) params.append('endDate', endDate.toISOString().split('T')[0]);

      const res = await api.get(`/users/orders?${params.toString()}`);
      const { orders: newOrders, totalPages } = res.data;
      
      if (shouldAppend) {
        setOrders(prev => [...prev, ...newOrders]);
      } else {
        setOrders(newOrders);
      }
      
      setHasMore(pageNum < totalPages);
    } catch (e) {
      console.error('fetchOrders error:', e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [startDate, endDate]);

  const handleApplyFilter = () => {
    setPage(1);
    fetchOrders(1, false);
  };

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(1);
    fetchOrders(1, false); 
  };

  const onStartChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      setPage(1);
      // We can't immediately call fetchOrders here because startDate state might not be updated yet
      // However, the useEffect or a separate trigger would be better.
      // For now, let's just trigger it in the handleApplyFilter or similar.
    }
  };

  const onEndChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
      setPage(1);
    }
  };

  // Trigger fetch when dates change
  useEffect(() => {
    if (loading) return; // Don't trigger on mount if already fetching
    fetchOrders(1, false);
  }, [startDate, endDate]);

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchOrders(1, false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchOrders(nextPage, true);
    }
  };

  useEffect(() => {
    if (!user?._id) return;
    connect(user._id);
    fetchOrders(1, false);
    return () => disconnect();
  }, [user?._id]);

  // Listen for real-time status updates
  useEffect(() => {
    if (!socket) return;
    const handler = ({ orderId, status }: { orderId: string; status: string; orderRef?: string }) => {
      console.log('[Socket][User] order_status_update', orderId, status);
      setOrders(prev =>
        prev.map(o => o._id === orderId ? { ...o, status } : o)
      );
    };
    socket.on('order_status_update', handler);
    return () => { socket.off('order_status_update', handler); };
  }, [socket]);

  const renderOrder = ({ item }: { item: any }) => {
    const color = STATUS_COLOR[item.status] || '#888';
    const icon = STATUS_ICON[item.status] || 'receipt-outline';
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push({ pathname: '/order-tracking', params: { id: item._id } })}
      >
        {/* Header */}
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.orderId}>{item.orderId || `#${item._id?.slice(-6).toUpperCase()}`}</Text>
            <Text style={styles.restaurant}>{item.restaurant?.restaurantName || 'Restaurant'}</Text>
          </View>
          <View style={[styles.statusPill, { borderColor: color }]}>
            <Ionicons name={icon} size={13} color={color} />
            <Text style={[styles.statusLabel, { color }]}>{item.status?.replace('_', ' ')}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.itemsWrap}>
          {item.items?.slice(0, 3).map((i: any, idx: number) => (
            <View key={idx} style={styles.itemRow}>
              {i.product?.image && (
                <Image source={{ uri: i.product.image }} style={styles.itemThumb} />
              )}
              <Text style={styles.itemText}>
                {i.quantity}× {i.product?.name || 'Item'}
              </Text>
            </View>
          ))}
          {item.items?.length > 3 && (
            <Text style={[styles.itemText, { marginLeft: 34 }]}>+{item.items.length - 3} more</Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.cardBottom}>
          <Text style={styles.totalText}>₹{item.totalAmount?.toFixed(2)}</Text>
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </Text>
        </View>

        {/* Status progress bar */}
        {item.status !== 'cancelled' && (
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {
              width: `${(['pending', 'preparing', 'ready', 'out_for_delivery', 'delivered'].indexOf(item.status) + 1) * 20}%`,
              backgroundColor: color
            }]} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.connBadge}>
          <View style={[styles.connDot, { backgroundColor: isConnected ? '#2ecc71' : '#666' }]} />
          <Text style={styles.connText}>{isConnected ? 'Live' : 'Offline'}</Text>
        </View>
      </View>

      {/* Date Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.filterInputGroup} onPress={() => setShowStartPicker(true)}>
          <Ionicons name="calendar-outline" size={16} color="#444" />
          <Text style={[styles.dateInput, !startDate && { color: '#333' }]}>
            {startDate ? startDate.toLocaleDateString() : 'Start Date'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterInputGroup} onPress={() => setShowEndPicker(true)}>
          <Text style={[styles.dateInput, !endDate && { color: '#333' }]}>
            {endDate ? endDate.toLocaleDateString() : 'End Date'}
          </Text>
        </TouchableOpacity>

        {(startDate || endDate) ? (
          <TouchableOpacity onPress={clearFilters} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={20} color="#e74c3c" />
          </TouchableOpacity>
        ) : null}
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          onChange={onStartChange}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="default"
          onChange={onEndChange}
        />
      )}

      {loading && page === 1 ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#f27f0d" size="large" />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item._id}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color="#f27f0d" style={{ marginVertical: 20 }} />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={70} color="#1C1C1C" />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>Your past and active orders will appear here</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  connBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  connDot: { width: 8, height: 8, borderRadius: 4 },
  connText: { color: '#777', fontSize: 12 },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: '#111',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1C1C1C',
    padding: 16,
    marginBottom: 14,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: { color: '#fff', fontSize: 15, fontWeight: '700' },
  restaurant: { color: '#666', fontSize: 12, marginTop: 3 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  statusLabel: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

  itemsWrap: { marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  itemThumb: { width: 26, height: 26, borderRadius: 6, marginRight: 8, backgroundColor: '#222' },
  itemText: { color: '#888', fontSize: 13 },

  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  totalText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  dateText: { color: '#555', fontSize: 12 },

  progressBar: {
    height: 4,
    backgroundColor: '#1A1A1A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },

  emptyContainer: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 40 },
  emptyTitle: { color: '#333', fontSize: 18, fontWeight: '700', marginTop: 20 },
  emptySubtitle: { color: '#2A2A2A', fontSize: 14, textAlign: 'center', marginTop: 8 },

  // Filter Styles
  filterBar: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A0A0A',
    marginHorizontal: 16, marginBottom: 12, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, gap: 8,
    borderWidth: 1, borderColor: '#1A1A1A'
  },
  filterInputGroup: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#000', borderRadius: 8, paddingHorizontal: 8, height: 32, borderWidth: 1, borderColor: '#1C1C1C' },
  dateInput: { flex: 1, color: '#fff', fontSize: 11 },
  clearBtn: { padding: 2 },
});
