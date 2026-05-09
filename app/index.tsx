import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { SOUNDS, type SoundDef } from '../constants/sounds';
import SoundCard from '../components/SoundCard';
import { LoadingScreen } from '../components/LoadingScreen';
import { SoundModal } from '../components/SoundModal';
import { useSoundPlayer } from '../hooks/useSoundPlayer';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { active, volumes, toggle, setVolume, isReady } = useSoundPlayer();

  // Loading screen fade-out
  const loadingOpacity = useRef(new Animated.Value(1)).current;
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    if (isReady) {
      Animated.timing(loadingOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => setShowLoading(false));
    }
  }, [isReady, loadingOpacity]);

  // Expanded modal
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const renderItem = useCallback(
    ({ item }: { item: SoundDef }) => {
      if (item.isEmpty) {
        return <View style={styles.emptyCell} />;
      }
      return (
        <SoundCard
          sound={item}
          isActive={active[item.id] ?? false}
          volume={volumes[item.id] ?? 0.7}
          onToggle={() => toggle(item.id)}
          onVolumeChange={v => setVolume(item.id, v)}
          onLongPress={() => setExpandedId(item.id)}
        />
      );
    },
    [active, volumes, toggle, setVolume],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.title}>SleepFlow</Text>

      <FlatList
        data={SOUNDS}
        keyExtractor={item => item.id}
        numColumns={3}
        renderItem={renderItem}
        contentContainerStyle={styles.grid}
        scrollEnabled={false}
        style={styles.list}
      />

      {/* Phase 2: Sleep Timer */}
      <View style={[styles.timerArea, { paddingBottom: insets.bottom + 16 }]} />

      <SoundModal
        expandedId={expandedId}
        active={active}
        volumes={volumes}
        onToggle={toggle}
        onVolumeChange={setVolume}
        onClose={() => setExpandedId(null)}
      />

      {showLoading && <LoadingScreen opacity={loadingOpacity} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '300',
    letterSpacing: 4,
    textAlign: 'center',
    paddingTop: 20,
    paddingBottom: 12,
    textTransform: 'uppercase',
  },
  list: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  emptyCell: {
    flex: 1,
    margin: 5,
  },
  timerArea: {
    minHeight: 100,
  },
});
