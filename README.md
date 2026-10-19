# SmartStudy — Asisten Perencanaan Akademik Mahasiswa

## Deskripsi

SmartStudy adalah aplikasi web sederhana untuk membantu mahasiswa mengatur
tugas kuliah, tanggal pengumpulan, dan jadwal kelas mingguan dalam satu tempat.
Antarmuka dirancang agar informasi akademik mudah dikenali dan diperbarui tanpa
perlu mengingat detail dari berbagai sumber.

Aplikasi berjalan langsung di browser menggunakan HTML, CSS, dan JavaScript.
Data disimpan di LocalStorage browser, sehingga proyek dapat di-host sebagai
situs statis, termasuk melalui GitHub Pages, tanpa server atau basis data.

## Tujuan

1. Menyediakan tempat terpusat untuk mencatat tugas dan jadwal kuliah.
2. Membantu mahasiswa melihat tenggat, tugas terlambat, dan progres mingguan.
3. Memudahkan pencarian tugas melalui filter mata kuliah dan status.
4. Menampilkan kegiatan akademik pada kalender dan agenda berdasarkan tanggal.
5. Menerapkan prinsip IMK: mengurangi beban kognitif, mengutamakan recognition
   over recall, menjaga konsistensi, dan memberikan umpan balik yang jelas.

## Fitur

- **Ringkasan** tugas, tenggat dalam tujuh hari, dan tugas yang selesai minggu ini.
- **Daftar tugas terpisah** dengan filter mata kuliah dan status: semua, belum
  selesai, selesai, atau terlambat.
- **Formulir tugas dua langkah**: isi nama, mata kuliah, dan catatan terlebih
  dahulu; lalu tentukan tanggal serta waktu pengumpulan.
- **Status tugas** yang diperbarui berdasarkan tenggat dan status selesai.
- **Konfirmasi sebelum menghapus** tugas atau jadwal.
- **Jadwal kuliah mingguan** dengan mata kuliah, hari, waktu mulai dan selesai,
  ruang, dosen, serta catatan opsional.
- **Kalender dan agenda** yang menggabungkan tenggat tugas dan jadwal kuliah.
- **Progres tugas mingguan** dan pengingat tenggat di halaman.
- **Notifikasi browser opsional** untuk tugas dengan tenggat hari ini. Izin
  notifikasi diminta hanya setelah pengguna menekan tombol pengingat.
- **Tampilan responsif** untuk desktop dan perangkat mobile.
- **Interaksi langsung**: kartu ringkasan dapat membuka daftar tugas dengan
  filter terkait, dan judul tugas dapat dibuka untuk melihat catatan serta
  tanggal pengumpulan.

## Penyimpanan data

Data disimpan pada browser dan perangkat yang sedang digunakan:

- `smartstudy.tasks.v1` menyimpan tugas.
- `smartstudy.schedules.v1` menyimpan jadwal kuliah mingguan.

LocalStorage tidak menyinkronkan data ke perangkat atau pengguna lain. Data
dapat hilang jika penyimpanan situs dihapus atau pengguna berpindah browser.
Ekspor, sinkronisasi akun, dan pemulihan dari server belum tersedia.

Notifikasi browser memerlukan izin pengguna dan dukungan browser. Pengingat
dapat diperiksa saat aplikasi dibuka; aplikasi ini tidak menggunakan server
atau service worker untuk mengirim notifikasi ketika halaman dan browser
tertutup.

## Struktur proyek

```text
.
├── index.html   # Struktur halaman dan formulir
├── styles.css   # Tampilan responsif dan interaksi visual
├── app.js       # Logika aplikasi, kalender, dan LocalStorage
└── README.md    # Dokumentasi proyek
```

## Cara menjalankan secara lokal

Tidak diperlukan instalasi dependensi atau proses build.

1. Unduh atau clone repositori.
2. Buka `index.html` langsung di browser, atau jalankan server web lokal dari
   folder proyek.
3. Tambahkan tugas atau jadwal kuliah melalui aplikasi.

Untuk mencoba notifikasi browser, gunakan `localhost` atau situs HTTPS dan
berikan izin notifikasi saat diminta. Perilaku izin dapat berbeda antar-browser.

## Hosting dengan GitHub Pages

1. Pastikan `index.html`, `styles.css`, dan `app.js` berada di root repositori.
2. Push berkas proyek ke repositori GitHub.
3. Buka **Settings → Pages** pada repositori.
4. Pada **Build and deployment**, pilih **Deploy from a branch**.
5. Pilih branch yang berisi proyek (misalnya `main`) dan folder `/ (root)`,
   lalu tekan **Save**.
6. Tunggu proses deployment selesai. GitHub Pages akan menampilkan URL situs
   pada halaman Pages.

Karena aplikasi tidak memiliki backend atau langkah build, GitHub Pages dapat
menyajikan berkas statis proyek secara langsung. Gunakan tautan relatif seperti
`styles.css` dan `app.js` agar aset dapat dimuat pada URL GitHub Pages, termasuk
ketika repositori diterbitkan sebagai project site.

## Keterbatasan

1. Data hanya tersedia pada browser dan perangkat tempat data dimasukkan.
2. Jadwal kuliah berulang setiap minggu pada hari yang dipilih; hari libur,
   perubahan jadwal per tanggal, dan kalender akademik institusi belum dikelola.
3. Notifikasi tidak dijamin terkirim ketika halaman atau browser tertutup.
4. Aplikasi belum memiliki akun, sinkronisasi cloud, kolaborasi, atau cadangan
   data otomatis.
5. Penggunaan `localStorage` memerlukan browser yang mengaktifkan penyimpanan
   situs. Mode privat atau kebijakan browser tertentu dapat membatasi
   penyimpanan.
