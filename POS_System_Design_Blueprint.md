# BLUEPRINT SISTEM KASIR MODERN (FULL MODULE)
*Dokumen Spesifikasi Teknis & Operasional*

---

## 1. Ringkasan Eksekutif (Executive Summary)

Dokumen ini berisi rancangan arsitektur lengkap untuk **Sistem Kasir (Point of Sales)** yang terintegrasi. Sistem ini difokuskan pada tiga pilar utama:
1.  **Keuangan & Akuntansi**: Laporan otomatis (Laba/Rugi) yang akurat berdasarkan COGS dan pengeluaran operasional.
2.  **Manajemen Shift & Keamanan**: Kontrol kas fisik yang ketat melalui mekanisme Open/Close Shift dan rekonsiliasi otomatis untuk mencegah fraud.
3.  **Manajemen Inventory**: Pelacakan stok bahan baku (Raw Material) dan produk jadi secara real-time dengan resepi (Recipe) dan kartu stok.
4.  **Hardware Interface**: Integrasi printer thermal Bluetooth (58mm/80mm) menggunakan protokol ESC/POS standar.

Target pengguna sistem ini adalah UMKM hingga skala menengah (Restoran, Cafe, Retail) yang membutuhkan validasi data transparan.

---

## 2. Modul Laporan Keuangan (Financial Reporting)

Modul ini bertugas mengubah data transaksi mentah menjadi wawasan bisnis yang actionable.

### A. Struktur Data Transaksi (Database Schema)

Tabel-tabel inti yang diperlukan:

**1. Tabel `products`**
*   `id` (PK), `name`, `sku`
*   `cogs` (Harga Pokok - *Penting untuk laba kotor*)
*   `sell_price` (Harga Jual)

**2. Tabel `transactions`**
*   `id` (PK, UUID)
*   `invoice_number` (String, Unique)
*   `shift_id` (FK ke Shift)
*   `cashier_id` (FK ke User)
*   `created_at` (Timestamp)
*   `subtotal` (Decimal)
*   `discount_amount` (Decimal)
*   `tax_amount` (Decimal)
*   `service_charge` (Decimal)
*   `grand_total` (Decimal) - *Amount yang harus dibayar*
*   `payment_method` (Enum: CASH, QRIS, DEBIT, CREDIT)
*   `payment_status` (Enum: PAID, PENDING, VOID)

**3. Tabel `transaction_items`**
*   `id` (PK)
*   `transaction_id` (FK)
*   `product_id` (FK)
*   `quantity` (Int)
*   `cost_price_at_moment` (Decimal) - *Snapshot COGS saat transaksi terjadi*
*   `sell_price_at_moment` (Decimal) - *Snapshot Harga Jual saat transaksi terjadi*
*   `total_line_item` (Decimal)

**4. Tabel `operational_expenses`**
*   `id` (PK)
*   `date` (Date)
*   `category` (Listrik, Sewa, Gaji, Lainnya)
*   `amount` (Decimal)
*   `note` (Text)

### B. Rumus Perhitungan Otomatis

1.  **Total Sales (Omzet)**
    `SUM(transactions.grand_total) WHERE status = 'PAID'`
2.  **Total COGS (HPP Global)**
    `SUM(transaction_items.quantity * transaction_items.cost_price_at_moment)`
3.  **Gross Profit (Laba Kotor)**
    `Total Sales - Total COGS - Tax - Service Charge`
    *(Catatan: Pajak dan Service Charge bukan pendapatan toko, melainkan titipan)*
4.  **Net Profit (Laba Bersih)**
    `Gross Profit - SUM(operational_expenses.amount)`
5.  **AOV (Average Order Value)**
    `Total Sales / Count(transactions)`

### C. Format Laporan & Export

*   **Laporan Harian**: Breakdown per jam, per metode bayar, dan ringkasan kas masuk.
*   **Laporan Bulanan**: P&L (Profit & Loss) simple view.
*   **Export Formats**:
    *   **PDF**: Untuk arsip/owner (Layout rapi, tidak bisa diedit).
    *   **Excel**: Untuk tim finance (Raw data).
    *   **JSON**: Untuk integrasi ke software akuntansi lain (Jurnal/Accurate).

### D. Workflow Laporan
`Input Transaksi` -> `Trigger Database (After Insert)` -> `Update Summary Table (Daily Stats)` -> `User Request Report` -> `Query Aggregated Data` -> `Render View/PDF`

---

## 3. Modul Manajemen Shift Kasir (Shift Management)

Modul kritikal untuk mencegah kebocoran dana internal (employee theft).

### A. SOP Operasional (Standard Operating Procedure)

