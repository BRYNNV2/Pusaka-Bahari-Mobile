# 🏛️ Pusaka Bahari — Warisan Nusantara Raja Ali Haji

<p align="center">
  <img src="./assets/images/pusaka_bahari_banner_1776493187345.png" alt="Pusaka Bahari Banner" width="100%" />
</p>

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
- **Liquid Glass Tab Bar** — Navigasi bawah melayang (*floating*) bergaya *frosted glass* (efek kaca blur) dengan fisika perpindahan presisi.
- **Article-Style Gallery Viewer** — Resolusi tinggi galeri artefak yang di-desain menyerupai bacaan artikel majalah premium, lengkap dengan dukungan geser (swipe) dan gestur cubit untuk perbesar (*pinch-to-zoom*).
- **Dynamic Asymmetric Buttons** — Tombol utama asimetris yang futuristik dengan status jam operasional *Real-Time* (Parsing otomatis teks "24 Jam" / "Tutup").

### 📊 Eksplorasi Data Real-Time
- **Hero Dashboard** — Beranda dengan paralaks karosel gambar penuh dan *pill badge* kategori.
- **Arsip Peninggalan** — Penyaringan naskah, artefak, dan monumen yang terintegrasi langsung ke cloud database.
- **Agenda Budaya** — Pelacakan tanggal kegiatan sejarah dengan kartu horizontal.

### 🔐 Autentikasi & Personalisasi Terpusat
- **Supabase Auth** — Sistem login dan mode tamu (*Guest Mode*) yang efisien.
- **Profil Dinamis** — Unggah/Edit avatar dan bio dengan penyimpanan bucket `Supabase Storage`.
- **Manajemen Kredensial** — Verifikasi sandi ganda (*Old Password & New Password*).

### 🛠️ Admin Control Center
Akses eksklusif *Super Admin* tanpa perlu aplikasi terpisah:
- **Pending Upload Flow** — Formulir perantara wajib isi (Judul & Deskripsi) sebelum unggahan foto permanen ke galeri artefak.
- **Full CRUD** — Mengelola seluruh entitas data (Artefak, Agenda, Galeri) langsung dari *smartphone*.

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

### 5. Skema Database Utama (Supabase SQL)
```sql
-- Schema ringkas untuk Artefak & Galeri (contoh)
CREATE TABLE artifacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT,
  name TEXT NOT NULL,
  year TEXT,
  description TEXT,
  image_url TEXT,
  operational_hours TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gallery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artifact_id UUID REFERENCES artifacts(id),
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6. Menjalankan Server Pengembangan
```bash
npx expo start -c
```
*(Pindai kode QR yang muncul di terminal menggunakan Expo Go)*

---

## 👨‍💻 Tentang Pengembang

> Proyek tingkat lanjut ini merupakan karya mandiri dalam rangka mata kuliah **Pemrograman Mobile (Semester 6)**. Didedikasikan untuk membuktikan bahwa aplikasi pengarsipan warisan budaya lokal dapat terlihat *kelas dunia* dan modern.

<p align="center"><b>© 2026 BRYNNV2</b></p>
