import { View, Text, StyleSheet, Pressable, ScrollView, Dimensions, Platform, Animated, Easing, useColorScheme, ColorSchemeName } from 'react-native';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { sites } from '../../data/sites';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';

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
  const colorScheme = useColorScheme();
  const [filterBy, setFilterBy] = useState('all');
  const [filteredStatuses, setFilteredStatuses] = useState<Record<string, SiteStatus>>({});
  const [activeFilter, setActiveFilter] = useState('all');
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

  const checkAllSites = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    checkAllSites();
    const interval = setInterval(checkAllSites, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if(filterBy === 'online') {
      setFilteredStatuses(Object.fromEntries(Object.entries(statuses).filter(([_, status]) => status.isOnline)));
    } else if(filterBy === 'offline') {
      setFilteredStatuses(Object.fromEntries(Object.entries(statuses).filter(([_, status]) => !status.isOnline)));
    } else {
      setFilteredStatuses(statuses);
    }
  }, [filterBy, statuses]);

  const handleFilterChange = useCallback((filter: string) => {
    setActiveFilter(filter);
    setFilterBy(filter);
  }, []);

  const filteredSites = useMemo(() => 
    sites.filter(site => site.url in filteredStatuses),
    [filteredStatuses]
  );

  const statistics = useMemo(() => ({
    total: sites.length,
    online: Object.values(statuses).filter(s => s.isOnline).length,
    offline: Object.values(statuses).filter(s => !s.isOnline && !s.loading).length
  }), [statuses]);

  const getGradientColors = useCallback((index: number): [string, string] => {
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
  }, []);

  const getStatusGradient = useCallback((status: SiteStatus): [string, string] => {
    if (status.loading) return ['#F7971E', '#FFD200'];
    return status.isOnline ? ['#43e97b', '#38f9d7'] : ['#f77062', '#fe5196'];
  }, []);

  const getThemeColors = () => ({
    background: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5',
    headerGradient: colorScheme === 'dark' 
      ? ['#2D3436', '#000000']
      : ['#ffffff', '#f0f0f0'],
    text: colorScheme === 'dark' ? '#ffffff' : '#000000',
    textSecondary: colorScheme === 'dark' ? '#ffffff99' : '#00000099',
    cardGlass: colorScheme === 'dark' 
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.05)',
    statsBarBg: colorScheme === 'dark' 
      ? '#ffffff10' 
      : '#00000010',
    refreshButtonBg: colorScheme === 'dark' 
      ? '#ffffff15' 
      : '#00000015',
    refreshButtonBorder: colorScheme === 'dark' 
      ? '#ffffff25' 
      : '#00000025',
  });

  const theme = useMemo(() => getThemeColors(), [colorScheme]);

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.background }]} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={theme.headerGradient}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: theme.text }]}>
              Coding Dynasty
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Network Status
            </Text>
          </View>
          <Pressable 
            onPress={checkAllSites}
            style={[
              styles.refreshButton, 
              { 
                backgroundColor: theme.refreshButtonBg,
                borderColor: theme.refreshButtonBorder 
              },
              isRefreshing && styles.refreshing
            ]}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <FontAwesome name="refresh" size={20} color={theme.text} />
            </Animated.View>
          </Pressable>
        </View>

        <View style={[styles.statsBar, { backgroundColor: theme.statsBarBg }]}>
          <Pressable 
            onPress={() => handleFilterChange('all')}
            style={[styles.statItem, activeFilter === 'all' && styles.activeStatItem]}
          >
            <MaterialCommunityIcons 
              name="web" 
              size={16} 
              color={activeFilter === 'all' ? theme.text : theme.textSecondary} 
            />
            <Text style={[styles.statText, { color: activeFilter === 'all' ? theme.text : theme.textSecondary }]}>
              {statistics.total} Services
            </Text>
          </Pressable>
          <Pressable 
            onPress={() => handleFilterChange('online')}
            style={[styles.statItem, activeFilter === 'online' && styles.activeStatItem]}
          >
            <MaterialCommunityIcons 
              name="check-circle-outline" 
              size={16} 
              color={activeFilter === 'online' ? theme.text : theme.textSecondary} 
            />
            <Text style={[styles.statText, { color: activeFilter === 'online' ? theme.text : theme.textSecondary }]}>
              {statistics.online} Online
            </Text>
          </Pressable>
          <Pressable 
            onPress={() => handleFilterChange('offline')}
            style={[styles.statItem, activeFilter === 'offline' && styles.activeStatItem]}
          >
            <MaterialCommunityIcons 
              name="alert-circle-outline" 
              size={16} 
              color={activeFilter === 'offline' ? theme.text : theme.textSecondary} 
            />
            <Text style={[styles.statText, { color: activeFilter === 'offline' ? theme.text : theme.textSecondary }]}>
              {statistics.offline} Offline
            </Text>
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.grid}>
        {Object.keys(statuses).length === 0 
          ? Array(sites.length).fill(0).map((_, index) => (
              <SkeletonCard key={`skeleton-${index}`} theme={theme} />
            ))
          : filteredSites.map((site, index) => (
              <SiteCard
                key={site.url}
                site={site}
                status={filteredStatuses[site.url]}
                index={index}
                theme={theme}
                getGradientColors={getGradientColors}
                getStatusGradient={getStatusGradient}
                colorScheme={colorScheme}
              />
            ))
        }
      </View>
    </ScrollView>
  );
}

