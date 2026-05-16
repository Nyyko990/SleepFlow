import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { colors } from '../constants/colors';

// [xFrac, yFrac, sizePx] — positions as fraction of screen dimensions
const STAR_DATA: [number, number, number][] = [
  [0.12, 0.10, 2],
  [0.28, 0.17, 2.5],
  [0.42, 0.07, 2],
  [0.70, 0.13, 3],
  [0.85, 0.20, 2],
  [0.80, 0.30, 2.5],
  [0.18, 0.38, 2],
  [0.08, 0.48, 2.5],
  [0.90, 0.45, 2],
  [0.62, 0.57, 3],
  [0.26, 0.65, 2],
  [0.52, 0.74, 2.5],
];

// Pairs of star indices joined by thin constellation lines
const CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [3, 4], [4, 5], [6, 7], [9, 10],
];

interface Props {
  opacity: Animated.Value;
}

function Cloud({ w }: { w: number }) {
  const h = w * 0.28;
  return (
    <View style={{ width: w, height: h + w * 0.38 }}>
      <View style={{
        position: 'absolute', bottom: 0, left: 0,
        width: w, height: h, borderRadius: h / 2,
        backgroundColor: '#E8E8F0',
      }} />
      <View style={{
        position: 'absolute', bottom: h * 0.45, left: w * 0.08,
        width: w * 0.48, height: w * 0.38, borderRadius: w * 0.19,
        backgroundColor: '#E8E8F0',
      }} />
      <View style={{
        position: 'absolute', bottom: h * 0.35, left: w * 0.46,
        width: w * 0.38, height: w * 0.30, borderRadius: w * 0.15,
        backgroundColor: '#E8E8F0',
      }} />
    </View>
  );
}

export function LoadingScreen({ opacity }: Props) {
  const { width, height } = useWindowDimensions();

  const moonScale = useRef(new Animated.Value(1)).current;
  const starAnims = useRef(STAR_DATA.map(() => new Animated.Value(0.7))).current;
  const cloud1X = useRef(new Animated.Value(0)).current;
  const cloud2X = useRef(new Animated.Value(0)).current;
  const cloud3X = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const moonLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(moonScale, { toValue: 1.03, duration: 2000, useNativeDriver: true }),
        Animated.timing(moonScale, { toValue: 1.00, duration: 2000, useNativeDriver: true }),
      ])
    );
    moonLoop.start();

    const starTimers: ReturnType<typeof setTimeout>[] = [];
    const starLoops: Animated.CompositeAnimation[] = [];
    starAnims.forEach((anim, i) => {
      const dur = 1800 + i * 160;
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 0.18, duration: dur, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.9, duration: dur, useNativeDriver: true }),
        ])
      );
      const t = setTimeout(() => loop.start(), i * 330);
      starTimers.push(t);
      starLoops.push(loop);
    });

    const cloudLoops = [
      Animated.loop(Animated.sequence([
        Animated.timing(cloud1X, { toValue: 8, duration: 14000, useNativeDriver: true }),
        Animated.timing(cloud1X, { toValue: 0, duration: 14000, useNativeDriver: true }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(cloud2X, { toValue: -6, duration: 18000, useNativeDriver: true }),
        Animated.timing(cloud2X, { toValue: 0, duration: 18000, useNativeDriver: true }),
      ])),
      Animated.loop(Animated.sequence([
        Animated.timing(cloud3X, { toValue: 5, duration: 22000, useNativeDriver: true }),
        Animated.timing(cloud3X, { toValue: 0, duration: 22000, useNativeDriver: true }),
      ])),
    ];
    cloudLoops.forEach(l => l.start());

    return () => {
      moonLoop.stop();
      starTimers.forEach(clearTimeout);
      starLoops.forEach(l => l.stop());
      cloudLoops.forEach(l => l.stop());
    };
  }, []);

  const stars = STAR_DATA.map(([xF, yF, size]) => ({
    x: xF * width,
    y: yF * height,
    size,
  }));

  const lines = CONNECTIONS.map(([i, j]) => {
    const a = stars[i];
    const b = stars[j];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    return {
      left: (a.x + b.x) / 2 - len / 2,
      top: (a.y + b.y) / 2,
      width: len,
      angle,
    };
  });

  const moonLeft = width / 2 - 27;
  const moonTop = height * 0.15;

  return (
    <Animated.View style={[styles.container, { opacity }]} pointerEvents="none">
      {/* Constellation lines */}
      {lines.map((line, i) => (
        <View
          key={`line-${i}`}
          style={{
            position: 'absolute',
            left: line.left,
            top: line.top,
            width: line.width,
            height: 0.5,
            backgroundColor: '#E8E8F0',
            opacity: 0.15,
            transform: [{ rotate: `${line.angle}deg` }],
          }}
        />
      ))}

      {/* Stars */}
      {stars.map((star, i) => (
        <Animated.View
          key={`star-${i}`}
          style={{
            position: 'absolute',
            left: star.x - star.size / 2,
            top: star.y - star.size / 2,
            width: star.size,
            height: star.size,
            borderRadius: star.size / 2,
            backgroundColor: '#E8E8F0',
            opacity: starAnims[i],
          }}
        />
      ))}

      {/* Crescent moon */}
      <Animated.View
        style={[styles.moonWrap, { left: moonLeft, top: moonTop, transform: [{ scale: moonScale }] }]}
      >
        <View style={styles.moonGlow} />
        <View style={styles.moonBody} />
        {/* Overlapping circle in background color cuts out the crescent */}
        <View style={[styles.moonCut, { backgroundColor: colors.background }]} />
      </Animated.View>

      {/* Clouds */}
      <Animated.View style={{ position: 'absolute', left: -10, top: height * 0.55, opacity: 0.18, transform: [{ translateX: cloud1X }] }}>
        <Cloud w={110} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', right: -20, top: height * 0.38, opacity: 0.15, transform: [{ translateX: cloud2X }] }}>
        <Cloud w={90} />
      </Animated.View>
      <Animated.View style={{ position: 'absolute', left: 30, top: height * 0.28, opacity: 0.22, transform: [{ translateX: cloud3X }] }}>
        <Cloud w={70} />
      </Animated.View>

      {/* Title */}
      <View style={[styles.titleWrap, { top: height * 0.62 }]}>
        <Text style={styles.title}>SLEEPFLOW</Text>
        <Text style={styles.subtitle}>preparing your sounds...</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    zIndex: 10,
  },
  moonWrap: {
    position: 'absolute',
    width: 54,
    height: 54,
  },
  moonGlow: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: 'rgba(200,200,230,0.06)',
    top: -14,
    left: -14,
  },
  moonBody: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#B8B8CC',
    shadowColor: '#9090B8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 6,
  },
  moonCut: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    top: -4,
    left: 18,
  },
  titleWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  title: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    opacity: 0.4,
    letterSpacing: 0.5,
  },
});
