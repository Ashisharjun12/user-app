
import { MainTemplate } from '../components/templates/MainTemplate';
import { Typography } from '../components/atoms/Typography';
import { View, StyleSheet, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import api from '../api/api';
import { useRouter } from 'expo-router';

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
        const res = await api.get('/admin/categories?limit=100'); // Fetch all
        setCategories(res.data.categories || []);
    } catch (error) {
        console.error("Failed to fetch categories", error);
    } finally {
        setLoading(false);
    }
  };

  const renderCategory = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.categoryItem} onPress={() => { /* Navigate to category specific results later */ }}>
        <View style={styles.iconContainer}>
            <Image source={{ uri: item.image }} style={styles.icon} />
        </View>
        <Typography variant="body" style={{marginTop: 10, textAlign: 'center'}}>{item.name}</Typography>
    </TouchableOpacity>
  );

  return (
    <MainTemplate>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={{padding: 5}}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Typography variant="h2" style={{marginLeft: 15}}>All Categories</Typography>
        </View>

        {loading ? (
            <ActivityIndicator size="large" color="#f27f0d" style={{marginTop: 50}} />
        ) : (
            <FlatList 
                data={categories}
                renderItem={renderCategory}
                keyExtractor={(item) => item._id}
                numColumns={3}
                contentContainerStyle={{paddingBottom: 50}}
                columnWrapperStyle={{justifyContent: 'space-between', marginBottom: 20}}
            />
        )}
    </MainTemplate>
  );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingTop: 10
    },
    categoryItem: {
        width: '30%',
        alignItems: 'center',
        marginBottom: 10
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#1E1E1E',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333'
    },
    icon: {
        width: 50,
        height: 50,
        resizeMode: 'contain'
    }
});
