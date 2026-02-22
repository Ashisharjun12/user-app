import { View, StyleSheet } from 'react-native';
import { MainTemplate } from '../../components/templates/MainTemplate';
import { Typography } from '../../components/atoms/Typography';
import { Ionicons } from '@expo/vector-icons';

export default function Menu() {
  return (
    <MainTemplate>
        <View style={styles.container}>
            <Ionicons name="restaurant-outline" size={80} color="#333" />
            <Typography variant="h2" style={{marginTop: 20}}>Menu & Explore</Typography>
            <Typography variant="body" color="#888" style={{marginTop: 10, textAlign: 'center'}}>
                Browse categories and discover new dishes here.
            </Typography>
        </View>
    </MainTemplate>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    }
});
