# School LMS (Android WebView)

Membungkus https://man19jkt.assessment.web.id/login menjadi aplikasi Android.

## Cara build APK
1. Instal Android Studio (versi terbaru).
2. File > Open > pilih folder ini. Tunggu Gradle sync selesai (butuh internet).
3. Colokkan HP (aktifkan USB debugging) lalu tekan Run, atau
   Build > Build Bundle(s) / APK(s) > Build APK(s).
4. Hasil: app/build/outputs/apk/debug/app-debug.apk -> kirim ke HP dan instal.

Untuk rilis/Play Store: Build > Generate Signed Bundle / APK.

## Kustomisasi
- Domain induk: app/build.gradle.kts (BASE_DOMAIN). Kode sekolah menjadi subdomain: https://<kode>.assessment.web.id/login
- Ganti sekolah: tekan lama ikon aplikasi > Ganti sekolah
- Nama aplikasi: app/src/main/res/values/strings.xml
- Warna: res/values/colors.xml
- Ikon: res/drawable/ic_launcher.xml

## Build lewat GitHub (tanpa Android Studio)
1. Unggah seluruh isi folder ini ke repositori GitHub (termasuk folder .github).
2. Buka tab Actions > Build APK > Run workflow (atau otomatis setelah push).
3. Setelah selesai (hijau), buka run tersebut, lalu unduh "SchoolLMS-apk" di bagian Artifacts.
4. Ekstrak zip-nya, instal app-debug.apk di HP.

## Jendela AI mode guru

- Skrip: `app/src/main/assets/school-lms-ai.js` (disuntikkan dari `MainActivity.injectAi`).
- Sebelum build, isi `API_URL` (alamat worker Cloudflare) dan cek `QUESTION_SELECTOR` di skrip itu.
- Aktifkan di aplikasi: ketuk pojok kiri atas halaman 5 kali berturut-turut, lalu halaman dimuat ulang. Tombol "Matikan" di jendela menonaktifkannya.
