import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MainTemplateProps {
  children: React.ReactNode;
  noPadding?: boolean;
  scrollable?: boolean;
}

export const MainTemplate = ({ children, noPadding = false, scrollable = true }: MainTemplateProps) => {
  const Content = (
    <View style={[styles.content, noPadding && styles.noPadding]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {scrollable ? (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {Content}
        </ScrollView>
      ) : (
        Content
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Dark theme base
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  noPadding: {
    padding: 0,
  },
});
