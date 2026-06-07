# 🏛️ Pusaka Bahari — Warisan Nusantara Raja Ali Haji

<p align="center">
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React%20Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" /></a>
  <a href="https://expo.dev/"><img src="https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white" /></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" /></a>
</p>

<h3 align="center">Eksplorasi Sejarah yang Elegan, Cepat, dan Interaktif</h3>

---

## 📖 Tentang Proyek

**Pusaka Bahari** adalah aplikasi *mobile* tingkat lanjut berbasis **React Native (Expo)** yang difokuskan pada digitalisasi warisan sejarah, budaya, dan naskah-naskah peninggalan **Raja Ali Haji** di Pulau Penyengat, Kepulauan Riau.

Dirancang dengan standar *premium-grade UI/UX*, aplikasi ini menyatukan estetika *modern minimalism* dan interaksi cerdas seperti *Liquid Glass Tab Bar* dan *Article-Style Lightbox* untuk menghadirkan pengalaman belajar sejarah yang tidak membosankan.

---

## ✨ Fitur Unggulan

### 🎨 Premium UI/UX (Sultan Design)
- **True Dark/Light Theme** — Transisi tema mulus tanpa *flash* yang didukung penuh di seluruh halaman, beradaptasi dengan preferensi pengguna.
- **Liquid Glass Tab Bar** — Navigasi bawah melayang (*floating*) bergaya *frosted glass* (efek kaca blur) dengan fisika perpindahan presisi.
- **Article-Style Gallery Viewer** — Resolusi tinggi galeri artefak yang didesain menyerupai bacaan artikel majalah premium, lengkap dengan *pinch-to-zoom*.
- **Skeleton & Cross-Fade Loading** — Efek *shimmer/pulse* canggih dari Reanimated dan transisi layar mulus tanpa *layout shift* yang mengganggu.

### 📊 Eksplorasi & Media Interaktif
- **Hero Dashboard** — Beranda dengan paralaks karosel gambar penuh dan lencana pintar adaptif.
- **Spotify-Style Audio Player** — Pemutar audio eksklusif untuk mendengarkan gurindam/sejarah dengan antarmuka premium dan pemutaran sinkron.
- **Peta Pintar Terintegrasi** — Visualisasi lokasi monumen dan peninggalan bersejarah secara presisi.

### 🔐 Autentikasi & Personalisasi Terpusat
- **Supabase Auth** — Sistem login kuat dan mode tamu (*Guest Mode*) yang tangguh.
- **Profil Dinamis** — Unggah/Edit avatar dan formulir pengguna menggunakan *bucket* `Supabase Storage`.
- **Manajemen Kredensial** — Verifikasi pembaruan kata sandi ganda yang aman.

### 🛠️ Admin Control Center
Akses eksklusif *Super Admin* langsung dari dalam aplikasi:
- **Pending Upload Flow** — Formulir pratinjau sebelum mengunggah foto secara permanen ke galeri.
- **Full CRUD** — Mengelola entitas sejarah (Artefak, Agenda, Galeri, Audio) langsung dari ujung jari Anda.

---

## 🏗️ Arsitektur Teknologi

- **Frontend Framework**: Expo / React Native
- **Navigation**: Expo Router (v3) dengan dukungan `Tabs` tersuai.
- **Backend & Database**: PostgreSQL on Supabase
- **Authentication**: Supabase Auth (Email/Password)
- **File Storage**: Supabase Storage Buckets
- **Animasi & Gestur**: `react-native-reanimated` & `expo-blur`
- **Media Handlers**: `expo-image-picker` & `react-native-image-viewing`

---

## ⚙️ Panduan Instalasi Lokal

### 1. Prasyarat
Pastikan mesin Anda sudah terpasang:
- [Node.js](https://nodejs.org/en/) (LTS Version)
- [Git](https://git-scm.com/)
- Aplikasi **Expo Go** pada ponsel Anda (iOS / Android)

### 2. Kloning Repositori
```bash
git clone https://github.com/BRYNNV2/Pusaka-Bahari-Mobile.git
cd Pusaka-Bahari-Mobile
```

### 3. Instalasi Dependensi
```bash
npm install
```

### 4. Konfigurasi Variabel Lingkungan
Buat file `.env` di *root directory* proyek Anda:
```env
EXPO_PUBLIC_SUPABASE_URL=https://[ID_PROYEK].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=[KUNCI_ANON_PROYEK]
```

### 5. Menjalankan Server Pengembangan
```bash
npx expo start -c
```
*(Pindai kode QR yang muncul di terminal menggunakan Expo Go)*

---

## 👨‍💻 Tentang Pengembang

> Proyek tingkat lanjut ini merupakan karya mandiri dalam rangka mata kuliah **Pemrograman Mobile (Semester 6)**. Didedikasikan untuk membuktikan bahwa aplikasi pengarsipan warisan budaya lokal dapat terlihat *kelas dunia* dan modern.

<p align="center"><b>© 2026 BRYNNV2</b></p>
