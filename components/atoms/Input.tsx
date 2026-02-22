import { TextInput, View, StyleSheet, TextInputProps } from 'react-native';
import { Typography } from './Typography';
import { Ionicons } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  prefix?: string;
}

export const Input = ({ label, icon, error, prefix, style, ...props }: InputProps) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Typography variant="caption" style={styles.label}>{label}</Typography>}
      
      <View style={[styles.inputWrapper, error ? styles.errorBorder : null]}>
        {icon && <Ionicons name={icon} size={20} color="#888" style={styles.icon} />}
        {prefix && (
            <Typography variant="body" color="#888" style={{marginRight: 5}}>{prefix}</Typography>
        )}
        <TextInput 
          style={styles.input} 
          placeholderTextColor="#666" 
          {...props} 
        />
      </View>
      
      {error && <Typography variant="caption" color="#FF5252" style={styles.error}>{error}</Typography>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
    width: '100%',
  },
  label: {
    marginBottom: 8,
    marginLeft: 4,
    color: '#ccc',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 15,
    height: 55,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    height: '100%',
  },
  icon: {
    marginRight: 10,
  },
  errorBorder: {
    borderColor: '#FF5252',
  },
  error: {
    marginTop: 5,
    marginLeft: 4,
  },
});
