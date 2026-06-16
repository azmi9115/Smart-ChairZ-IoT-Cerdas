import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { BleManager, Device, Subscription } from 'react-native-ble-plx';
import { Buffer } from 'buffer';
import { logPostureHistory } from '../services/FirebaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DeviceInfo from 'expo-device';
import * as Notifications from 'expo-notifications';

export const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
export const CHAR1_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';
export const CHAR2_UUID = 'e3c1e8a6-b79f-4a1a-9291-cc6d82e914ef';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const getPostureText = (code: string) => {
  switch (code) {
    case '0': return "No User Detected";
    case '1': return "Back Position Too Forward";
    case '2': return "Sitting Position Too Forward";
    case '3': return "Sitting Position Too Far to the Left";
    case '4': return "Sitting Position Too Far to the Right";
    default: return "Sitting position is ideal"; // typically '5'
  }
};

export type SensorData = {
  leftThigh: number;
  leftWaist: number;
  rightWaist: number;
  rightThigh: number;
};

export type PostureData = {
  code: string;
  leftBack: number;
  rightBack: number;
  postureText: string;
};

interface BLEContextType {
  manager: BleManager | null;
  devices: Device[];
  connectedDevice: Device | null;
  isScanning: boolean;
  scanForPeripherals: () => void;
  stopScanning: () => void;
  connectToDevice: (device: Device) => void;
  disconnectFromDevice: () => void;
  sensorData: SensorData;
  postureData: PostureData;
  historyLogs: any[];
  loadHistory: () => void;
  clearHistory: () => void;
}

const BLEContext = createContext<BLEContextType | null>(null);

export const useBLE = () => {
  const context = useContext(BLEContext);
  if (!context) {
    throw new Error('useBLE must be used within a BLEProvider');
  }
  return context;
};

const bleManager = new BleManager();

