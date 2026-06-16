#include <Arduino.h>
#include <HX711.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include "model.h" 

// ---------------- Tetapan HX711 ----------------
#define DT1 35  // Depan Kanan
#define SCK1 36
#define DT2 37  // Belakang Kanan
#define SCK2 38
#define DT3 9   // Belakang Kiri
#define SCK3 10
#define DT4 41  // Depan Kiri
#define SCK4 42

HX711 scale1, scale2, scale3, scale4;

// --------------- Tetapan FSR ---------------
#define FSR_L 4 
#define FSR_R 5 
#define FSR_THRESHOLD 150 

// --------------- Tetapan Relay Aktuator ----------------
#define RELAY_PIN 3       // Relay untuk Vibrator
#define RELAY_HPL_PIN 12  // Relay untuk HPL (Baru)

// --------------- Tetapan BLE ------------------
#define SERVICE_UUID      "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define SENSOR_CHAR_UUID  "beb5483e-36e1-4688-b7f5-ea07361b26a8"
#define POSTURE_CHAR_UUID "e3c1e8a6-b79f-4a1a-9291-cc6d82e914ef"

BLEServer* pServer = nullptr;
BLECharacteristic* sensorChar = nullptr;
BLECharacteristic* postureChar = nullptr;

bool deviceConnected = false;
bool oldDeviceConnected = false;

// --- Pembolehubah Global Ofset FSR ---
int fsrL_offset = 0;
int fsrR_offset = 0;

// --- Pembolehubah Logik Pengesahan Postur ---
int validatedLabelCode = 0;       
int lastRawLabel = -1;           
unsigned long validationStartTime = 0; 
bool isWaitingForValidation = false;
#define VALIDATION_TIME_MS 1000  

// ----------------- Inferensi Model MLP (Sinkronisasi UI) ------------------
int interpretMLP(float s1, float s2, float s3, float s4, int s5, int s6, String& labelStr) {
  double input_arr[6] = { (double)s1, (double)s2, (double)s3, (double)s4, (double)s5, (double)s6 };
  
  apply_robust_scaler(input_arr);
  int pred_idx = mlp_predict(input_arr); 
  
  /* MAPPING SINKRONISASI:
     Output Model -> Kode Gambar Aplikasi
  */
  switch(pred_idx) {
    case 0: 
      labelStr = "Duduk Ideal";          
      return 5; // Kode UI: 5
    case 1: 
      labelStr = "Duduk Terlalu ke Kiri"; 
      return 3; // Kode UI: 3
    case 2: 
      labelStr = "Punggung Terlalu Maju"; 
      return 1; // Kode UI: 1
    case 3: 
      labelStr = "Duduk Terlalu ke Kanan"; 
      return 4; // Kode UI: 4
    case 4: 
      labelStr = "Duduk Terlalu Maju";    
      return 2; // Kode UI: 2
    case 5: 
      labelStr = "Tidak Duduk";          
      return 0; // Kode UI: 0
    default: 
      labelStr = "Duduk Ideal";          
      return 5;
  }
}

class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) override { deviceConnected = true; }
  void onDisconnect(BLEServer* pServer) override { deviceConnected = false; }
};

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);

  scale1.begin(DT1, SCK1); scale2.begin(DT2, SCK2);
  scale3.begin(DT3, SCK3); scale4.begin(DT4, SCK4);

  // Calibration Factor Sesuai Tabel 4.4
  scale1.set_scale(38085); scale2.set_scale(41293);
  scale3.set_scale(38450); scale4.set_scale(44408);

  Serial.println("PROSES TARE...");
  delay(1000);

  // Ambil baseline FSR
  long sumL = 0, sumR = 0;
  for(int i = 0; i < 20; i++) {
    sumL += analogRead(FSR_L);
    sumR += analogRead(FSR_R);
    delay(20);
  }
  fsrL_offset = sumL / 20;
  fsrR_offset = sumR / 20;
  
  scale1.tare(); scale2.tare(); scale3.tare(); scale4.tare();
  
  // Setup Pin Aktuator
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
  
  pinMode(RELAY_HPL_PIN, OUTPUT);
  digitalWrite(RELAY_HPL_PIN, LOW);

  BLEDevice::init("SmartChairZ");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  BLEService* pService = pServer->createService(SERVICE_UUID);

  sensorChar = pService->createCharacteristic(SENSOR_CHAR_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  sensorChar->addDescriptor(new BLE2902());
  postureChar = pService->createCharacteristic(POSTURE_CHAR_UUID, BLECharacteristic::PROPERTY_NOTIFY);
  postureChar->addDescriptor(new BLE2902());

  pService->start();
  BLEDevice::startAdvertising();
  Serial.println("Sistem Nirva Siap");
}

void loop() {
  if (deviceConnected) {
    // 1. Baca Load Cells
    float s1 = max((float)0.0, scale1.get_units(1));
    float s2 = max((float)0.0, scale2.get_units(1));
    float s3 = max((float)0.0, scale3.get_units(1));
    float s4 = max((float)0.0, scale4.get_units(1));

    // 2. Baca FSR & Binarisasi
    int raw_v5 = max(0, (int)analogRead(FSR_L) - fsrL_offset);
    int raw_v6 = max(0, (int)analogRead(FSR_R) - fsrR_offset);
    int s5 = (raw_v5 > FSR_THRESHOLD) ? 1 : 0;
    int s6 = (raw_v6 > FSR_THRESHOLD) ? 1 : 0;

    // 3. Inferensi MLP
    String labelStr;
    int currentRawLabel = interpretMLP(s1, s2, s3, s4, s5, s6, labelStr);

    // 4. Logika Validasi (Debouncing Postur)
    if (currentRawLabel == validatedLabelCode) {
      isWaitingForValidation = false;
    } else {
      if (!isWaitingForValidation || currentRawLabel != lastRawLabel) {
        isWaitingForValidation = true;
        validationStartTime = millis();
        lastRawLabel = currentRawLabel;
      }
      if (millis() - validationStartTime >= VALIDATION_TIME_MS) {
        validatedLabelCode = currentRawLabel;
        isWaitingForValidation = false;
      }
    }

    // 5. Update Karakteristik BLE
    String sensorData = String(s1, 1) + "," + String(s2, 1) + "," + String(s3, 1) + "," + String(s4, 1);
    sensorChar->setValue(sensorData.c_str());
    sensorChar->notify();

    String postureData = String(validatedLabelCode) + "," + String(s5) + "," + String(s6);
    postureChar->setValue(postureData.c_str());
    postureChar->notify();

    // 6. Kontrol Aktuator (Vibrator & HPL)
    // Relay ON jika posisi salah (1, 2, 3, 4)
    // Relay OFF jika Tidak Duduk (0) atau Duduk Ideal (5)
    if (validatedLabelCode != 5 && validatedLabelCode != 0) {
      digitalWrite(RELAY_PIN, HIGH);     // Nyalakan Vibrator
      digitalWrite(RELAY_HPL_PIN, HIGH); // Nyalakan Relay HPL
    } else {
      digitalWrite(RELAY_PIN, LOW);      // Matikan Vibrator
      digitalWrite(RELAY_HPL_PIN, LOW);  // Matikan Relay HPL
    }

    Serial.printf("Data:%s | Label:%d (%s)\n", sensorData.c_str(), validatedLabelCode, labelStr.c_str());
  }

  // Auto Re-advertising
  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
    oldDeviceConnected = deviceConnected;
  }
  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }

  delay(100); 
}