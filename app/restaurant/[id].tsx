
import { View, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Dimensions, FlatList, Modal, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../../components/atoms/Typography';
import api, { getRestaurantReviews } from '../../api/api';
import useCartStore from '../../store/cartStore';

const { width, height } = Dimensions.get('window');
const COLUMN_count = 2;
const GAP = 15;
const ITEM_WIDTH = (width - 40 - GAP) / COLUMN_count; // 40 is padding (20 left + 20 right)

export default function RestaurantDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showVegOnly, setShowVegOnly] = useState(false);
  
  // Menu Pagination State
  const [menu, setMenu] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true); // Initial load (Restaurant + First Page)
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(false); // For filter changes

  // Reviews State
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState({ rating: 0, count: 0 });
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Modal & Cart State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const { cart, addItem, incrementItem, decrementItem, total } = useCartStore();

  // Helper: get current quantity of a product in the cart
  const getCartQty = (productId: string) => {
      const found = cart.find(i => i._id === productId);
      return found ? found.quantity : 0;
  };

  const fetchRestaurantDetails = async () => {
    try {
        const res = await api.get(`/users/restaurants/${id}`);
        setRestaurant(res.data);
    } catch (error) {
        console.error(error);
    }
  };

  const fetchCategories = async () => {
      try {
          const res = await api.get(`/users/restaurants/${id}/categories`);
          setCategories(res.data);
      } catch (error) {
          console.error("Failed to fetch categories", error);
      }
  };

  const fetchMenu = async (pageNum: number, reset = false) => {
    if (!reset && (!hasMore || loadingMore)) return;

    if (reset) {
        setLoadingMenu(true);
        setPage(1);
    } else {
        setLoadingMore(true);
    }

    try {
        let url = `/users/restaurants/${id}/menu?page=${pageNum}&limit=12`;
        if (selectedCategory) url += `&category=${selectedCategory}`;
        if (showVegOnly) url += `&isVeg=true`;

        const res = await api.get(url);
        const newProducts = res.data.products;
        const totalPages = res.data.totalPages;

        if (reset) {
            setMenu(newProducts);
        } else {
            setMenu(prev => [...prev, ...newProducts]);
        }

        setHasMore(pageNum < totalPages);
        setPage(pageNum);

    } catch (error) {
        console.error("Failed to fetch menu", error);
    } finally {
        setLoadingMenu(false);
        setLoadingMore(false);
        if (reset) setLoading(false);
    }
  };

  const fetchReviews = async () => {
    setLoadingReviews(true);
    try {
        const res = await getRestaurantReviews(id as string, { limit: 5 });
        setReviews(res.data.reviews || []);
        setReviewStats({
            rating: res.data.reviews?.length > 0 
                ? res.data.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / res.data.reviews.length 
                : 0,
            count: res.data.totalReviews || 0
        });
    } catch (error) {
        console.error("Failed to fetch reviews", error);
    } finally {
        setLoadingReviews(false);
    }
  };

  useEffect(() => {
      (async () => {
          await Promise.all([fetchRestaurantDetails(), fetchCategories(), fetchReviews()]);
          fetchMenu(1, true);
      })();
  }, [id]);

  useEffect(() => {
      // Refetch menu when filters change
      fetchMenu(1, true);
  }, [selectedCategory, showVegOnly]);

  const loadMore = () => {
      if (hasMore && !loadingMore && !loadingMenu) {
          fetchMenu(page + 1);
      }
  };

  const handleAddToCart = (item: any) => {
      if (restaurant?.isOpen === false) return;
      addItem({
          ...item,
          restaurantId: id // Ensure we link item to current restaurant
      });
  };

  const renderProductModal = () => (
      <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedProduct}
          onRequestClose={() => setSelectedProduct(null)}
      >
          <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                    <View style={styles.modalImageContainer}>
                         <Image 
                            source={selectedProduct?.image ? { uri: selectedProduct.image } : require('../../assets/images/react-logo.png')} 
                            style={styles.modalImage} 
                        />
                        <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedProduct(null)}>
                            <Ionicons name="close" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalBody}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10}}>
                             <View style={{flex: 1}}>
                                <Typography variant="h2" style={{fontSize: 22, height: 'auto'}}>{selectedProduct?.name}</Typography>
                                <Typography variant="caption" color="#888" style={{marginTop: 4}}>{selectedProduct?.category?.name || 'Category'}</Typography>
                             </View>
                             <Typography variant="h2" color="#f27f0d" style={{fontSize: 22}}>₹{selectedProduct?.price}</Typography>
                        </View>

                        <Typography variant="body" color="#ccc" style={{marginBottom: 20, lineHeight: 22}}>
                            {selectedProduct?.description || "No description available for this delicious item. Give it a try!"}
                        </Typography>

                        <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 30}}>
                             {selectedProduct?.isVeg !== undefined && (
                                <View style={{flexDirection: 'row', alignItems: 'center', marginRight: 15}}>
                                    <Ionicons 
                                        name={selectedProduct.isVeg ? "radio-button-on" : "triangle"} 
                                        size={16} 
                                        color={selectedProduct.isVeg ? "#2ecc71" : "#e74c3c"} 
                                        style={{marginRight: 6}}
                                    />
                                    <Typography variant="body" color={selectedProduct.isVeg ? "#2ecc71" : "#e74c3c"}>
                                        {selectedProduct.isVeg ? "Veg" : "Non-Veg"}
                                    </Typography>
                                </View>
                            )}
                        </View>

                        {getCartQty(selectedProduct?._id) > 0 ? (
                            <View style={styles.modalQtyRow}>
                                <TouchableOpacity
                                    style={styles.modalQtyBtn}
                                    onPress={() => decrementItem(selectedProduct._id)}
                                >
                                    <Ionicons name="remove" size={22} color="#fff" />
                                </TouchableOpacity>
                                <Typography variant="h3" color="#fff" style={{marginHorizontal: 24, fontSize: 20}}>
                                    {getCartQty(selectedProduct._id)}
                                </Typography>
                                <TouchableOpacity
                                    style={styles.modalQtyBtn}
                                    onPress={() => incrementItem(selectedProduct._id)}
                                >
                                    <Ionicons name="add" size={22} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity 
                                style={[styles.modalAddButton, restaurant?.isOpen === false && { backgroundColor: '#333' }]}
                                onPress={() => {
                                    if (restaurant?.isOpen === false) return;
                                    handleAddToCart(selectedProduct);
                                    setSelectedProduct(null);
                                }}
                                disabled={restaurant?.isOpen === false}
                            >
                                <Typography variant="h3" color={restaurant?.isOpen === false ? "#888" : "#fff"}>
                                    {restaurant?.isOpen === false ? "Currently Closed" : `Add to Cart - ₹${selectedProduct?.price}`}
                                </Typography>
                            </TouchableOpacity>
                        )}
                    </View>
              </View>
          </View>
      </Modal>
  );

  const renderMenuCard = ({ item }: { item: any }) => {
      const qty = getCartQty(item._id);
      return (
          <TouchableOpacity 
            style={styles.menuCard}
            onPress={() => setSelectedProduct(item)}
            activeOpacity={0.8}
          >
              <View style={[styles.menuImageContainer, restaurant?.isOpen === false && { backgroundColor: '#444' }]}>
                  <Image 
                    source={item.image ? { uri: item.image } : require('../../assets/images/react-logo.png')} 
                    style={[styles.menuCardImage, restaurant?.isOpen === false && styles.imageClosed]} 
                  />
                  
                  {qty > 0 ? (
                      // Qty stepper — shown when item is already in cart
                      <View style={styles.qtyControl}>
                          <TouchableOpacity
                              style={styles.qtyBtn}
                              onPress={(e: any) => { e.stopPropagation(); decrementItem(item._id); }}
                          >
                              <Ionicons name="remove" size={14} color="#fff" />
                          </TouchableOpacity>
                          <Typography variant="caption" color="#fff" style={styles.qtyText}>{qty}</Typography>
                          <TouchableOpacity
                              style={styles.qtyBtn}
                              onPress={(e: any) => { e.stopPropagation(); incrementItem(item._id); }}
                          >
                              <Ionicons name="add" size={14} color="#fff" />
                          </TouchableOpacity>
                      </View>
                  ) : (
                      // Plain + button — shown when not in cart
                      <TouchableOpacity 
                          style={[styles.addButton, restaurant?.isOpen === false && { backgroundColor: '#444' }]}
                          onPress={(e: any) => {
                              e.stopPropagation();
                              if (restaurant?.isOpen === false) return;
                              handleAddToCart(item);
                          }}
                          disabled={restaurant?.isOpen === false}
                      >
                          <Ionicons name={restaurant?.isOpen === false ? "lock-closed" : "add"} size={16} color={restaurant?.isOpen === false ? "#888" : "#fff"} />
                      </TouchableOpacity>
                  )}
              </View>
              
              <View style={styles.menuCardInfo}>
                  <Typography variant="h3" style={{fontSize: 14, marginBottom: 4}} numberOfLines={1}>{item.name}</Typography>
                  
                  <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                       <Typography variant="body" color="#f27f0d" style={{fontWeight: 'bold'}}>₹{item.price}</Typography>
                       {item.isVeg !== undefined && (
                            <Ionicons 
                                name={item.isVeg ? "radio-button-on" : "triangle"} 
                                size={10} 
                                color={item.isVeg ? "#2ecc71" : "#e74c3c"} 
                                style={{ 
                                    borderWidth: 1, 
                                    borderColor: item.isVeg ? "#2ecc71" : "#e74c3c", 
                                    padding: 1, 
                                    borderRadius: 2
                                }} 
                            />
                       )}
                  </View>
              </View>
          </TouchableOpacity>
      );
  };

  const renderHeader = () => (
      <View>
            <View style={[styles.imageContainer, restaurant?.isOpen === false && { backgroundColor: '#444' }]}>
                <Image 
                    source={restaurant?.banner ? { uri: restaurant.banner } : (restaurant?.image ? { uri: restaurant.image } : require('../../assets/images/react-logo.png'))} 
                    style={[styles.banner, restaurant?.isOpen === false && styles.imageClosed]} 
                />
                <View style={styles.overlay} />
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                 <TouchableOpacity style={styles.favoriteButton}>
                    <Ionicons name="heart-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.infoContainer}>
                <View style={styles.headerRow}>
                    <View style={{flex: 1}}>
                        <Typography variant="h1" style={{fontSize: 24}}>{restaurant?.restaurantName || "Restaurant Name"}</Typography>
                         <View style={styles.ratingBadge}>
                             <Ionicons name="star" size={12} color="#000" style={{marginRight: 4}} />
                            <Typography variant="caption" color="#000" style={{fontWeight: 'bold'}}>
                                {reviewStats.rating > 0 ? reviewStats.rating.toFixed(1) : 'New'} ({reviewStats.count}+ Reviews)
                            </Typography>
                        </View>
                    </View>
                </View>

                 <View style={styles.metaRow}>
                    <View style={styles.metaBadge}>
                        <Ionicons name="time-outline" size={14} color="#fff" style={{marginRight: 4}} />
                        <Typography variant="caption" color="#fff">15-25 min</Typography>
                    </View>
                     <Typography variant="caption" color="#f27f0d" style={{fontWeight: 'bold', marginLeft: 10, letterSpacing: 1, fontSize: 10}}>EXCLUSIVE FREE DELIVERY</Typography>
                </View>

                {restaurant?.isOpen === false && (
                    <View style={styles.persistentClosedBanner}>
                        <Ionicons name="alert-circle" size={18} color="#fff" style={{marginRight: 8}} />
                        <Typography variant="body" color="#fff" style={{fontWeight: 'bold', fontSize: 14}}>
                            RESTAURANT IS CURRENTLY CLOSED
                        </Typography>
                    </View>
                )}

                {/* Categories */}
                <FlatList 
                    horizontal 
                    data={[{_id: 'all', name: 'All'}, ...categories]}
                    keyExtractor={(item: any) => item._id}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{paddingRight: 20, marginBottom: 20, marginTop: 20}}
                    renderItem={({item}: {item: any}) => (
                        <TouchableOpacity 
                          style={[styles.categoryChip, (selectedCategory === item._id || (item._id === 'all' && !selectedCategory)) && styles.categoryChipActive]}
                          onPress={() => setSelectedCategory(item._id === 'all' ? null : item._id)}
                        >
                            <Typography 
                                variant="caption" 
                                color={(selectedCategory === item._id || (item._id === 'all' && !selectedCategory)) ? "#fff" : "#888"} 
                                style={{fontWeight: 'bold'}}
                            >
                                {item.name}
                            </Typography>
                        </TouchableOpacity>
                    )}
                />


                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10}}>
                  <Typography variant="h2" style={{fontSize: 20}}>Popular Choices</Typography>
                  <TouchableOpacity 
                    onPress={() => setShowVegOnly(!showVegOnly)}
                    style={{flexDirection: 'row', alignItems: 'center', backgroundColor: showVegOnly ? '#2ecc71' : '#333', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20}}
                  >
                      <Ionicons name="leaf" size={14} color="#fff" style={{marginRight: 5}} />
                      <Typography variant="caption" color="#fff" style={{fontWeight: 'bold'}}>Veg Only</Typography>
                  </TouchableOpacity>
                </View>
            </View>
      </View>
  );

  const renderFooter = () => {
      if (loadingMore) {
          return <ActivityIndicator size="small" color="#f27f0d" style={{marginVertical: 20}} />;
      }
      return <View style={{height: 100}} />; // Bottom spacing
  };

  const renderEmpty = () => {
      if (loadingMenu) return <ActivityIndicator size="large" color="#f27f0d" style={{marginTop: 50}} />;
      return (
          <Typography variant="body" color="#888" style={{width: '100%', textAlign: 'center', marginTop: 20}}>
              No items available.
          </Typography>
      );
  };

  if (loading && !restaurant) {
      return (
          <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#f27f0d" />
          </View>
      );
  }

  if (!restaurant && !loading) {
      return (
          <View style={styles.container}>
              <Typography variant="h3" color="#fff">Restaurant not found</Typography>
          </View>
      );
  }

  return (
    <View style={styles.container}>
        <FlatList
            data={menu}
            renderItem={renderMenuCard}
            keyExtractor={(item) => item._id}
            numColumns={2}
            columnWrapperStyle={{justifyContent: 'space-between', paddingHorizontal: 20}}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{backgroundColor: '#111', paddingBottom: 20}}
        />

        {renderProductModal()}

        {restaurant?.isOpen === false && (
            <View style={styles.listDimOverlay} pointerEvents="none" />
        )}

        {/* Cart Float Button */}
        {cart.length > 0 && (
            <View style={styles.cartBarContainer}>
                <TouchableOpacity onPress={() => router.push('/(tabs)/cart')} style={styles.cartBar}>
                    <View style={styles.cartCountBadge}>
                        <Typography variant="caption" color="#fff" style={{fontWeight: 'bold'}}>{cart.length}</Typography>
                    </View>
                    <Typography variant="h3" color="#fff" style={{flex: 1, marginLeft: 15}}>View Cart</Typography>
                    <Typography variant="h3" color="#fff">₹{total}</Typography>
                </TouchableOpacity>
            </View>
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000'
  },
  loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000'
  },
  imageContainer: {
      height: 300,
      width: '100%',
      position: 'relative'
  },
  banner: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover'
  },
  overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.3)'
  },
  backButton: {
      position: 'absolute',
      top: 50,
      left: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      backdropFilter: 'blur(10px)'
  },
  favoriteButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      backdropFilter: 'blur(10px)'
  },
  infoContainer: {
      backgroundColor: '#111',
      marginTop: -40,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      padding: 20,
      minHeight: 200 // Reduced minHeight since it's now part of the list header
  },
  headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10
  },
  ratingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FFC107',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
      marginTop: 8,
      alignSelf: 'flex-start'
  },
  metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10
  },
  metaBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#333',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20
  },
  // Categories
  categoryChip: {
      alignItems: 'center',
      marginRight: 10,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: '#333',
      borderWidth: 1,
      borderColor: '#333'
  },
  categoryChipActive: {
      backgroundColor: '#f27f0d',
      borderColor: '#f27f0d'
  },
  // Menu Grid
  menuCard: {
      width: ITEM_WIDTH,
      backgroundColor: '#1E1E1E',
      borderRadius: 20,
      marginBottom: 20,
      overflow: 'hidden'
  },
  menuImageContainer: {
      height: 120,
      width: '100%',
      position: 'relative'
  },
  menuCardImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover'
  },
  imageClosed: {
      opacity: 0.2,
  },
  addButton: {
      position: 'absolute',
      bottom: 10,
      right: 10,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#f27f0d',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 4
  },
  menuCardInfo: {
      padding: 12
  },
  // Cart Bar
  cartBarContainer: {
      position: 'absolute',
      bottom: 30,
      left: 20,
      right: 20
  },
  cartBar: {
      backgroundColor: '#f27f0d',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderRadius: 25,
      shadowColor: '#f27f0d',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 8
  },
  cartCountBadge: {
      backgroundColor: 'rgba(255,255,255,0.3)',
      width: 30,
      height: 30,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center'
  },
  // Modal Styles
  modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.8)'
  },
  modalContent: {
      backgroundColor: '#1E1E1E',
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      height: '80%',
      overflow: 'hidden'
  },
  modalImageContainer: {
      height: 300,
      width: '100%',
      position: 'relative'
  },
  modalImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover'
  },
  closeButton: {
      position: 'absolute',
      top: 20,
      right: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#fff',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 5
  },
  modalBody: {
      padding: 20,
      flex: 1
  },
  modalAddButton: {
      backgroundColor: '#f27f0d',
      paddingVertical: 15,
      borderRadius: 15,
      alignItems: 'center',
      marginTop: 'auto' // Push to bottom
  },
  // Qty stepper on menu cards
  qtyControl: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f27f0d',
      borderRadius: 20,
      paddingHorizontal: 4,
      paddingVertical: 2,
  },
  qtyBtn: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(0,0,0,0.25)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  qtyText: {
      marginHorizontal: 6,
      fontWeight: 'bold' as const,
      minWidth: 14,
      textAlign: 'center' as const,
  },
  // Qty stepper inside modal
  modalQtyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f27f0d',
      borderRadius: 15,
      paddingVertical: 12,
      marginTop: 'auto' as any,
  },
  modalQtyBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.2)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  persistentClosedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#e74c3c',
      paddingVertical: 12,
      borderRadius: 12,
      marginTop: 15,
      marginBottom: 5,
  },
  listDimOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.25)',
      zIndex: 5,
      marginTop: 400,
  },
  // Reviews Section Styles
  reviewsSection: {
      marginBottom: 20
  },
  sectionTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15
  },
  seeAllReviews: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4
  },
  reviewCard: {
      width: 200,
      backgroundColor: '#1A1A1A',
      borderRadius: 15,
      padding: 12,
      borderWidth: 1,
      borderColor: '#222'
  },
  reviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 8
  },
  reviewAvatar: {
      width: 30,
      height: 30,
      borderRadius: 15
  },
  reviewStars: {
      flexDirection: 'row',
      gap: 2
  },
  reviewComment: {
      fontSize: 11,
      lineHeight: 16,
      fontStyle: 'italic'
  }
});
