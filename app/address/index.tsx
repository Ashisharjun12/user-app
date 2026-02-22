import {
  View, StyleSheet, FlatList, TouchableOpacity,
  Alert, StatusBar, ActivityIndicator
} from 'react-native';
import { Typography } from '../../components/atoms/Typography';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import useAddressStore, { Address } from '../../store/addressStore';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const TITLE_ICONS: Record<string, any> = {
  home: 'home',
  work: 'briefcase',
  other: 'location',
};

export default function AddressList() {
  const router = useRouter();
  const { addresses, fetchAddresses, deleteAddress, setDefaultAddress, isLoading } = useAddressStore();

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSelect = async (item: Address) => {
    if (!item.isDefault) {
      await setDefaultAddress(item._id);
    }
    // Go back to wherever we came from (cart)
    router.back();
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Address', 'Remove this address?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => deleteAddress(id),
      },
    ]);
  };

  const getIcon = (title: string) =>
    TITLE_ICONS[title.toLowerCase()] || 'location';

  const renderItem = ({ item }: { item: Address }) => (
    <TouchableOpacity
      style={[styles.card, item.isDefault && styles.cardActive]}
      onPress={() => handleSelect(item)}
      activeOpacity={0.8}
    >
      {/* Left icon */}
      <View style={[styles.iconWrap, item.isDefault && styles.iconWrapActive]}>
        <Ionicons
          name={getIcon(item.title)}
          size={20}
          color={item.isDefault ? '#f27f0d' : '#888'}
        />
      </View>

      {/* Address info */}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Typography
            variant="h3"
            style={{ fontSize: 15 }}
            color={item.isDefault ? '#fff' : '#ccc'}
          >
            {item.title}
          </Typography>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Typography variant="caption" color="#f27f0d" style={{ fontSize: 10, fontWeight: '700' }}>
                DEFAULT
              </Typography>
            </View>
          )}
        </View>
        <Typography variant="caption" color="#666" numberOfLines={2} style={{ marginTop: 4 }}>
          {item.address}, {item.city}
        </Typography>
      </View>

      {/* Right actions */}
      <View style={styles.actions}>
        {item.isDefault ? (
          <Ionicons name="checkmark-circle" size={24} color="#f27f0d" />
        ) : (
          <View style={styles.radioEmpty} />
        )}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => handleDelete(item._id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={18} color="#e74c3c" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="location-outline" size={70} color="#2A2A2A" />
      <Typography variant="h3" color="#444" style={{ marginTop: 16 }}>
        No addresses yet
      </Typography>
      <Typography variant="caption" color="#333" style={{ marginTop: 8, textAlign: 'center' }}>
        Add your first delivery address to get started
      </Typography>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Typography variant="h3" style={{ fontSize: 18 }}>My Addresses</Typography>
        <View style={{ width: 38 }} />
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#f27f0d" size="large" />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add New Address FAB */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/address/add' as any)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Typography variant="h3" color="#fff" style={{ fontSize: 15 }}>
            Add New Address
          </Typography>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
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
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1C1C1C',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // List
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
  },
  cardActive: {
    borderColor: '#f27f0d',
    backgroundColor: 'rgba(242,127,13,0.07)',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#252525',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(242,127,13,0.15)',
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  defaultBadge: {
    borderWidth: 1,
    borderColor: '#f27f0d',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  // Right actions
  actions: {
    alignItems: 'center',
    marginLeft: 10,
    gap: 10,
  },
  radioEmpty: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333',
  },
  deleteBtn: {
    padding: 4,
  },

  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },

  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  addBtn: {
    backgroundColor: '#f27f0d',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    shadowColor: '#f27f0d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 7,
  },
});