1.  **Open Shift**: Kasir login, input "Modal Awal" (uang kembalian) yang ada di laci. Sistem mencatat waktu mulai.
2.  **Operasional**: Melakukan transaksi. Tidak boleh menambah/mengambil uang cash tanpa fitur "Cash In/Out".
3.  **Close Shift**:
    *   Kasir menghitung fisik uang di laci (blind count).
    *   Input nominal fisik ke sistem.
    *   Sistem membandingkan (Kas Awal + Penjualan Tunai + Cash In - Cash Out vs Fisik Inputan).
    *   Cetak struk close shift.

### B. Struktur Data / Tabel Database (`shifts`)

*   `id` (PK, UUID)
*   `cashier_id` (FK User)
*   `start_time` (Timestamp)
*   `end_time` (Timestamp, Nullable)
*   `start_cash` (Decimal) - *Modal Awal*
*   `expected_shut_cash` (Decimal) - *Dihitung sistem: Start + Sales Cash*
*   `actual_shut_cash` (Decimal) - *Diinput kasir*
*   `difference` (Decimal) - *Selisih (Actual - Expected)*
*   `status` (OPEN, CLOSED)

### C. UI/UX Rekomendasi

*   **Dashboard Kasir**: Saat status shift = CLOSED, blokir akses ke layar transaksi. Paksa tombol "OPEN SHIFT".
*   **Form Close Shift**: Input field untuk setiap pecahan uang (opsional) atau total saja. Jangan tampilkan "Expected Cash" sebelum kasir memasukkan "Actual Cash" (Blind Count) untuk akurasi.

### D. Rumus Otomatis Validasi

```javascript
ExpectedCash = StartCash + Sum(CashTransactions) + Sum(CashIns) - Sum(CashOuts)
Difference = ActualCashInput - ExpectedCash
```

---


## 4. Modul Manajemen Inventory (Stok & Resep)

Modul ini menangani keluar masuk barang, baik produk jadi maupun bahan baku (ingredients).

### A. Struktur Data Inventory

**1. Tabel `inventory_items` (Bahan Baku)**
*   `id` (PK)
*   `name` (Gula Pasir, Kopi Arabica, Cup 12oz)
*   `unit` (kg, gram, pcs)
*   `current_stock` (Decimal)
*   `minimum_stock` (Decimal) - *Alert point*
*   `cost_per_unit` (Decimal) - *Harga beli rata-rata*

**2. Tabel `product_recipes` (Resep)**
Mengubungkan Produk Jual dengan Bahan Baku.
*   `id` (PK)
*   `product_id` (FK)
*   `inventory_item_id` (FK)
*   `quantity_needed` (Decimal) - *Misal: 1 Kopi Susu butuh 15gr Kopi + 20ml Susu + 1 Cup*

**3. Tabel `inventory_logs` (Kartu Stok)**
Mencatat RIWAYAT setiap pergerakan barang. Vital untuk audit.
*   `id` (PK)
*   `inventory_item_id` (FK)
*   `change_amount` (Decimal) - *Positif untuk masuk, Negatif untuk keluar*
*   `type` (PURCHASE, SALE, ADJUSTMENT, WASTE)
*   `reference_id` (FK ke Transaction ID atau Purchase ID)
*   `balance_after` (Decimal) - *Stok akhir setelah mutasi*
*   `created_at` (Timestamp)

### B. Logika Pengurangan Stok (Auto-Deduct)

Saat transaksi terjadi (`state: PAID`):
1.  Ambil list item transaksi.
2.  Cek referensi resep di table `product_recipes`.
3.  Hitung total bahan baku yang terpakai.
4.  Insert ke `inventory_logs` dengan tipe `SALE`.
5.  Update `current_stock` di tabel `inventory_items`.

### C. SOP Stock Opname (Cek Fisik)

Prosedur wajib mingguan/bulanan:
1.  **Freeze**: Hentikan operasional/input barang sesaat.
2.  **Count**: Hitung fisik gudang.
3.  **Input**: Masukkan angka fisik ke sistem "Stock Opname Form".
4.  **Adjustment**: Sistem menghitung selisih (System vs Fisik).
5.  **Journal**: Selisih minus dicatat sebagai "Biaya Kerusakan/Hilang" (Shrinkage Cost).

---

## 5. Modul Integrasi Printer Bluetooth

Modul hard-core teknis untuk komunikasi hardware.

### A. Alur Teknis

1.  **Scan**: Mencari device Bluetooth di sekitar (Permission: `BLUETOOTH_SCAN`, `ACCESS_FINE_LOCATION` di Android).
2.  **Connect**: Pairing via MAC Address. Buat socket connection insecure RFCOMM.
3.  **Format**: Convert data struk menjadi Byte Array (Uint8Array).
4.  **Send**: Kirim dalam chunk (max 1024 bytes per chunk) untuk menghindari buffer overflow printer.

