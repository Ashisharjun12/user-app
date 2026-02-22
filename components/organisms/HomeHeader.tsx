
import React from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../components/atoms/Typography';
import { useRouter } from 'expo-router';
import useNotificationStore from '../../store/notificationStore';

interface HomeHeaderProps {
    address: string;
    sponsors: any[];
    searchQuery: string;
    onSearch: (text: string) => void;
}

export const HomeHeader = ({ address, sponsors, searchQuery, onSearch }: HomeHeaderProps) => {
    const router = useRouter();
    const { unreadCount } = useNotificationStore();
    const [activeIdx, setActiveIdx] = React.useState(0);

    return (
        <View>
          {/* Top Bar */}
            <View style={[styles.header, { paddingHorizontal: 12 }]}>
                <View style={{flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 15}}>
                    <View style={styles.locationIconContainer}>
                         <Ionicons name="location" size={20} color="#f27f0d" />
                    </View>
                    <View style={{marginLeft: 12, flex: 1}}>
                        <Typography variant="caption" color="#f27f0d" style={{ textTransform: 'uppercase', fontWeight: '900', fontSize: 10 }}>Deliver to</Typography>
                        <TouchableOpacity style={styles.locationBtn} onPress={() => router.push('/location-picker')}>
                            <Typography variant="h3" color="#fff" numberOfLines={1} style={{flex: 1, fontWeight: '900'}}>
                                {address}
                            </Typography>
                            <Ionicons name="chevron-down" size={16} color="#f27f0d" style={{marginLeft: 4}} />
                        </TouchableOpacity>
                    </View>
                </View>
                <TouchableOpacity style={styles.notificationBtn} onPress={() => router.push('/notifications')}>
                    <Ionicons name="notifications" size={20} color="#f27f0d" />
                    {unreadCount > 0 && (
                        <View style={styles.badge} />
                    )}
                </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Ionicons name="search" size={20} color="#888" style={{marginHorizontal: 12}} />
                    <TextInput
                        placeholder="Search restaurants, cuisines..."
                        placeholderTextColor="#555"
                        style={styles.searchInput}
                        value={searchQuery}
                        onChangeText={onSearch}
                    />
                </View>
            </View>

            {/* Sponsor Carousel */}
            {sponsors.length > 0 ? (
                <View style={styles.carouselContainer}>
                    <ScrollView 
                        horizontal 
                        pagingEnabled 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 12 }}
                        onScroll={(e) => {
                            const x = e.nativeEvent.contentOffset.x;
                            const idx = Math.round(x / 330); // Approximate banner width
                            setActiveIdx(idx);
                        }}
                        scrollEventThrottle={16}
                    >
                        {sponsors.map((sponsor, index) => (
                            <View key={index} style={styles.bannerCard}>
                                <Image source={{ uri: sponsor.image }} style={styles.bannerImage} />
                                <View style={styles.sponsoredBadge}>
                                    <Typography variant="caption" color="#fff" style={{fontWeight: '900', fontSize: 8}}>SPONSORED</Typography>
                                </View>
                                <View style={styles.bannerOverlay}>
                                    <Typography variant="h2" color="#fff" style={styles.bannerTitle}>{sponsor.title}</Typography>
                                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                        <Typography variant="caption" color="#ccc" style={styles.bannerSubtitle}>{sponsor.subtitle}</Typography>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                    <View style={styles.paginationDots}>
                        {sponsors.map((_, i) => (
                            <View key={i} style={[styles.dot, activeIdx === i && styles.activeDot]} />
                        ))}
                    </View>
                </View>
            ) : (
                <View style={styles.noSponsorContainer}>
                    <Typography variant="caption" color="#444" style={{ fontStyle: 'italic' }}>
                        No sponsors this time...
                    </Typography>
                </View>
            )}

            {/* Featured Restaurants Header */}
            <View style={[styles.sectionHeader, { paddingHorizontal: 12 }]}>
                <Typography variant="h2" style={{fontSize: 20, fontWeight: '900'}}>Top Rated Restaurants</Typography>
                <TouchableOpacity>
                    <Ionicons name="options-outline" size={24} color="#f27f0d" />
                </TouchableOpacity>
            </View>
      </View>
    );
};



const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10
  },
  locationIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: 'rgba(242, 127, 13, 0.1)',
      justifyContent: 'center',
      alignItems: 'center'
  },
  locationBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2
  },
  notificationBtn: {
      width: 45,
      height: 45,
      borderRadius: 22.5,
      backgroundColor: '#1A1612',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#2A1F16'
  },
  badge: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#e74c3c',
      borderWidth: 1.5,
      borderColor: '#1A1612'
  },
  carouselContainer: {
      marginBottom: 30
  },
  searchContainer: {
      paddingHorizontal: 12,
      marginBottom: 25
  },
  searchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#0F0F0F',
      borderRadius: 16,
      height: 55,
      borderWidth: 1,
      borderColor: '#1A1A1A'
  },
  searchInput: {
      flex: 1,
      color: '#fff',
      fontSize: 16,
      fontWeight: '500'
  },
  bannerCard: {
      width: 340,
      height: 170,
      marginRight: 10,
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: '#222'
  },
  bannerImage: {
      width: '100%',
      height: '100%',
  },
  bannerOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 16,
      backgroundColor: 'rgba(0,0,0,0.5)', // Slightly darker but more localized to the bottom
      height: '45%', // Reduced height of the shadow/overlay
      justifyContent: 'flex-end'
  },
  sponsoredBadge: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: 'rgba(242, 127, 13, 0.95)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      zIndex: 10
  },
  bannerTitle: {
      fontSize: 24,
      fontWeight: '900',
      marginBottom: 2,
      letterSpacing: -0.5,
      textShadowColor: 'rgba(0, 0, 0, 0.75)',
      textShadowOffset: {width: -1, height: 1},
      textShadowRadius: 10
  },
  bannerSubtitle: {
      fontSize: 13,
      fontWeight: '600',
      color: '#eee'
  },
  paginationDots: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 12
  },
  dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#333',
      marginHorizontal: 3
  },
  activeDot: {
      width: 18,
      backgroundColor: '#f27f0d'
  },
  noSponsorContainer: {
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
      marginHorizontal: 12,
      borderWidth: 1,
      borderColor: '#1A1A1A',
      borderRadius: 16,
      borderStyle: 'dashed'
  },
  sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20
  }
});
