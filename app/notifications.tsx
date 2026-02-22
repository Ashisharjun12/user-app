import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useNotificationStore, { AppNotification } from '../store/notificationStore';

function timeAgo(date: string): string {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60)   return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
}

export default function Notifications() {
  const router = useRouter();
  const { 
    notifications, 
    fetchNotifications, 
    markRead, 
    markAllRead,
    hasMore,
    loading,
    page
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const renderItem = ({ item }: { item: AppNotification }) => {
    const isNew = !item.read;

    return (
      <TouchableOpacity
        style={[styles.card, isNew && styles.cardUnread]}
        onPress={() => {
          markRead(item.id);
          if (item.data?.orderId) {
            router.push('/(tabs)/orders');
          }
        }}
      >
        <View style={[
            styles.iconBox,
            item.type === 'alert' && { backgroundColor: 'rgba(255, 68, 68, 0.2)' },
            item.type === 'subscription' && { backgroundColor: 'rgba(34, 197, 94, 0.15)' }
        ]}>
          <Ionicons 
            name={
              item.type === 'order_status' ? 'receipt-outline' : 
              item.type === 'alert' ? 'alert-circle' : 
              item.type === 'subscription' ? 'ribbon-outline' :
              item.type === 'promotional' ? 'megaphone-outline' :
              'notifications-outline'
            } 
            size={22} 
            color={
                item.type === 'alert' ? '#FF4444' : 
                item.type === 'subscription' ? '#22c55e' :
                '#f27f0d'
            } 
          />
        </View>

        <View style={styles.content}>
          <View style={styles.cardHeader}>
            <Text style={styles.title} numberOfLines={1}>
                {item.type === 'alert' ? 'CRITICAL ALERT' : 
                 item.type === 'subscription' ? 'SUBSCRIPTION UPDATE' :
                 item.type === 'promotional' ? 'OFFER FOR YOU' :
                 item.type === 'order_status' ? 'ORDER UPDATE' :
                 'SYSTEM NOTIFICATION'}
            </Text>
            <Text style={styles.time}>{timeAgo(item.time)}</Text>
          </View>
          <Text style={styles.subTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.message}>{item.message || 'New message received.'}</Text>
        </View>

        {isNew && <View style={styles.dot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.clearAll}>Clear all</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onEndReached={() => {
          if (hasMore && !loading) {
            fetchNotifications(page + 1, true);
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading && page > 1 ? (
            <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator size="small" color="#f27f0d" />
            </View>
          ) : <View style={{ height: 40 }} />
        }
        ListEmptyComponent={
          loading && page === 1 ? (
            <View style={styles.empty}>
              <ActivityIndicator size="large" color="#f27f0d" />
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={60} color="#333" />
              <Text style={styles.emptyText}>Nothing here yet</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#121212' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1F1F1F',
  },
  closeBtn: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  clearAll: { color: '#f27f0d', fontSize: 13, fontWeight: '600' },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cardUnread: {
    borderColor: '#3E2D20',
    backgroundColor: '#241E19',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#3E2D20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: { flex: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: { color: '#fff', fontSize: 13, fontWeight: '900', flex: 1, marginRight: 8, letterSpacing: 0.5 },
  subTitle: { color: '#f27f0d', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  time: { color: '#888', fontSize: 11 },
  message: { color: '#aaa', fontSize: 13, lineHeight: 18 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f27f0d',
    marginLeft: 8,
    marginTop: 6
  },
  empty: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: '#333',
    fontSize: 14,
    marginTop: 16,
  }
});
