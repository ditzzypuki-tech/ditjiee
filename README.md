# DITZ MARKET — versi server (Netlify Functions + Netlify Blobs)

Pembayaran TIDAK pernah disetujui otomatis. Hanya sesi admin yang bisa mengubah status pesanan.

## Cara deploy (wajib lewat GitHub atau Netlify CLI, bukan drag-and-drop)
Konfigurasi `netlify.toml` di root repo menetapkan base directory ke `.` sehingga tidak memakai pengaturan `dashboard` yang tidak tersedia. File situs berada di `public/`, sedangkan fungsi server berada di `netlify/functions/`. Tidak diperlukan perintah build untuk situs statis ini. Simpan file hasil ekstraksi di GitHub; Netlify tidak mengekstrak `ditz-market-server.zip` secara otomatis.

1. Upload folder ini ke repo GitHub, lalu di Netlify: Add new site → Import from Git. (Atau: `npm i -g netlify-cli && netlify deploy --prod`.)
2. Site configuration → Environment variables, isi 3 variabel:
   - ADMIN_USERNAME  = adit
   - ADMIN_PASSWORD  = password admin kamu (panjang, unik)
   - SESSION_SECRET  = teks acak minimal 32 karakter (mis. dari `openssl rand -hex 32`)
3. Deploy ulang. Buka /admin dan masuk dengan akun di atas.

## Catatan
- Data (akun, pesanan, bukti, pengaturan) tersimpan di Netlify Blobs.
- Password admin tidak ada di kode; ganti lewat ADMIN_PASSWORD lalu deploy ulang.
- Login dibatasi 5 percobaan salah per 15 menit. Password pembeli di-hash (scrypt).
- Top up tidak dikirim otomatis ke supplier: admin menandai "Berhasil" manual.
- Harga dasar server ada di netlify/functions/catalog.mjs. Harga paket bisa diubah dari Admin > Produk tanpa menyentuh file.
  Jika kamu mengubah daftar paket Mobile Legends di js/ml-catalog.js, samakan juga isi ML_FLAT di catalog.mjs.
