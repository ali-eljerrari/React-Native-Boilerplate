import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions, Platform, Animated, Easing } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { sites } from '../../data/sites';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type SiteStatus = {
  isOnline: boolean;
  responseTime: number;
  lastChecked: Date;
  loading: boolean;
};

const { width } = Dimensions.get('window');
const PADDING = 16;
const GAP = 12;
const CARD_WIDTH = (width - (2 * PADDING) - GAP) / 2;

export default function Tab() {
  const [statuses, setStatuses] = useState<Record<string, SiteStatus>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const startSpinning = () => {
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true
    }).start();
  };

  const checkAllSites = async () => {
    setIsRefreshing(true);
    startSpinning();
    const newStatuses: Record<string, SiteStatus> = {};
    
    await Promise.all(sites.map(async (site) => {
      try {
        const startTime = Date.now();
        const response = await fetch(site.url);
        const endTime = Date.now();
        
        newStatuses[site.url] = {
          isOnline: response.ok,
          responseTime: endTime - startTime,
          lastChecked: new Date(),
          loading: false
        };
      } catch (error) {
        newStatuses[site.url] = {
          isOnline: false,
          responseTime: 0,
          lastChecked: new Date(),
          loading: false
        };
      }
    }));
    
    setStatuses(newStatuses);
    setIsRefreshing(false);
  };

  useEffect(() => {
    checkAllSites();
    const interval = setInterval(checkAllSites, 30000);
    return () => clearInterval(interval);
  }, []);

  const getGradientColors = (index: number): [string, string] => {
    const gradients: [string, string][] = [
      ['#FF6B6B', '#ee0979'],
      ['#4ECDC4', '#00F260'],
      ['#0575E6', '#021B79'],
      ['#8E2DE2', '#4A00E0'],
      ['#11998e', '#38ef7d'],
      ['#FC466B', '#3F5EFB'],
      ['#00c6ff', '#0072ff'],
      ['#f857a6', '#ff5858'],
    ];
    return gradients[index % gradients.length] || ['#6c757d', '#495057'];
  };

  const getStatusGradient = (status: SiteStatus): [string, string] => {
    if (status.loading) return ['#F7971E', '#FFD200'];
    return status.isOnline ? ['#43e97b', '#38f9d7'] : ['#f77062', '#fe5196'];
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['#2D3436', '#000000']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Coding Dynasty</Text>
            <Text style={styles.subtitle}>Network Status</Text>
          </View>
          <Pressable 
            onPress={checkAllSites}
            style={[styles.refreshButton, isRefreshing && styles.refreshing]}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <FontAwesome name="refresh" size={20} color="#fff" />
            </Animated.View>
          </Pressable>
        </View>

        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="web" size={16} color="#ffffff99" />
            <Text style={styles.statText}>{sites.length} Services</Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="check-circle-outline" size={16} color="#4CAF50" />
            <Text style={styles.statText}>
              {Object.values(statuses).filter(s => s.isOnline).length} Online
            </Text>
          </View>
          <View style={styles.statItem}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#f44336" />
            <Text style={styles.statText}>
              {Object.values(statuses).filter(s => !s.isOnline && !s.loading).length} Offline
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.grid}>
        {sites.map((site, index) => {
          const status = statuses[site.url] || {
            loading: true,
            isOnline: false,
            responseTime: 0,
            lastChecked: new Date()
          };

          return (
            <Pressable 
              key={site.url} 
              style={({ pressed }) => [
                styles.cardWrapper,
                pressed && styles.cardPressed
              ]}
            >
              <LinearGradient
                colors={getGradientColors(index)}
                style={styles.cardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.glassEffect}>
                  <View style={styles.cardContent}>
                    <View>
                      <View style={styles.cardHeader}>
                        <Text style={styles.siteTitle} numberOfLines={1}>{site.title}</Text>
                        <LinearGradient
                          colors={getStatusGradient(status)}
                          style={styles.statusBadge}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                        >
                          <View style={styles.statusDot} />
                          <Text style={styles.statusText}>
                            {status.loading ? 'Checking...' :
                             status.isOnline ? 'Online' : 'Offline'}
                          </Text>
                        </LinearGradient>
                      </View>
                      <Text style={styles.siteUrl} numberOfLines={1}>{site.name}</Text>
                    </View>
                    
                    {!status.loading && (
                      <View style={styles.statsRow}>
                        {status.isOnline && (
                          <View style={styles.statChip}>
                            <MaterialCommunityIcons name="clock-outline" size={12} color="#ffffff" />
                            <Text style={styles.statChipText}>{status.responseTime}ms</Text>
                          </View>
                        )}
                        <View style={styles.statChip}>
                          <MaterialCommunityIcons name="update" size={12} color="#ffffff" />
                          <Text style={styles.statChipText}>
                            {status.lastChecked.toLocaleTimeString()}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollContent: {
    paddingBottom: PADDING,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    paddingBottom: 24,
    paddingHorizontal: PADDING,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#ffffff99',
  },
  refreshButton: {
    padding: 12,
    backgroundColor: '#ffffff15',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff25',
  },
  refreshing: {
    opacity: 0.7,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff10',
    borderRadius: 12,
    padding: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: '#ffffff99',
    fontSize: 14,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: PADDING,
    gap: GAP,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: 140,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: GAP,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.97 }],
  },
  cardGradient: {
    flex: 1,
  },
  glassEffect: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  cardContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  siteTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginRight: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  siteUrl: {
    fontSize: 13,
    color: '#ffffffdd',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statChipText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
