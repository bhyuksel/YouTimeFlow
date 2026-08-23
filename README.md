# YouTimeFlow ⏳

YouTimeFlow, zamanınızı daha verimli yönetmenizi ve odaklanmanızı sağlayan minimal, şık ve akıllı bir masaüstü asistanıdır. Standart bir Pomodoro sayacının ötesine geçerek görevlerinizi yönetmenizi, arka planda **hangi uygulamada ne kadar vakit geçirdiğinizi** ölçmenizi ve çalışma alışkanlıklarınızı analiz etmenizi sağlar.

## ✨ Özellikler

- 🍅 **Akıllı Pomodoro Sayacı:** Özelleştirilebilir çalışma (Work) ve mola (Break) süreleriyle zamanınızı bölün.
- 📝 **Görev Yönetimi (Todo):** Yapılacaklar listenizi oluşturun, tamamladıklarınızı işaretleyin ve gününüzü planlayın.
- 📊 **Detaylı Analitik:** Günlük odaklanma sürelerinizi, mola sürelerinizi ve tamamlanan görevlerinizi grafiklerle (Recharts) analiz edin.
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

*(Not: Uygulamamız tamamen açık kaynak kodludur ve zararlı yazılım içermez. Ancak henüz ücretli bir "Yayıncı Sertifikası" alınmadığı için Windows SmartScreen kurulumda uyarı verebilir. "Ek Bilgi" -> "Yine de Çalıştır" diyerek güvenle devam edebilirsiniz.)*

## 🛠️ Teknolojiler

Bu uygulama modern web ve sistem teknolojilerinin harmanlanmasıyla geliştirilmiştir:
- **Tauri 2.0** (Güvenli, hızlı ve çok hafif bir backend için Rust)
- **React + TypeScript** (Dinamik ve akıcı bir kullanıcı arayüzü için)
- **Vite** (Ultra hızlı derleme için)
- **Recharts** (Veri görselleştirme ve analiz grafikleri için)
- **Rust (`active-win-pos-rs`)** (Masaüstünde aktif olan pencereyi tespit etmek için)

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
