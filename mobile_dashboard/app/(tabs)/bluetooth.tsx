import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useBLE } from '../../context/BLEContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function BluetoothScreen() {
  const { 
      devices, 
      connectedDevice, 
      isScanning, 
      scanForPeripherals, 
      connectToDevice, 
      disconnectFromDevice 
  } = useBLE();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Bluetooth Pair</Text>
      </View>

      <View style={styles.statusCard}>
        <View style={[styles.iconBox, { backgroundColor: connectedDevice ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)' }]}>
            <Ionicons 
                name={connectedDevice ? "bluetooth" : "bluetooth-outline"} 
                size={32} 
                color={connectedDevice ? "#10b981" : "#94a3b8"} 
            />
        </View>
        <View style={styles.statusTextContainer}>
            <Text style={styles.statusLabel}>Current Status</Text>
            <Text style={[styles.statusValue, { color: connectedDevice ? '#10b981' : '#334155' }]}>
            {connectedDevice ? 'Connected' : 'Disconnected'}
            </Text>
        </View>
      </View>

      {connectedDevice ? (
        <TouchableOpacity style={styles.disconnectBtn} onPress={disconnectFromDevice}>
          <Text style={styles.btnText}>Disconnect Device</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.scanBtn} onPress={scanForPeripherals} disabled={isScanning}>
          <LinearGradient
            colors={isScanning ? ['#94a3b8', '#cbd5e1'] : ['#0ea5e9', '#38bdf8']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.gradientBtn}
          >
            {isScanning ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Scan Devices</Text>}
          </LinearGradient>
        </TouchableOpacity>
      )}

      <Text style={styles.sectionTitle}>Available Devices</Text>
      
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.deviceItem}
            onPress={() => connectToDevice(item)}
          >
            <View>
                <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
                <Text style={styles.deviceId}>{item.id}</Text>
            </View>
            <View style={styles.linkCircle}>
                <Ionicons name="link-outline" size={20} color="#0ea5e9" />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No devices found nearby.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 100 : 80,
  },
  header: {
    marginBottom: 30,
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
  statusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#cbd5e1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextContainer: {
    marginLeft: 15,
  },
  statusLabel: {
    color: '#94a3b8',
    fontSize: 13,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  scanBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 30,
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  gradientBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disconnectBtn: {
    backgroundColor: '#ef4444',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 15,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  deviceItem: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#cbd5e1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  deviceName: {
    color: '#1e293b',
    fontSize: 16,
    fontWeight: '700',
  },
  deviceId: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  linkCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#f0f9ff',
      alignItems: 'center',
      justifyContent: 'center',
  },
  emptyText: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 30,
    fontSize: 16,
    fontWeight: '500'
  }
});
