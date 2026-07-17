import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';

interface NuraLogoProps {
  size?: number;
  showText?: boolean;
  textColor?: string;
  subTextColor?: string;
}

export default function NuraLogo({
  size = 80,
  showText = false,
  textColor = '#1A2332',
  subTextColor = '#5A6B7E'
}: NuraLogoProps) {
  // Scale factor based on base size 100
  const scale = size / 100;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <G>
          {/* Left Turquoise Heart Curve */}
          <Path
            d="M 50 25 C 40 10, 10 10, 10 40 C 10 65, 35 80, 50 90"
            fill="none"
            stroke="#00a49a"
            strokeWidth="6"
            strokeLinecap="round"
          />

          {/* Right Leaf Curve (creating the right half of the heart) */}
          <Path
            d="M 50 25 C 65 10, 90 20, 90 45 C 90 65, 70 80, 50 90"
            fill="#e6f6f5"
            stroke="#00a49a"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Leaf Inner Accent Line */}
          <Path
            d="M 50 25 Q 68 40, 50 90"
            fill="none"
            stroke="#00a49a"
            strokeWidth="2"
            strokeDasharray="2 3"
          />

          {/* Smiling Baby Face inside the Leaf */}
          <G transform="translate(68, 43)">
            {/* Baby head outline (subtle background) */}
            <Circle cx="0" cy="0" r="14" fill="#ffffff" stroke="#00a49a" strokeWidth="2.5" />
            {/* Eye Left */}
            <Path d="M -7 -2 Q -5 -5, -3 -2" fill="none" stroke="#00a49a" strokeWidth="2" strokeLinecap="round" />
            {/* Eye Right */}
            <Path d="M 3 -2 Q 5 -5, 7 -2" fill="none" stroke="#00a49a" strokeWidth="2" strokeLinecap="round" />
            {/* Smile */}
            <Path d="M -5 3 Q 0 8, 5 3" fill="none" stroke="#00a49a" strokeWidth="2.5" strokeLinecap="round" />
          </G>

          {/* Red/Coral Heartbeat Pulse Line */}
          <Path
            d="M 5 45 L 35 45 L 42 30 L 48 58 L 54 41 L 62 45 L 67 45"
            fill="none"
            stroke="#e8635a"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      </Svg>
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: textColor, fontSize: 26 * scale }]}>NURA</Text>
          <Text style={[styles.subtitle, { color: subTextColor, fontSize: 10 * scale }]}>
            Nutrisi dan Urgensi Remaja-Anak
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  title: {
    fontWeight: '800',
    letterSpacing: 2,
  },
  subtitle: {
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
