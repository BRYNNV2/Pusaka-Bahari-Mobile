# 🏛️ Pusaka Bahari — Warisan Raja Ali Haji

<p align="center">
  <img src="./assets/images/pusaka_bahari_banner_1776493187345.png" alt="Pusaka Bahari Banner" width="100%" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React%20Native-Expo-blue?logo=expo" />
  <img src="https://img.shields.io/badge/Backend-Supabase-green?logo=supabase" />
  <img src="https://img.shields.io/badge/Language-TypeScript-blue?logo=typescript" />
  <img src="https://img.shields.io/badge/Status-Active-brightgreen" />
</p>

---

## 📖 Tentang Aplikasi

**Pusaka Bahari** adalah aplikasi mobile berbasis *React Native (Expo)* yang didedikasikan untuk melestarikan dan memperkenalkan warisan budaya dan intelektual **Raja Ali Haji** — ulama, pujangga, dan sejarawan besar dari Pulau Penyengat, Kepulauan Riau.

Aplikasi ini mengusung antarmuka modern bergaya *flat & minimalist* yang terinspirasi dari aplikasi premium dunia, dengan koneksi *real-time* ke database **Supabase** untuk pengelolaan data yang dinamis.

---

## ✨ Fitur Utama

### 📱 Navigasi & Tampilan
- **Beranda (Home Dashboard)** — Tampilan kartu eksplorasi dinamis yang terhubung langsung ke database
- **Filter Kategori** — Saring warisan berdasarkan tipe: **Artefak, Naskah, Monumen, Benda**
- **Halaman Detail Artefak** — Tampilan lengkap dengan hero image, deskripsi, informasi, galeri foto, dan peninggalan serupa
- **Halaman Galeri** — Koleksi foto dan media warisan
- **Peta Interaktif** — Navigasi lokasi situs bersejarah
- **Agenda Budaya** — Kalender kegiatan dan acara budaya

### 🔐 Autentikasi
- **Login / Register** — Sistem autentikasi lengkap via Supabase Auth
- **Mode Tamu** — Eksplorasi aplikasi tanpa perlu login
- **Manajemen Sesi** — Sesi login persisten dan aman

### 👤 Profil Pengguna
- **Edit Profil** — Ubah nama, bio, dan nomor telepon
- **Upload Foto Profil** — Ubah avatar langsung dari kamera atau galeri
- **Ubah Kata Sandi** — Sistem verifikasi kata sandi lama sebelum pembaruan
- **Header Melengkung** — Desain header profil dengan tampilan gambar bersejarah + sudut melengkung elegan

### 🛠️ Panel Admin (Khusus Admin)
Akses khusus hanya untuk akun dengan hak **admin**, tersembunyi dari pengguna biasa.

| Modul | Fitur |
|-------|-------|
| **Artefak** | Tambah, edit, hapus data artefak + **upload foto cover** |
| **Lokasi (Peta)** | Kelola titik-titik lokasi bersejarah dengan koordinat GPS |
| **Galeri** | Tambah item galeri + **upload foto galeri** |
| **Agenda** | Kelola jadwal acara dan kegiatan budaya |

### 🗄️ Database & Storage (Supabase)
- Tabel: `artifacts`, `map_locations`, `gallery_items`, `agenda`, `profiles`
- Storage Bucket: `artifacts`, `gallery`, `avatars` (semua public)
- Row Level Security (RLS) untuk keamanan data

---

## 🎨 Desain & Estetika

Aplikasi ini dirancang dengan filosofi **"Sultan UI"** — tampilan yang elegan, serius, dan profesional:

- 🎨 **Palet Warna** — Navy Dark (`#0f172a`) + Putih Bersih + Abu-abu Netral
- ✍️ **Tipografi** — Font sistem dengan bobot 700–800 untuk kesan tegas
- 🚫 **Anti-AI Aesthetic** — Tanpa gradasi berlebih, tanpa animasi memantul (*bounce*)
- 📐 **Flat Design** — Tampilan datar, tinggi kontras, bersih dan fungsional
- 🌀 **Header Melengkung** — Sudut bawah header berbentuk busur pada layar Profil

---

## 🏗️ Struktur Proyek

```
Mobileproject/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx        # Beranda utama (Home Dashboard)
│   │   ├── gallery.tsx      # Halaman galeri
│   │   ├── map.tsx          # Peta interaktif
│   │   └── catalog.tsx      # Katalog warisan
│   ├── admin/
│   │   └── index.tsx        # Panel Admin CRUD
│   ├── artifact/
│   │   └── [id].tsx         # Halaman detail artefak (dynamic route)
│   ├── profile.tsx          # Halaman profil pengguna
│   ├── login.tsx            # Halaman login/register
│   └── _layout.tsx          # Layout navigasi utama
├── assets/images/           # Gambar aset lokal
├── contexts/
│   └── AuthContext.tsx      # Global state autentikasi
├── lib/
│   └── supabase.ts          # Konfigurasi Supabase client
└── .env                     # Environment variables (tidak di-commit)
```

---

## ⚙️ Instalasi & Setup

### 1. Clone Repository
```bash
git clone https://github.com/BRYNNV2/Pusaka-Bahari-Mobile.git
cd Pusaka-Bahari-Mobile
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Konfigurasi Environment
Buat file `.env` di root proyek:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Setup Database Supabase
Jalankan SQL berikut di Supabase SQL Editor:
```sql
-- Tabel artefak
CREATE TABLE artifacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT,
  name TEXT NOT NULL,
  year TEXT,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel lokasi peta
CREATE TABLE map_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  latitude FLOAT,
  longitude FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel galeri
CREATE TABLE gallery_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  audio_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel agenda
CREATE TABLE agenda (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5. Jalankan Aplikasi
```bash
npx expo start -c
```
Scan QR Code menggunakan aplikasi **Expo Go** di HP Anda.

---

## 📸 Screenshot

| Beranda | Detail Artefak | Profil | Panel Admin |
|---------|---------------|--------|-------------|
| *(Coming Soon)* | *(Coming Soon)* | *(Coming Soon)* | *(Coming Soon)* |

---

## 🧑‍💻 Dikembangkan dengan

| Teknologi | Keterangan |
|-----------|-----------|
| [Expo](https://expo.dev) | Framework React Native |
| [Supabase](https://supabase.com) | Backend-as-a-Service (Auth + DB + Storage) |
| [TypeScript](https://typescriptlang.org) | Bahasa pemrograman |
| [Expo Router](https://expo.github.io/router) | Navigasi berbasis file |
| [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) | Animasi performa tinggi |
| [expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/) | Upload foto profil & artefak |

---

## 👨‍🎓 Informasi Akademik

> Proyek ini dikembangkan sebagai bagian dari mata kuliah **Pemrograman Mobile** — Semester 6.
> Berfokus pada pelestarian warisan budaya **Raja Ali Haji** dari Kepulauan Riau secara digital.

---

<p align="center">Dibuat dengan ❤️ oleh BRYNNV2 · 2026</p>
