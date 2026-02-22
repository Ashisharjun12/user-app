import { Text, TextStyle, StyleSheet } from 'react-native';

interface TypographyProps {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'caption' | 'button';
  color?: string;
  style?: TextStyle;
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
}

export const Typography = ({ 
  children, 
  variant = 'body', 
  color = '#fff', 
  style, 
  align = 'left',
  numberOfLines
}: TypographyProps) => {
  return (
    <Text 
      style={[styles[variant], { color, textAlign: align }, style]}
      numberOfLines={numberOfLines}
    >
      {children}
    </Text>
  );
};


const styles = StyleSheet.create({
  h1: { fontSize: 32, fontWeight: 'bold' },
  h2: { fontSize: 24, fontWeight: 'bold' },
  h3: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: 'normal' },
  caption: { fontSize: 12, color: '#888' },
  button: { fontSize: 16, fontWeight: 'bold' },
});
