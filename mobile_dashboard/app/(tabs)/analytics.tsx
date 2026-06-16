import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { getPostureHistory } from '../../services/FirebaseService';
import { useFocusEffect } from 'expo-router';

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'all'>('all');

  const fetchData = async () => {
    try {
      const data = await getPostureHistory();
      
      if (!data) {
          setAnalyticsData(null);
          return;
      }

      // Process Data
      let totalRecords = 0;
      const postureCounts: Record<string, number> = {};
      
      const now = new Date();
      now.setHours(0,0,0,0); // start of today

      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 7);

      Object.values(data).forEach((entry: any) => {
          if (!entry.dateString) return;

          // entry.dateString format is MM/DD/YYYY
          const [month, day, year] = entry.dateString.split('/');
          const entryDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          entryDate.setHours(0,0,0,0);

          let include = false;
          if (timeFilter === 'today') {
              if (entryDate.getTime() === now.getTime()) include = true;
          } else if (timeFilter === 'week') {
              if (entryDate >= lastWeek && entryDate <= now) include = true;
          } else {
              include = true; // all time
          }

          if (include) {
              totalRecords++;
              const posture = entry.posture || 'Unknown';
              if (postureCounts[posture]) {
                  postureCounts[posture]++;
              } else {
                  postureCounts[posture] = 1;
              }
          }
      });

      setAnalyticsData({
          totalRecords,
          postureCounts
      });

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData(); // Initial fetch
      
      const interval = setInterval(() => {
          fetchData(); // Poll every 2 seconds for real-time updates
      }, 2000);
      
      return () => clearInterval(interval); // Clean up on blur
    }, [timeFilter]) // add timeFilter as dependency so it re-fetches when filter changes
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const getPostureColor = (postureName: string) => {
      if (postureName.toLowerCase().includes('ideal')) return '#10b981'; // Green
      if (postureName.toLowerCase().includes('no user')) return '#94a3b8'; // Slate
      return '#f59e0b'; // Amber for bad postures
  }

  if (loading) {
      return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color="#0ea5e9" />
              <Text style={{ marginTop: 10, color: '#64748b' }}>Loading Analytics...</Text>
          </View>
      )
  }

  return (
    <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Data Overview</Text>
        <Text style={styles.subtitle}>Analytics</Text>
      </View>

      <View style={styles.filterContainer}>
          <Text 
              style={[styles.filterButton, timeFilter === 'today' && styles.filterButtonActive]} 
              onPress={() => setTimeFilter('today')}>
              Today
          </Text>
          <Text 
              style={[styles.filterButton, timeFilter === 'week' && styles.filterButtonActive]} 
              onPress={() => setTimeFilter('week')}>
              7 Days
          </Text>
          <Text 
              style={[styles.filterButton, timeFilter === 'all' && styles.filterButtonActive]} 
              onPress={() => setTimeFilter('all')}>
              All Time
          </Text>
      </View>

      {!analyticsData || analyticsData.totalRecords === 0 ? (
          <View style={styles.card}>
              <Text style={{ textAlign: 'center', color: '#64748b', marginVertical: 20 }}>
                  No historical data available. Sit on your Smart Chair to generate logs!
              </Text>
          </View>
      ) : (
          <>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Total Posture Logs</Text>
                <Text style={styles.hugeText}>{analyticsData.totalRecords}</Text>
                <Text style={styles.cardSub}>Recorded in Cloud</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Posture Distribution</Text>
                <Text style={styles.cardSub}>Proportion of your sitting habits</Text>

                <View style={{ marginTop: 10 }}>
                    {Object.keys(analyticsData.postureCounts).sort((a,b) => analyticsData.postureCounts[b] - analyticsData.postureCounts[a]).map((posture, index) => {
                        const count = analyticsData.postureCounts[posture];
                        const percentage = ((count / analyticsData.totalRecords) * 100).toFixed(1);
                        const color = getPostureColor(posture);

                        return (
                            <View key={index} style={styles.barItem}>
                                <View style={styles.barHeader}>
                                    <Text style={styles.barLabel}>{posture}</Text>
                                    <Text style={styles.barValue}>{percentage}% ({count})</Text>
                                </View>
                                <View style={styles.track}>
                                    <View style={[styles.fill, { width: `${percentage}%`, backgroundColor: color }]} />
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
          </>
      )}

      <View style={{height: 100}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  content: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
  },
  header: {
    marginBottom: 25,
  },
  title: {
    color: '#64748b',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  subtitle: {
    color: '#0f172a',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    padding: 4,
  },
  filterButton: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 8,
    color: '#64748b',
    fontWeight: '600',
    borderRadius: 8,
    overflow: 'hidden',
  },
  filterButtonActive: {
    backgroundColor: '#ffffff',
    color: '#0ea5e9',
    shadowColor: '#cbd5e1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#cbd5e1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  cardTitle: {
    color: '#1e293b',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSub: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 10,
  },
  hugeText: {
      fontSize: 48,
      fontWeight: '900',
      color: '#0ea5e9',
      marginVertical: 10,
  },
  barItem: {
      marginBottom: 16,
  },
  barHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 6,
  },
  barLabel: {
      color: '#334155',
      fontSize: 14,
      fontWeight: '600',
      flex: 1,
  },
  barValue: {
      color: '#0f172a',
      fontSize: 14,
      fontWeight: '700',
  },
  track: {
      height: 12,
      backgroundColor: '#e2e8f0',
      borderRadius: 6,
      overflow: 'hidden',
  },
  fill: {
      height: '100%',
      borderRadius: 6,
  }
});