### B. Format Data & ESC/POS (Command Sheet)

Kode Hex dasar untuk manipulasi printer thermal:

| Perintah | Hex Code | Fungsi |
| :--- | :--- | :--- |
| **INIT** | `1B 40` | Reset printer |
| **ALIGN LEFT** | `1B 61 00` | Rata kiri |
| **ALIGN CENTER** | `1B 61 01` | Rata tengah |
| **ALIGN RIGHT** | `1B 61 02` | Rata kanan |
| **BOLD ON** | `1B 45 01` | Huruf tebal nyala |
| **BOLD OFF** | `1B 45 00` | Huruf tebal mati |
| **FEED LINES** | `1B 64 03` | Maju 3 baris |
| **CUT** | `1D 56 42 00` | Potong kertas (jika ada cutter) |

### C. Troubleshooting Umum

*   **Struk Terpotong**: Biasanya buffer printer penuh. Solusi: Beri `delay` (100ms) antar kiriman chunk data atau antar baris.
*   **Karakter Aneh (Gibberish)**: Baud rate tidak cocok (jarang di Bluetooth, sering di Serial), atau salah encoding teks (gunakan sistem CP437 atau UTF-8 tergantung firmware printer).
*   **58mm vs 80mm**: 58mm max karakter/baris biasanya 32. 80mm max karakter/baris biasanya 48. Sistem harus dinamis memotong string (`word wrap`) berdasarkan lebar ini.

---

## 6. Integrasi Antar Modul

### Alur Transaksi ke Laporan & Shift

1.  User klik **"Bayar"**.
2.  Validasi: Apakah Shift status = `OPEN`? Jika tidak, tolak.
3.  Simpan ke `transactions`.
4.  Update akumulasi `current_shift_stats` (cache update) untuk performa.
5.  Generate **Print Queue** -> kirim ke Printer Service.
6.  **Inventory Trigger**: Jalankan *job* pengurangan stok di background (async) agar UI kasir tidak lemot.
7.  Jika *Online Mode*: Sync ke server cloud untuk Laporan Owner real-time.

---

## 6. Contoh Output Akhir

### A. Contoh Struk (Layout 58mm)

```text
       KOPI SENJA & RINDU
     Jl. Kenangan No. 99, Jkt
       Telp: 0812-3456-7890
--------------------------------
No: INV-231025-001
Tgl: 25/10/2023 14:30
Kasir: Budi (Shift 1)
--------------------------------
1 Kopi Susu Gula Aren    18.000
1 Croissant Almond       25.000
--------------------------------
Subtotal                 43.000
Diskon                        0
Pajak (10%)               4.300
--------------------------------
TOTAL                    47.300
TUNAI                    50.000
KEMBALI                   2.700
--------------------------------
      Terima Kasih Kakak!
      Password Wifi: senja123
```

### B. Contoh JSON Transaksi

```json
{
  "invoice": "INV-20231001-0001",
  "shift_id": "sh_88231",
  "cashier": "Budi",
  "items": [
    { "product": "Kopi Hitam", "qty": 1, "price": 10000, "cogs": 4000 }
  ],
  "totals": {
    "subtotal": 10000,
    "tax": 1000,
    "grand_total": 11000
  },
  "payment": {
    "method": "CASH",
    "amount_tendered": 20000,
    "change": 9000
  }
}
```

---

## 7. Checklist Developer

*   [ ] **Database**: Indexing pada kolom `created_at`, `shift_id`, dan `invoice_number` untuk query cepat.
*   [ ] **Concurrency**: Gunakan *Database Transactions* (Begin Transaction... Commit) saat menyimpan sales agar data tidak parsial jika internet mati/error.
*   [ ] **Security**: Pastikan Kasir tidak bisa `DELETE` transaksi. Koreksi harus via `VOID` transaksi baru (pencatatan negatif) dengan supervisor pin.
*   [ ] **Bluetooth**: Handle state `DISCONNECTED` tiba-tiba saat print. Implementasi auto-reconnect logic.

## 8. Checklist Owner / Bisnis

*   [ ] **Audit Harian**: Cek laporan "Selisih Shift". Jika sering minus kecil (< 1.000) mungkin wajar. Jika besar, investigasi.
*   [ ] **Audit Void**: Periksa laporan transaksi yang di-VOID. Seringkali fraud terjadi dengan cara kasir input -> print -> void -> uang dikantongi.
*   [ ] **Backup**: Pastikan database di-backup cloud otomatis (jika sistem local-first).

---

## 9. Rekomendasi Sistem Tambahan

