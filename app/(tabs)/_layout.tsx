
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
        tabBarActiveTintColor: '#f27f0d',
        tabBarStyle: {
            backgroundColor: '#0F0F0F',
            borderTopColor: '#1A1A1A',
            height: 70,
            paddingBottom: 12,
            paddingTop: 8,
            borderTopWidth: 1
        },
        headerShown: false
    }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
         name="orders"
         options={{
             title: 'Orders',
             tabBarIcon: ({ color }) => <Ionicons name="receipt-outline" size={24} color={color} />,
         }}
      />
      <Tabs.Screen
         name="bookings"
         options={{
             title: 'Bookings',
             tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={24} color={color} />,
         }}
      />
      <Tabs.Screen
        name="profile"
        options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
            href: null,
        }} 
      />
      <Tabs.Screen
        name="cart"
        options={{
            href: null,
            tabBarStyle: { display: 'none' },
        }} 
      />
    </Tabs>
  );
}
