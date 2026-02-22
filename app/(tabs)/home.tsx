import { MainTemplate } from '../../components/templates/MainTemplate';
import { HomeHeader } from '../../components/organisms/HomeHeader';
import { Typography } from '../../components/atoms/Typography';
import { View, StyleSheet, TouchableOpacity, Image, ScrollView, RefreshControl, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import api from '../../api/api';
import { useRouter } from 'expo-router';
import useNotificationStore from '../../store/notificationStore';

// Debounce helper
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

export default function Home() {
  const { user, updateProfile } = useAuthStore();
  const router = useRouter();
  const { connect, disconnect, fetchNotifications } = useNotificationStore();
  
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [sponsors, setSponsors] = useState<any[]>([]);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (user?._id) {
        connect(user._id);
        fetchNotifications();
    }
    return () => disconnect();
  }, [user?._id]);

  useEffect(() => {
    if (user?.location && user?.address) {
        fetchRestaurants(1, true, user.location.lat, user.location.lng);
        fetchSponsors();
        setLoading(false);
        return;
    }

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        fetchRestaurants(1, true); 
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      
      // Reverse Geocode
      try {
          let geocode = await Location.reverseGeocodeAsync({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude
          });
          
          if (geocode.length > 0) {
              const g = geocode[0];
              const addr = `${g.street || g.name || ''}, ${g.city}`;
              // Also update profile if not already set to sync
              if (!user?.location) {
                  updateProfile({
                      location: { lat: loc.coords.latitude, lng: loc.coords.longitude },
                      address: addr,
                      locationEnabled: true
                  });
              }
          }
      } catch (e) {
          // Fallback handled by UI
      }


      fetchRestaurants(1, true, loc.coords.latitude, loc.coords.longitude);
      fetchSponsors();
    })();
  }, [user?.location?.lat, user?.location?.lng, user?.address]);

  // Effect for debounced search
  useEffect(() => {
      if (loading) return; // Skip first load if already fetching
      fetchRestaurants(1, true);
  }, [debouncedSearch]);

  const fetchSponsors = async () => {
      try {
          const res = await api.get('/users/sponsors');
          setSponsors(res.data);
      } catch (error) {
          console.error("Failed to fetch sponsors", error);
      }
  };



  const fetchRestaurants = async (pageNum: number, reset = false, lat: number | null = null, lng: number | null = null) => {
      if (!reset && (!hasMore || loadingMore)) return;

      if (reset) {
          setLoading(true);
          setPage(1);
      } else {
          setLoadingMore(true);
      }

      try {
          let url = `/users/restaurants?page=${pageNum}&limit=10`;
          
          if (searchQuery) {
              url += `&search=${encodeURIComponent(searchQuery)}`;
          }
          
          if (lat && lng) {
              url += `&lat=${lat}&lng=${lng}`;
          } else if (user?.location) {
               url += `&lat=${user.location.lat}&lng=${user.location.lng}`;
          } else if (location) {
               url += `&lat=${location.coords.latitude}&lng=${location.coords.longitude}`;
          }

          const res = await api.get(url);
          const newRestaurants = res.data.restaurants;
          const totalPages = res.data.totalPages;

          if (reset) {
              setRestaurants(newRestaurants);
          } else {
              setRestaurants(prev => [...prev, ...newRestaurants]);
          }

          setHasMore(pageNum < totalPages);
          setPage(pageNum);

      } catch (error) {
          console.error("Failed to fetch restaurants", error);
      } finally {
          setLoading(false);
          setLoadingMore(false);
          setRefreshing(false);
      }
  };

  const onRefresh = async () => {
      setRefreshing(true);
      fetchSponsors();
      if (user?.location) {
          await fetchRestaurants(1, true, user.location.lat, user.location.lng);
      } else if (location) {
          await fetchRestaurants(1, true, location.coords.latitude, location.coords.longitude);
      } else {
          await fetchRestaurants(1, true);
      }
  };

  const loadMore = () => {
      if (hasMore && !loadingMore && !loading) {
          fetchRestaurants(page + 1);
      }
  };


  const renderRestaurant = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={styles.restaurantCard} 
            onPress={() => item.isOpen !== false && router.push(`/restaurant/${item._id}`)}
            activeOpacity={item.isOpen === false ? 1 : 0.7}
        >
                <View style={[styles.imageContainer, item.isOpen === false && styles.imageContainerClosed]}>
                    <Image 
                        source={item.banner ? { uri: item.banner } : (item.image ? { uri: item.image } : require('../../assets/images/react-logo.png'))} 
                        style={[styles.cardImage, item.isOpen === false && styles.imageClosed]} 
                    />
                    
                    <View style={styles.cardHeader}>
                        {item.priority > 0 && (
                            <View style={styles.sponsoredTag}>
                                <Typography variant="caption" color="#fff" style={{fontWeight: '900', fontSize: 10}}>SPONSORED</Typography>
                            </View>
                        )}
                    </View>
                </View>
                
                {item.isOpen === false && (
                    <View style={styles.closedOverlay}>
                        <View style={styles.closedBadge}>
                            <Typography variant="caption" color="#fff" style={{fontWeight: 'bold'}}>CLOSED</Typography>
                        </View>
                    </View>
                )}
            
            <View style={styles.cardContent}>
                <Typography variant="h3" style={styles.restaurantName}>{item.restaurantName}</Typography>
                <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                    <Typography variant="caption" color="#888">30-40 mins • </Typography>
                    <Typography variant="caption" color="#f27f0d" style={{fontWeight: 'bold'}}>FREE DELIVERY</Typography>
                </View>
                <Typography variant="caption" color="#555" style={{marginTop: 2}}>Authentic Italian • Pizza • Pasta</Typography>
            </View>
        </TouchableOpacity>
  );

  const renderFooter = () => {
      if (!loadingMore) return <View style={{height: 50}} />;
      return (
          <View style={{ paddingVertical: 20 }}>
              <ActivityIndicator size="small" color="#f27f0d" />
          </View>
      );
  };

  const renderEmpty = () => {
      if (loading) return (
        <View style={{marginTop: 50, alignItems: 'center'}}>
            <ActivityIndicator size="large" color="#f27f0d" />
            <Typography variant="body" color="#888" style={{marginTop: 10}}>Finding best places...</Typography>
        </View>
      );
      
      return (
        <View style={{alignItems: 'center', marginTop: 50}}>
            <Ionicons name="sad-outline" size={60} color="#333" />
            <Typography variant="body" color="#888" style={{marginTop: 20}}>
                No restaurants found nearby.
            </Typography>
        </View>
      );
  };

  return (
    <MainTemplate scrollable={false} noPadding={true}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
          <FlatList
            data={restaurants}
            renderItem={renderRestaurant}
            keyExtractor={(item) => item._id}
            ListHeaderComponent={
              <HomeHeader 
                  address={user?.address || (user?.city || 'Select Location')}
                  sponsors={sponsors}
                  searchQuery={searchQuery}
                  onSearch={setSearchQuery}
              />
            }
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f27f0d" />}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
          />
      </View>
    </MainTemplate>
  );
}



