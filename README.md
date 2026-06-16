# Smart ChairZ: Sistem Pemantauan dan Koreksi Postur Duduk Berbasis IoT & Edge AI

Proyek ini merupakan pemenuhan Tugas Besar Mata Kuliah IoT Cerdas. Smart ChairZ adalah prototipe kursi pintar *end-to-end* yang mengintegrasikan sensor, aktuator, dan kecerdasan buatan (Tiny AI) untuk memantau, mengklasifikasi, dan mengoreksi postur duduk pengguna secara *real-time*.

## 📌 Deskripsi Sistem
Sistem ini menggunakan ESP32-S3 sebagai mikrokontroler utama yang membaca data dari sensor *Load Cell* dan *Force Sensing Resistor* (FSR). Data tekanan kemudian diproses menggunakan model AI (*Multi-Layer Perceptron*) yang ditanamkan langsung pada perangkat (*Edge Computing*) untuk mengklasifikasikan 5 jenis postur duduk. 

Jika terdeteksi postur yang tidak ideal, sistem akan memberikan umpan balik (*feedback*) berupa getaran melalui motor haptik dan visualisasi pada aplikasi *mobile* via *Bluetooth Low Energy* (BLE).

## 🗂️ Struktur Repositori
Repositori ini berisi *source code* utama untuk pemrosesan AI, implementasi IoT, dan *dashboard mobile*:

* **`ai_model/`**: Berisi *dataset* CSV dan Jupyter Notebook (`training_mlp_final.ipynb`) yang memuat alur kerja pembuatan model AI, mulai dari pra-pemrosesan data, pelatihan model MLP, hingga konversi model menjadi format C-array untuk mikrokontroler.
* **`firmware_esp32/`**: Berisi *source code* Arduino IDE (`test_pertama.ino`) untuk ESP32-S3 yang menangani pembacaan sensor, komunikasi BLE, kontrol aktuator, serta *file header* (`model.h`) yang berisi bobot model AI hasil pelatihan (*TinyML*) untuk inferensi *offline*.
* **`mobile_dashboard/`**: Berisi *source code* aplikasi *mobile* yang dibangun menggunakan framework **React Native / Expo**. Aplikasi ini berfungsi sebagai *dashboard* antarmuka pengguna.

## 🛠️ Perangkat Keras (Hardware)
* Mikrokontroler: ESP32-S3
* Sensor Berat: Load Cell + Modul HX711
* Sensor Tekanan: Force Sensing Resistor (FSR)
* Aktuator: Motor Getar (Haptic Feedback)

## 📊 Dashboard & Visualisasi Data
Visualisasi data dan monitoring dilakukan melalui aplikasi *mobile* pendamping yang terhubung via BLE. Fitur *dashboard* meliputi:
* Menampilkan status postur duduk saat ini (5 klasifikasi: Ideal, Maju, Miring Kanan, Miring Kiri, Punggung Maju).
* Pembaruan data otomatis (*auto-update*) secara kontinu dengan latensi sangat rendah (~116 ms).
* Antarmuka visual untuk riwayat atau analitik pemakaian kursi.