export const BLEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [manager] = useState(bleManager);
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  const [sensorData, setSensorData] = useState<SensorData>({ leftThigh: 0, leftWaist: 0, rightWaist: 0, rightThigh: 0 });
  
  const [postureData, setPostureData] = useState<PostureData>({ code: '5', leftBack: 0, rightBack: 0, postureText: 'Sitting position is ideal' });
  const lastPosturRef = useRef<string>('INIT');
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);

  const deviceRef = useRef<Device | null>(null);

  useEffect(() => {
    loadHistory();
    requestNotificationPermissions();
    
    // Auto Connect on start
    requestPermissions().then(granted => {
        if (granted) scanForPeripherals();
    });
    
    return () => { manager.destroy(); };
  }, []);

  const requestNotificationPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
        const apiLevel = typeof Platform.Version === 'number' ? Platform.Version : parseInt(Platform.Version as string, 10);
        if (apiLevel >= 31) {
            const granted = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ]);
            return granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === 'granted' &&
                   granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === 'granted';
        } else {
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
    }
    return true;
  };

  const scanForPeripherals = async () => {
    if (connectedDevice) return; // Don't scan if already connected
    
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
        Alert.alert("Permission Required", "Bluetooth permissions are missing");
        return;
    }
    
    const lastDeviceId = await AsyncStorage.getItem('lastConnectedDeviceId');
    
    setIsScanning(true);
    setDevices([]);
    manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) {
        console.error("Scan Error:", error);
        setIsScanning(false);
        return;
      }
      if (device && device.name) {
        // Fallback: Populate the list for manual connection
        setDevices(prev => {
          if (!prev.find(d => d.id === device.id)) {
            return [...prev, device];
          }
          return prev;
        });

        // Robust Auto-Connect: if we remember you or if your name literally has 'Chair' or 'ESP'
        const isDeviceMemory = lastDeviceId && device.id === lastDeviceId;
        const isDeviceNameFound = device.name === 'SmartChair' || device.name === 'SmartChairz' || device.name === 'ESP32';
        
        if (isDeviceMemory || isDeviceNameFound) {
          manager.stopDeviceScan();
          setIsScanning(false);
          connectToDevice(device);
        }
      }
    });
    
    setTimeout(() => {
        manager.stopDeviceScan();
        setIsScanning(false);
    }, 15000);
  };

  const stopScanning = () => {
      manager.stopDeviceScan();
      setIsScanning(false);
  }

  const connectToDevice = async (device: Device) => {
    try {
      stopScanning();
      const connected = await manager.connectToDevice(device.id);
      
      // Request larger MTU to prevent fragmentation of the 6-sensor string (e.g. 30+ bytes)
      try {
        await connected.requestMTU(128);
      } catch (mtuError) {
        console.log("MTU request failed or not supported", mtuError);
      }

      setConnectedDevice(connected);
      deviceRef.current = connected;
      
      // Save for future auto-connect
      await AsyncStorage.setItem('lastConnectedDeviceId', connected.id);
      
      await connected.discoverAllServicesAndCharacteristics();
      
      manager.onDeviceDisconnected(device.id, async (error, descDevice) => {
        setConnectedDevice(null);
        deviceRef.current = null;

        Notifications.scheduleNotificationAsync({
            content: {
                title: "Bluetooth Terputus",
                body: "Koneksi ke kursi pintar Anda telah terputus.",
            },
            trigger: null,
        });
      });

      startStreamingData(connected);
    } catch (e) {
      console.error("Connection error:", e);
      Alert.alert("Connection Failed", "Could not connect to the device.");
    }
  };

  const disconnectFromDevice = async () => {
      if (deviceRef.current) {
          await manager.cancelDeviceConnection(deviceRef.current.id);
          setConnectedDevice(null);
          deviceRef.current = null;
      }
  }

  const startStreamingData = (device: Device) => {
    device.monitorCharacteristicForService(SERVICE_UUID, CHAR1_UUID, (error, characteristic) => {
      if (error || !characteristic?.value) return;
      const strVal = Buffer.from(characteristic.value, 'base64').toString('ascii');
      const parsed = strVal.split(',');
      if (parsed.length >= 4) {
          const lt = parseFloat(parsed[0]) || 0;
          const lw = parseFloat(parsed[1]) || 0;
          const rw = parseFloat(parsed[2]) || 0;
          const rt = parseFloat(parsed[3]) || 0;

          setSensorData({ leftThigh: lt, leftWaist: lw, rightWaist: rw, rightThigh: rt });
      }
    });

    device.monitorCharacteristicForService(SERVICE_UUID, CHAR2_UUID, async (error, characteristic) => {
      if (error || !characteristic?.value) return;
      const strVal = Buffer.from(characteristic.value, 'base64').toString('ascii');
      const parsed = strVal.split(',');
      
      if (parsed.length >= 3) {
          const codeOffset = parsed.length > 3 ? 1 : 0;
          const code = parsed[0 + codeOffset] ? parsed[0 + codeOffset].trim() : '5';
          const leftBackRaw = parsed[1 + codeOffset];
          const rightBackRaw = parsed[2 + codeOffset];
          
          const postureT = getPostureText(code);
          const lb = parseFloat(leftBackRaw || '0');
          const rb = parseFloat(rightBackRaw || '0');

          setPostureData({ code, leftBack: lb, rightBack: rb, postureText: postureT });

          if (code !== lastPosturRef.current) {
              lastPosturRef.current = code;
              
              if (code !== '5') {
                  Notifications.scheduleNotificationAsync({
                      content: {
                          title: "Peringatan Posisi Duduk!",
                          body: postureT,
                          sound: true,
                          priority: Notifications.AndroidNotificationPriority.HIGH,
                      },
                      trigger: null,
                  });
              }
              
              const now = new Date();
              const dateString = `${("0" + (now.getMonth() + 1)).slice(-2)}/${("0" + now.getDate()).slice(-2)}/${now.getFullYear()}`;
              const timeString = `${("0" + now.getHours()).slice(-2)}:${("0" + now.getMinutes()).slice(-2)}:${("0" + now.getSeconds()).slice(-2)} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
              const timestamp = `${dateString} ${timeString}`;
              
              const epoch = Math.floor(now.getTime() / 1000).toString();
              logPostureHistory(epoch, {
                  dateString,
                  timeString,
                  posture: postureT,
                  code: code
              });
              
              const newLog = `${timestamp} : ${postureT}`;
              setHistoryLogs(prev => {
                  const updated = [newLog, ...prev];
                  AsyncStorage.setItem('postureHistory', JSON.stringify(updated));
                  return updated;
              });
          }
      }
    });
  };

  const loadHistory = async () => {
      try {
          const saved = await AsyncStorage.getItem('postureHistory');
          if (saved) setHistoryLogs(JSON.parse(saved));
      } catch (e) {}
  };

  const clearHistory = async () => {
      await AsyncStorage.removeItem('postureHistory');
      setHistoryLogs([]);
  }

  return (
    <BLEContext.Provider value={{
      manager, devices, connectedDevice, isScanning, 
      scanForPeripherals, stopScanning, connectToDevice, disconnectFromDevice,
      sensorData, postureData, historyLogs, loadHistory, clearHistory
    }}>
      {children}
    </BLEContext.Provider>
  );
};
