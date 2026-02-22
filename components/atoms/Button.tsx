import React from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from './Typography';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Button = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  loading = false, 
  disabled = false,
  style 
}: ButtonProps) => {
  return (
    <TouchableOpacity 
      style={[
        styles.base, 
        styles[variant], 
        disabled && styles.disabled, 
        style
      ]} 
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <React.Fragment>
            <ActivityIndicator color={variant === 'outline' ? '#f27f0d' : '#fff'} />
            <Typography 
                variant="button" 
                color={variant === 'outline' ? '#f27f0d' : '#fff'}
                style={{marginLeft: 10}}
            >
                Loading...
            </Typography>
        </React.Fragment>
      ) : (
        <Typography 
            variant="button" 
            color={variant === 'outline' ? '#f27f0d' : '#fff'}
        >
          {title}
        </Typography>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flexDirection: 'row',
  },
  primary: {
    backgroundColor: '#f27f0d', // Brand Orange
  },
  secondary: {
    backgroundColor: '#333',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#f27f0d',
  },
  disabled: {
    opacity: 0.6,
  },
});
