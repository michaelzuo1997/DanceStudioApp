import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

/**
 * Minimalist Logo component for Dance Studio App
 * 
 * Design: Refined minimal - abstract dancer mark with warm clay accent
 * 
 * Usage:
 *   <Logo size="md" showText={true} />
 *   <Logo size="lg" showText={false} />
 */
export function Logo({ size = 'md', showText = true, style }) {
  const s = SIZES[size] || SIZES.md;

  return (
    <View style={[styles.container, style]}>
      {/* Logo Mark */}
      <View style={[styles.mark, { width: s.mark, height: s.mark, borderRadius: s.markRadius }]}>
        {/* Abstract dancer - simple geometric elegance */}
        <View style={styles.dancer}>
          {/* Head */}
          <View style={[styles.head, { 
            width: s.head, 
            height: s.head, 
            borderRadius: s.head / 2,
            top: s.headTop, 
            left: s.headLeft 
          }]} />
          
          {/* Torso */}
          <View style={[styles.torso, {
            width: s.torsoW,
            height: s.torsoH,
            top: s.torsoTop,
            left: s.torsoLeft,
          }]} />
          
          {/* Arm - raised elegantly */}
          <View style={[styles.armUp, {
            width: s.armW,
            height: s.armH,
            top: s.armUpTop,
            left: s.armUpLeft,
          }]} />
          
          {/* Arm - extended */}
          <View style={[styles.armOut, {
            width: s.armW,
            height: s.armH,
            top: s.armOutTop,
            left: s.armOutLeft,
          }]} />
          
          {/* Leg - standing */}
          <View style={[styles.legStand, {
            width: s.legW,
            height: s.legH,
            top: s.legStandTop,
            left: s.legStandLeft,
          }]} />
          
          {/* Leg - extended (arabesque) */}
          <View style={[styles.legBack, {
            width: s.legW,
            height: s.legH,
            top: s.legBackTop,
            left: s.legBackLeft,
          }]} />
        </View>
      </View>

      {/* Brand Name */}
      {showText && (
        <Text style={[styles.text, { fontSize: s.fontSize }]}>
          Dance Studio
        </Text>
      )}
    </View>
  );
}

// Size configurations
const SIZES = {
  sm: {
    mark: 48,
    markRadius: 14,
    head: 8,
    headTop: 6,
    headLeft: 20,
    torsoW: 8,
    torsoH: 12,
    torsoTop: 14,
    torsoLeft: 20,
    armW: 3,
    armH: 10,
    armUpTop: 14,
    armUpLeft: 12,
    armOutTop: 18,
    armOutLeft: 28,
    legW: 3,
    legH: 12,
    legStandTop: 26,
    legStandLeft: 22,
    legBackTop: 28,
    legBackLeft: 28,
    fontSize: 16,
  },
  md: {
    mark: 64,
    markRadius: 18,
    head: 10,
    headTop: 8,
    headLeft: 27,
    torsoW: 10,
    torsoH: 16,
    torsoTop: 18,
    torsoLeft: 27,
    armW: 4,
    armH: 14,
    armUpTop: 18,
    armUpLeft: 16,
    armOutTop: 24,
    armOutLeft: 38,
    legW: 4,
    legH: 16,
    legStandTop: 34,
    legStandLeft: 30,
    legBackTop: 36,
    legBackLeft: 38,
    fontSize: 22,
  },
  lg: {
    mark: 80,
    markRadius: 22,
    head: 12,
    headTop: 10,
    headLeft: 34,
    torsoW: 12,
    torsoH: 20,
    torsoTop: 22,
    torsoLeft: 34,
    armW: 5,
    armH: 18,
    armUpTop: 22,
    armUpLeft: 20,
    armOutTop: 30,
    armOutLeft: 48,
    legW: 5,
    legH: 20,
    legStandTop: 42,
    legStandLeft: 38,
    legBackTop: 44,
    legBackLeft: 48,
    fontSize: 26,
  },
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  mark: {
    backgroundColor: colors.primary,
    marginBottom: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dancer: {
    position: 'relative',
  },
  head: {
    position: 'absolute',
    backgroundColor: colors.accent,
  },
  torso: {
    position: 'absolute',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  armUp: {
    position: 'absolute',
    backgroundColor: colors.accent,
    borderRadius: 2,
    transform: [{ rotate: '-35deg' }],
  },
  armOut: {
    position: 'absolute',
    backgroundColor: colors.accent,
    borderRadius: 2,
    transform: [{ rotate: '25deg' }],
  },
  legStand: {
    position: 'absolute',
    backgroundColor: colors.accent,
    borderRadius: 2,
    transform: [{ rotate: '5deg' }],
  },
  legBack: {
    position: 'absolute',
    backgroundColor: colors.accent,
    borderRadius: 2,
    transform: [{ rotate: '40deg' }],
  },
  text: {
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});

export default Logo;
