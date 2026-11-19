# Ketentuan asset video → JPG (hero cuaca)

## Mode yang harus Anda sediakan

**Fase waktu (timezone lokasi):** `sunrise`, `day`, `sunset`, `night`

**Kondisi cuaca:** `clear`, `partly-cloudy`, `cloudy`, `rain`, `thunderstorm`

Total kombinasi maksimal: **4 × 5 = 20 set** (boleh kurang dulu; yang tidak ada fallback ke gradient placeholder).

## Struktur folder

```
frames/
  day-clear/
    ezgif-frame-001.jpg
    ezgif-frame-002.jpg
    …
  night-rain/
    …
```

Nama folder: `{phase}-{condition}` (pakai strip, bukan spasi).

Setelah siap, di `src/config.js` set:

```js
export const FRAMES_BASE = './frames';
```

## Produksi video & export frame

| Aspek | Rekomendasi |
|--------|-------------|
| **Rasio** | **16:9** (hero lebar penuh; tinggi stage ≈ 66.67vh). Alternatif mobile-first: 9:16 dipotong dengan `object-fit: cover` + `object-position` (default `center 38%`). |
| **Resolusi sumber** | **1920×1080** (atau 2560×1440 jika ingin lebih tajam di desktop). |
| **FPS sumber** | **24 atau 30 fps** saat render video. Untuk web, putar sequence di **12–24 fps** (hemat bandwith; gerakan halus tetap cukup). |
| **Durasi loop** | **4–8 detik** per clip. Hindari loop >10s kecuali file sangat ringan. |
| **Jumlah frame** | `durasi × fps_playback`. Contoh: 6s × 24 fps = **144 frame**; 5s × 20 fps = **100 frame**. |
| **Format** | **JPEG** progressive, quality **80–85%**, subsampling 4:2:0. Target **~80–150 KB/frame** → satu set ~8–22 MB (kompres ulang jika perlu). |
| **Penamaan** | Padding 3 digit: `ezgif-frame-001.jpg` … atau `f-0001.jpg` (nanti bisa disesuaikan di kode). Urutan harus konsisten. |
| **Loop mulus** | Frame **pertama ≈ frame terakhir** (seamless loop). Atau buat **crossfade 8–15 frame** di edit sebelum export. Uji dengan putar berulang. |
| **Konsistensi antar mode** | Horizon / vanishing point / kamera tetap sama antar set dalam satu fase; hanya cahaya & cuaca yang berubah → transisi antar mode tidak “loncat”. |

## Transisi di aplikasi (nanti)

- **Ganti mode (cuaca/jam):** crossfade **400–600 ms** opacity pada `<img>` atau double-buffer dua layer.
- **Preload:** muat frame 1 + setengah loop sebelum tampil; debounce refresh API **~300 ms**.
- **Petir/hujan:** boleh satu loop pendek (3–4s) dengan event kilat di frame tertentu; tidak wajib frame-by-frame random.

## Checklist sebelum upload

1. Semua frame sama resolusi & aspect ratio.
2. Tidak ada watermark / metadata besar.
3. Loop tanpa “pop” di sambungan.
4. Folder name persis sama dengan daftar mode di atas.

Playback loop penuh (requestAnimationFrame) belum diaktifkan; saat ini hanya **frame 001** sebagai preview setelah `FRAMES_BASE` diisi.