import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useBLE } from '../../context/BLEContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withSpring, useSharedValue, withTiming } from 'react-native-reanimated';

export default function HomeScreen() {
  const { sensorData, postureData, connectedDevice } = useBLE();

  const getStatusColor = (code: string) => {
    if (code === '5') return '#10b981'; // Emerald 500
    if (code === '0') return '#94a3b8'; // Slate 400
    return '#ef4444'; // Red 500
  };

  const getStatusShadow = (code: string) => {
    if (code === '5') return 'rgba(16, 185, 129, 0.4)';
    if (code === '0') return 'rgba(148, 163, 184, 0.2)';
    return 'rgba(239, 68, 68, 0.4)';
  };

  const AnimatedProgressBar = ({ label, value, max }: { label: string, value: number, max: number }) => {
    let targetPercent = (value / max) * 100;
    if (isNaN(targetPercent)) targetPercent = 0;
    targetPercent = Math.max(0, Math.min(targetPercent, 100));

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>{label}</Text>
            <Text style={styles.progressValue}>{targetPercent.toFixed(1)} %</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fillWrapper, { width: `${targetPercent}%` }]}>
            <LinearGradient
                colors={['#38bdf8', '#0ea5e9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
            />
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Smart Chairz</Text>
      </View>

      <View style={styles.topRow}>
          <View style={styles.statusCardMini}>
            <Text style={styles.cardTitleMini}>Bluetooth</Text>
            <View style={styles.rowCenter}>
                <View style={[styles.dot, { backgroundColor: connectedDevice ? '#10b981' : '#ef4444' }]} />
                <Text style={styles.statusTextMini}>
                {connectedDevice ? 'Connected' : 'Disconnected'}
                </Text>
            </View>
          </View>

          <View style={styles.statusCardMini}>
             <Text style={styles.cardTitleMini}>User Presense</Text>
             <Text style={styles.statusTextMini}>{postureData.code === '0' ? 'Not Seated' : 'Seated Active'}</Text>
          </View>
      </View>

      <View style={[styles.card, { 
          borderColor: getStatusColor(postureData.code), 
          borderWidth: 1.5,
          shadowColor: getStatusShadow(postureData.code),
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.6,
          shadowRadius: 12,
          elevation: 10,
          backgroundColor: '#ffffff'
        }]}>
        <Text style={styles.cardTitleCenter}>Live Posture Status</Text>
        <Text style={[styles.alertText, { color: getStatusColor(postureData.code) }]}>
          {postureData.postureText}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Distance Balance</Text>
        <View style={styles.distanceRow}>
          <View style={styles.distanceBox}>
            <Text style={[styles.distanceVal, { fontSize: 22, color: postureData.leftBack === 1 ? '#0ea5e9' : '#94a3b8' }]}>
                {postureData.leftBack === 1 ? 'Contact' : 'Idle'}
            </Text>
            <Text style={styles.distanceLabel}>Left Back</Text>
          </View>
          <View style={styles.distanceDivider} />
          <View style={styles.distanceBox}>
            <Text style={[styles.distanceVal, { fontSize: 22, color: postureData.rightBack === 1 ? '#0ea5e9' : '#94a3b8' }]}>
                {postureData.rightBack === 1 ? 'Contact' : 'Idle'}
            </Text>
            <Text style={styles.distanceLabel}>Right Back</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Seat Load Distribution</Text>
        <Text style={styles.cardSub}>Percentage based on 30Kg capacity limit</Text>
        
        <View style={styles.seatLayout}>
            {/* Front of seat (Thighs) */}
            <View style={styles.seatRow}>
                <View style={styles.seatSectionLeft}>
                    <AnimatedProgressBar label="Left Thigh" value={sensorData.leftThigh} max={30} />
                </View>
                <View style={styles.seatSectionRight}>
                    <AnimatedProgressBar label="Right Thigh" value={sensorData.rightThigh} max={30} />
                </View>
            </View>

            {/* Back of seat (Waist) */}
            <View style={styles.seatRow}>
                <View style={styles.seatSectionLeft}>
                    <AnimatedProgressBar label="Left Waist" value={sensorData.leftWaist} max={30} />
                </View>
                <View style={styles.seatSectionRight}>
                    <AnimatedProgressBar label="Right Waist" value={sensorData.rightWaist} max={30} />
                </View>
            </View>
        </View>
      </View>
      
      <View style={{height: 100}} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9', // Light slate background
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statusCardMini: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 5,
    shadowColor: '#cbd5e1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitleMini: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusTextMini: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
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
  cardTitleCenter: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 1,
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
    marginBottom: 20,
  },
  alertText: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginVertical: 10,
  },
  distanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 15,
  },
  distanceBox: {
    alignItems: 'center',
  },
  distanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  distanceVal: {
    color: '#0ea5e9',
    fontSize: 28,
    fontWeight: '800',
  },
  unitText: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: '600',
  },
  distanceLabel: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  seatLayout: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 15,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  seatSectionLeft: {
    flex: 1,
    paddingRight: 10,
  },
  seatSectionRight: {
    flex: 1,
    paddingLeft: 10,
  },
  progressContainer: {
    flex: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  progressValue: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  track: {
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  fillWrapper: {
    height: '100%',
    borderRadius: 5,
    overflow: 'hidden',
  }
});