const styles = StyleSheet.create({
  restaurantCard: {
      backgroundColor: '#0F0F0F',
      borderRadius: 28,
      marginBottom: 30,
      marginHorizontal: 12, 
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: '#1A1A1A',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 5
  },
  cardImage: {
      height: 220,
      width: '100%',
  },
  imageContainer: {
      height: 220,
      width: '100%',
      backgroundColor: '#111',
  },
  imageContainerClosed: {
      backgroundColor: '#222',
  },
  cardHeader: {
      position: 'absolute',
      top: 15,
      left: 15,
      right: 15,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 10
  },
  sponsoredTag: {
      backgroundColor: '#f27f0d',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)'
  },
  wishlistBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center'
  },
  infoBadge: {
      position: 'absolute',
      top: 15,
      left: 100,
      backgroundColor: 'rgba(0,0,0,0.7)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8
  },
  cardContent: {
      padding: 18,
      backgroundColor: '#0F0F0F'
  },
  restaurantName: {
      fontSize: 19,
      fontWeight: '900',
      letterSpacing: -0.5
  },
  ratingBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.05)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12
  },
  imageClosed: {
      opacity: 0.25,
  },
  closedOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 20
  },
  closedBadge: {
      backgroundColor: '#e74c3c',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)'
  }
});
