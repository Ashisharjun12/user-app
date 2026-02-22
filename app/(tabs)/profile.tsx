import {
  View, StyleSheet, Image, TouchableOpacity,
  ScrollView, Switch, StatusBar, Alert, Platform
} from 'react-native';
import { Typography } from '../../components/atoms/Typography';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../store/authStore';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Reusable menu row ───────────────────────────────────────────────────────
interface MenuRowProps {
  icon: any;
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
}
const MenuRow = ({ icon, label, onPress, right, danger }: MenuRowProps) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={[styles.rowIcon, danger && styles.rowIconDanger]}>
      <Ionicons name={icon} size={18} color={danger ? '#e74c3c' : '#f27f0d'} />
    </View>
    <Typography
      variant="body"
      color={danger ? '#e74c3c' : '#ddd'}
      style={styles.rowLabel}
    >
      {label}
    </Typography>
    {right ? (
      right
    ) : onPress ? (
      <Ionicons name="chevron-forward" size={18} color="#444" />
    ) : null}
  </TouchableOpacity>
);

const SectionHeader = ({ title }: { title: string }) => (
  <Typography variant="caption" color="#f27f0d" style={styles.sectionHeader}>
    {title}
  </Typography>
);

// ─── Main component ──────────────────────────────────────────────────────────
export default function Profile() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login' as any);
        },
      },
    ]);
  };

  const avatar = user?.image
    ? { uri: user.image }
    : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=f27f0d&color=fff&size=200` };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header bar */}
      <View style={styles.headerBar}>
        <Typography variant="h3" style={{ fontSize: 18 }}>Profile</Typography>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push('/setup-profile' as any)}
        >
          <Ionicons name="settings-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Avatar + Name ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <Image source={avatar} style={styles.avatar} />
            <TouchableOpacity
              style={styles.editBadge}
              onPress={() => router.push('/setup-profile' as any)}
            >
              <Ionicons name="pencil" size={12} color="#fff" />
            </TouchableOpacity>
          </View>
          <Typography variant="h2" style={{ fontSize: 22, marginTop: 14, fontWeight: '700' }}>
            {user?.name || 'Your Name'}
          </Typography>
          <Typography variant="caption" color="#f27f0d" style={{ marginTop: 4 }}>
            {user?.email || user?.phone || ''}
          </Typography>
        </View>

        {/* ── ACCOUNT ── */}
        <SectionHeader title="ACCOUNT" />
        <View style={styles.card}>
          <MenuRow
            icon="receipt-outline"
            label="My Orders"
            onPress={() => router.push('/(tabs)/orders' as any)}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="location-outline"
            label="Saved Addresses"
            onPress={() => router.push('/address' as any)}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="card-outline"
            label="Payment Methods"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <MenuRow
            icon="notifications-outline"
            label="Notifications"
            right={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: '#2A2A2A', true: '#f27f0d' }}
                thumbColor="#fff"
                ios_backgroundColor="#2A2A2A"
              />
            }
          />
        </View>

        {/* ── SETTINGS ── */}
        <SectionHeader title="SETTINGS" />
        <View style={styles.card}>
          <MenuRow
            icon="moon-outline"
            label="Dark Mode"
            right={
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#2A2A2A', true: '#f27f0d' }}
                thumbColor="#fff"
                ios_backgroundColor="#2A2A2A"
              />
            }
          />
          <View style={styles.divider} />
          <MenuRow
            icon="globe-outline"
            label="Language"
            right={
              <Typography variant="caption" color="#888">
                English
              </Typography>
            }
            onPress={() => {}}
          />
        </View>

        {/* ── MORE ── */}
        <SectionHeader title="MORE" />
        <View style={styles.card}>
          <MenuRow
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => {}}
          />
        </View>

        {/* ── Logout ── */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
          <Typography variant="h3" color="#fff" style={{ fontSize: 16 }}>
            Logout
          </Typography>
        </TouchableOpacity>

        {/* App version */}
        <Typography variant="caption" color="#333" style={styles.version}>
          App Version 1.0.0
        </Typography>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  // Header bar
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#1C1C1C',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  avatarWrap: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#f27f0d',
    backgroundColor: '#1A1A1A',
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f27f0d',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },

  // Section header
  sectionHeader: {
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: '#111',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1C1C1C',
    marginBottom: 20,
    overflow: 'hidden',
  },

  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(242,127,13,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rowIconDanger: {
    backgroundColor: 'rgba(231,76,60,0.12)',
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#1C1C1C',
    marginHorizontal: 16,
  },

  // Logout
  logoutBtn: {
    backgroundColor: '#1A1A1A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f27f0d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginTop: 4,
    marginBottom: 20,
  },

  // Version
  version: {
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