1.  **Multi-Outlet**: Sinkronisasi stok antar cabang.
2.  **Dual Display**: Layar menghadap pelanggan untuk transparansi harga.
3.  **Anti-Fraud**: Notifikasi WhatsApp ke owner setiap kali terjadi "Close Shift" dengan selisih minus, atau setiap kali ada transaksi "VOID".

---

## 10. Panduan Operasional & Workflow (User Guide)

Berikut adalah algoritma kerja (SOP) untuk setiap aktor pengguna sistem.

### A. ROLE: Kasir (Front Office)

**1. Memulai Shift (Buka Toko)**
*   **Langkah 1**: Login dengan PIN/Scan QR.
*   **Langkah 2**: Klik tombol **"Buka Shift (Open Shift)"**.
*   **Langkah 3**: Hitung uang tunai yang ada di laci (Modal Awal/Petty Cash).
*   **Langkah 4**: Input nominal tersebut ke kolom "Modal Awal".
*   **Langkah 5, Klik "Mulai"**: Sistem mencetak "Slip Buka Shift".

**2. Melakukan Transaksi**
*   **Pilih Produk**: Tap gambar produk di layar. Pilih varian (Es/Panas, Topping) jika ada.
*   **Cek Pesanan**: Pastikan pesanan di sidebar kanan sudah benar.
*   **Checkout**: Klik "Bayar".
*   **Pembayaran**:
    *   *Tunai*: Klik nominal uang pas (Rp50.000) atau input manual. Sistem info Kembalian.
    *   *QRIS/Non-Tunai*: Pilih metode, tunggu status "Success".
*   **Cetak**: Struk keluar otomatis. Serahkan ke pelanggan.

**3. Mengakhiri Shift (Tutup Toko/Ganti Shift)**
*   **Langkah 1**: Klik menu "Shift" -> **"Tutup Shift"**.
*   **Langkah 2**: Lakukan **Blind Count** (Hitung uang fisik di laci TANPA melihat layar komputer).
*   **Langkah 3**: Input total uang kertas & koin ke kolom "Uang Aktual".
*   **Langkah 4**: Klik "Finalize".
*   **Langkah 5**: Sistem akan menampilkan ringkasan Selisih (Selisih + atau -). Cetak "Slip Setoran".
*   **Langkah 6**: Serahkan uang fisik + Slip Setoran ke Supervisor/Owner.

---

### B. ROLE: Inventory Staff (Admin Gudang)

**1. Barang Masuk (Restock)**
*   Gunakan saat belanjaan pasar datang atau supplier kirim barang.
*   Masuk menu **"Inventory"** -> **"Barang Masuk"**.
*   Pilih Bahan Baku (misal: "Susu UHT", "Biji Kopi").
*   Input Jumlah (misal: "12" Liter).
*   Input Harga Beli Total (untuk update HPP rata-rata).
*   Klik **"Simpan"**. Stok otomatis bertambah.

**2. Stock Opname (Cek Fisik Mingguan)**
*   Masuk menu **"Stock Opname"**.
*   Klik **"Mulai Opname Baru"**.
*   Download/Print lembar kerja (opsional).
*   Pergi ke gudang, hitung fisik barang satu per satu.
*   Input angka fisik ke kolom "Qty Fisik".
*   Klik **"Selesai & Sesuaikan"**.
*   *Note*: Jika ada selisih, sistem akan meminta alasan (misal: "Basi", "Jatuh", "Hilang").

---

### C. ROLE: Owner / Manager (Back Office)

**1. Audit Keuangan Harian**
*   Buka dashboard via Laptop/HP.
*   Cek **"Laporan Rekap Shift"**.
*   Perhatikan kolom **"Selisih Kas (Cash Diff)"**.
    *   *Hijau (0)*: Bagus.
    *   *Merah (< -5.000)*: Peringatan. Cek CCTV atau tanya kasir.
*   Verifikasi uang setoran fisik dari kasir vs angka di laporan.

**2. Manajemen Menu & Resep**
*   **Buat Produk Baru**:
    *   Menu "Produk" -> "Tambah".
    *   Isi Nama: "Kopi Gula Aren". Harga Jual: "18.000".
*   **Setting Resep (Penting untuk HPP)**:
    *   Klik tab "Resep/Ingredients".
    *   Tambah item: "Espresso" (30ml), "Gula Aren" (20ml), "Susu" (100ml).
    *   Sistem akan otomatis menghitung **HPP (Cost)** produk tersebut (misal: Rp6.500).
    *   Sistem otomatis menghitung **Margin** (misal: 64%).

---
*Blueprint ini disusun oleh AI System Consultant untuk pengembangan segera.*