const SiteCard = memo(({ site, status, index, theme, getGradientColors, getStatusGradient, colorScheme }: {
  site: any;
  status: SiteStatus | undefined;
  index: number;
  theme: any;
  getGradientColors: (index: number) => [string, string];
  getStatusGradient: (status: SiteStatus) => [string, string];
  colorScheme: ColorSchemeName;
}) => {
  const defaultStatus = {
    loading: true,
    isOnline: false,
    responseTime: 0,
    lastChecked: new Date()
  };

  const currentStatus = status || defaultStatus;

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.cardWrapper,
        {
          shadowColor: colorScheme === 'dark' ? '#000' : '#0000004D',
        },
        pressed && styles.cardPressed
      ]}
    >
      <LinearGradient
        colors={getGradientColors(index)}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.glassEffect, { backgroundColor: theme.cardGlass }]}>
          <View style={styles.cardContent}>
            <View>
              <View style={styles.cardHeader}>
                <Text style={styles.siteTitle} numberOfLines={1}>{site.title}</Text>
                <LinearGradient
                  colors={getStatusGradient(currentStatus)}
                  style={styles.statusBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>
                    {currentStatus.loading ? 'Checking...' :
                     currentStatus.isOnline ? 'Online' : 'Offline'}
                  </Text>
                </LinearGradient>
              </View>
              <Text style={styles.siteUrl} numberOfLines={1}>{site.name}</Text>
            </View>
            
            {!currentStatus.loading && (
              <View style={styles.statsRow}>
                {currentStatus.isOnline && (
                  <View style={styles.statChip}>
                    <MaterialCommunityIcons name="clock-outline" size={12} color="#ffffff" />
                    <Text style={styles.statChipText}>{currentStatus.responseTime}ms</Text>
                  </View>
                )}
                <View style={styles.statChip}>
                  <MaterialCommunityIcons name="update" size={12} color="#ffffff" />
                  <Text style={styles.statChipText}>
                    {currentStatus.lastChecked.toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
});

const SkeletonCard = memo(({ theme }: { theme: any }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );

    const scale = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.98,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    shimmer.start();
    scale.start();
    return () => {
      pulse.stop();
      shimmer.stop();
      scale.stop();
    };
  }, []);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.5],
  });

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const AnimatedBlock = ({ style }: { style: any }) => (
    <Animated.View style={[style, { overflow: 'hidden' }]}>
      <Animated.View 
        style={[
          StyleSheet.absoluteFill,
          {
            opacity,
            backgroundColor: '#ffffff',
          }
        ]} 
      />
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
            backgroundColor: '#ffffff',
            opacity: 0.2,
          }
        ]}
      />
    </Animated.View>
  );

  return (
    <Animated.View 
      style={[
        styles.cardWrapper,
        { transform: [{ scale: scaleAnim }] }
      ]}
    >
      <LinearGradient
        colors={['#3a3a3a', '#2d2d2d']}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={[styles.glassEffect, { backgroundColor: theme.cardGlass }]}>
          <View style={styles.cardContent}>
            <View style={{ gap: 12 }}>
              <View style={[styles.cardHeader, { gap: 8 }]}>
                <AnimatedBlock style={styles.skeletonTitle} />
                <AnimatedBlock style={styles.skeletonBadge} />
              </View>
              <AnimatedBlock style={styles.skeletonUrl} />
            </View>
            <View style={[styles.statsRow, { marginTop: 16, gap: 12 }]}>
              <AnimatedBlock style={styles.skeletonChip} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  activeStatItem: {
    backgroundColor: Platform.select({
      ios: 'rgba(255, 255, 255, 0.1)',
      android: 'rgba(255, 255, 255, 0.15)',
    }),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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
  skeletonTitle: {
    width: '50%',
    height: 24,
    backgroundColor: '#ffffff',
    borderRadius: 6,
  },
  skeletonBadge: {
    width: 80,
    height: 28,
    backgroundColor: '#ffffff',
    borderRadius: 14,
  },
  skeletonUrl: {
    width: '40%',
    height: 16,
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  skeletonChip: {
    width: 70,
    height: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
});
