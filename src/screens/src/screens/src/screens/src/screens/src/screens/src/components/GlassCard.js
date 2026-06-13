import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function GlassCard({ children, style }) {
  return (
    <LinearGradient
      colors={['rgba(18, 26, 46, 0.6)', 'rgba(11, 17, 30, 0.8)']}
      style={[
        {
          borderRadius: 24,
          borderWidth: 1,
          borderColor: 'rgba(59, 130, 246, 0.2)',
          padding: 16,
          backdropFilter: 'blur(20px)',
        },
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );
}
