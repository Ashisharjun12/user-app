import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MainTemplate } from '../../components/templates/MainTemplate';
import { Typography } from '../../components/atoms/Typography';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Bookings() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#f27f0d" />
        </TouchableOpacity>
        <Typography variant="h3" style={styles.headerTitle}>Booking</Typography>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Ionicons name="calendar-outline" size={100} color="#f27f0d" />
        </View>
        <Typography variant="h2" style={{ marginTop: 30, fontSize: 24, fontWeight: '900' }}>Coming Soon</Typography>
        <Typography variant="body" color="#888" style={{ marginTop: 15, textAlign: 'center', maxWidth: '80%', lineHeight: 22 }}>This feature is coming soon. Stay tuned for table reservations and event bookings!</Typography>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#000'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#1A1A1A'
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: '#fff'
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    iconContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(242, 127, 13, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(242, 127, 13, 0.1)'
    }
});
