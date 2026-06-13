import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function GradientButton({ onPress, title, loading, colors, style }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={loading} activeOpacity={0.8}>
      <LinearGradient
        colors={colors || ['#3B82F6', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[{ borderRadius: 28, paddingVertical: 14, alignItems: 'center' }, style]}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}
