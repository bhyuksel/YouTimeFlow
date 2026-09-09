# YouTimeFlow ⏳

YouTimeFlow, zamanınızı daha verimli yönetmenizi ve odaklanmanızı sağlayan minimal, şık ve akıllı bir masaüstü asistanıdır. Standart bir Pomodoro sayacının ötesine geçerek görevlerinizi yönetmenizi, arka planda **hangi uygulamada ne kadar vakit geçirdiğinizi** ölçmenizi, sürükle-bırak ile kendi seslerinizi eklemenizi ve çalışma alışkanlıklarınızı analiz etmenizi sağlar.

## ✨ Özellikler

- 🍅 **Akıllı Pomodoro Sayacı:** Özelleştirilebilir çalışma (Work) ve mola (Break) süreleriyle zamanınızı bölün. 
- 🎵 **Özel Ses Kütüphanesi (Sürükle & Bırak):** Ayarlar menüsündeki alana bilgisayarınızdaki herhangi bir ses veya video dosyasını (MP3, WAV, MP4 vb.) sürükleyip bırakarak kendi alarm seslerinizi ekleyin. Uygulama, dosyayı otomatik olarak arka planda dönüştürür ve ses kütüphanesine kaydeder.
- 🔄 **Otomatik Güncelleme (Auto Updater):** Uygulamaya yeni bir özellik geldiğinde GitHub üzerinden otomatik olarak algılar. Sağ alt köşede çıkan şık bir diyalog ile yeni sürümü tek tıkla indirip, baştan kurmaya gerek kalmadan günceller.
- 📝 **Görev Yönetimi (Todo):** Yapılacaklar listenizi oluşturun, tamamladıklarınızı işaretleyin ve gününüzü planlayın.
- 📊 **Detaylı Analitik:** Günlük odaklanma sürelerinizi, mola sürelerinizi ve tamamlanan görevlerinizi interaktif grafiklerle (Recharts) analiz edin.
- 👁️ **Arka Plan Uygulama Takibi (Aktif Süre):** Bilgisayarınızda o an açık olan, odaklandığınız uygulamanın (örn. VS Code, Chrome) süresini arka planda sessizce kaydeder.
- 🎨 **Minimal, Cam Efektli (Glassmorphism) Arayüz:** Masaüstünüzde yer kaplamayan, modern karanlık tema. Form küçüldüğünde sizi rahatsız etmez ve arka plandaki nesneleri engellemez.
- ⚡ **Akıllı Küçülme Modu:** Uygulamanın üzerinden farenizi çektiğinizde sadece süreyi gösterecek şekilde şık bir biçimde küçülür. 
- 📌 **Daima Üstte (Always on Top):** Ekranınızda kaybolmaz, çalışırken size her an eşlik eder.

## 🚀 İndirme ve Kurulum

Uygulamanın derlenmiş güncel versiyonlarını (Windows, macOS ve Linux için) projenin yan tarafındaki **Releases** sekmesinden indirebilirsiniz. Sürümler **GitHub Actions** ile otomatik olarak oluşturulmaktadır.

### Kurulum Adımları
1. **Releases** sekmesine gidin.
2. İşletim sisteminize uygun olan `.exe` (Windows), `.AppImage` / `.deb` (Linux) veya `.dmg` (macOS) dosyasını indirin.
3. Uygulamayı kurup hemen kullanmaya başlayabilirsiniz!
4. **Artık Yeni Sürümleri Takip Etmenize Gerek Yok:** Otomatik güncelleme özelliği sayesinde arka planda güncellemeler denetlenir ve size tek tıkla kurulum imkanı sunulur.

*(Not: Uygulamamız tamamen açık kaynak kodludur ve zararlı yazılım içermez. Ancak henüz ücretli bir "Yayıncı Sertifikası" alınmadığı için Windows SmartScreen kurulumda uyarı verebilir. "Ek Bilgi" -> "Yine de Çalıştır" diyerek güvenle devam edebilirsiniz.)*

## 🛠️ Teknolojiler

Bu uygulama modern web ve sistem teknolojilerinin harmanlanmasıyla geliştirilmiştir:
- **Tauri 2.0** (Güvenli, hızlı ve çok hafif bir backend için Rust)
- **Tauri Updater** (Otomatik güncelleme ve imzalama altyapısı)
- **React + TypeScript** (Dinamik ve akıcı bir kullanıcı arayüzü için)
- **Vite** (Ultra hızlı derleme için)
- **Recharts** (Veri görselleştirme ve analiz grafikleri için)
- **Rust (`active-win-pos-rs`)** (Masaüstünde aktif olan pencereyi tespit etmek için)
- **IndexedDB** (Özel sesleri ve görevleri yerel veritabanında saklamak için)

## 💻 Geliştiriciler İçin

Kendi bilgisayarınızda derlemek isterseniz:

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme (dev) modunda çalıştırmak için:
npm run tauri dev

# Derleyip kurulum dosyalarını oluşturmak için:
npm run tauri build
```

---
*Üretkenliğinize ivme katması dileğiyle!* 🚀
