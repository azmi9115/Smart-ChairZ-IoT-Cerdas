import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import { useBLE } from '../../context/BLEContext';
import { Ionicons } from '@expo/vector-icons';
import { clearHistoryData } from '../../services/FirebaseService';

export default function HistoryScreen() {
  const { historyLogs, clearHistory } = useBLE();

  const handleClear = () => {
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to clear the posture history?",
      [
        { text: "Cancel", style: "cancel" },
        { 
            text: "Yes, Clear It", 
            onPress: () => {
                clearHistory();
                clearHistoryData();
            },
            style: "destructive"
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Activity Logs</Text>
            <Text style={styles.subtitle}>Posture History</Text>
          </View>
          {historyLogs.length > 0 && (
              <TouchableOpacity style={styles.iconBtn} onPress={handleClear}>
                <Ionicons name="trash-outline" size={24} color="#ef4444" />
              </TouchableOpacity>
          )}
      </View>

      <View style={styles.listContainer}>
        <FlatList
          data={historyLogs}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const splitIndex = item.indexOf(' : ');
            const time = item.substring(0, splitIndex);
            const status = item.substring(splitIndex + 3);
            
            const isIdeal = status === 'Sitting position is ideal';

            return (
              <View style={styles.historyItem}>
                <View style={[styles.iconBox, { backgroundColor: isIdeal ? '#d1fae5' : '#fee2e2' }]}>
                  <Ionicons name={isIdeal ? "checkmark-circle" : "warning"} size={24} color={isIdeal ? "#10b981" : "#ef4444"} />
                </View>
                <View style={styles.itemTextContainer}>
                  <Text style={styles.statusText}>{status}</Text>
                  <Text style={styles.timeText}>{time}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
              <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconRadius}>
                      <Ionicons name="document-text-outline" size={48} color="#94a3b8" />
                  </View>
                  <Text style={styles.emptyText}>No history available yet.</Text>
                  <Text style={styles.emptySub}>Sit on the chair to record data.</Text>
              </View>
          }
        />
      </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  iconBtn: {
      backgroundColor: '#fee2e2',
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
  },
  listContainer: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#cbd5e1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  itemTextContainer: {
    flex: 1,
  },
  statusText: {
    color: '#1e293b',
    fontSize: 15,
    fontWeight: '700',
  },
  timeText: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyIconRadius: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#e2e8f0',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
  },
  emptyText: {
    color: '#334155',
    fontSize: 18,
    fontWeight: '700',
  },
  emptySub: {
      color: '#94a3b8',
      fontSize: 14,
      marginTop: 8,
      fontWeight: '500',
  }
});
