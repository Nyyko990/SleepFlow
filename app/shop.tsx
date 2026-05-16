import React from 'react';
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../constants/colors';
import type { IoniconName } from '../constants/sounds';
import { BottomNav } from '../components/BottomNav';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 12;
const GRID_PADDING = 16;
const ITEM_W = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;

interface ShopItem {
  id: string;
  name: string;
  icon: IoniconName;
  price: string;
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 'wukong', name: 'The Journey of Wukong', icon: 'flash-outline', price: '$0.99' },
  { id: 'dragon', name: "Dragon's Search", icon: 'water-outline', price: '$0.99' },
  { id: 'ember', name: 'Ember Night', icon: 'leaf-outline', price: '$0.99' },
  { id: 'solar', name: 'Solar System Sounds', icon: 'planet-outline', price: '$1.99' },
];

function handleBuy() {
  Alert.alert('Coming Soon', 'In-app purchases will be available at launch.');
}

export default function ShopScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7} hitSlop={8}>
            <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.brand}>SLEEPFLOW</Text>
            <Text style={styles.heading}>Premium</Text>
          </View>
        </View>

        {/* Featured bundle */}
        <View style={styles.featured}>
          <Text style={styles.featuredLabel}>FEATURED BUNDLE</Text>
          <View style={styles.featuredIconRow}>
            <Ionicons name="moon-outline" size={18} color={colors.textSecondary} style={{ opacity: 0.6 }} />
            <Ionicons name="planet-outline" size={18} color={colors.textSecondary} style={{ opacity: 0.6 }} />
            <Ionicons name="flame-outline" size={18} color={colors.textSecondary} style={{ opacity: 0.6 }} />
          </View>
          <Text style={styles.featuredTitle}>Fantasy Worlds</Text>
          <Text style={styles.featuredDesc}>3 epic sleep stories crafted to carry you into deep rest</Text>
          <View style={styles.featuredBottom}>
            <Text style={styles.featuredPrice}>$2.99</Text>
            <TouchableOpacity style={styles.buyBundleBtn} onPress={handleBuy} activeOpacity={0.85}>
              <Text style={styles.buyBundleBtnText}>Buy Bundle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Individual items */}
        <Text style={styles.sectionLabel}>INDIVIDUAL ITEMS</Text>
        <View style={styles.grid}>
          {SHOP_ITEMS.map(item => (
            <View key={item.id} style={styles.gridItem}>
              <View style={styles.itemIconWrap}>
                <Ionicons name={item.icon} size={22} color={colors.textSecondary} />
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed-outline" size={9} color={colors.textSecondary} />
                </View>
              </View>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={styles.itemPrice}>{item.price}</Text>
              <TouchableOpacity style={styles.itemBuyBtn} onPress={handleBuy} activeOpacity={0.85}>
                <Text style={styles.itemBuyBtnText}>Buy</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  brand: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '300',
    letterSpacing: 4,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  heading: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 0.3,
    opacity: 0.9,
  },
  // Featured bundle
  featured: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.accentPurple,
    padding: 20,
    shadowColor: '#6B4FA0',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  featuredLabel: {
    color: colors.accentBlue,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  featuredIconRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  featuredTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  featuredDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.7,
    marginBottom: 20,
  },
  featuredBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredPrice: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '300',
    letterSpacing: 0.5,
  },
  buyBundleBtn: {
    backgroundColor: colors.accentBlue,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  buyBundleBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PADDING,
    gap: GRID_GAP,
  },
  gridItem: {
    width: ITEM_W,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 8,
  },
  itemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
  },
  itemPrice: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '300',
  },
  itemBuyBtn: {
    backgroundColor: colors.border,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accentBlue,
    marginTop: 2,
  },
  itemBuyBtnText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  bottomPad: {
    height: 16,
  },
});
