<div align="center">
  <h1>YouTimeFlow ⏳</h1>
  <p>Minimal, şık ve akıllı bir masaüstü odaklanma ve zaman yönetimi asistanı.</p>
</div>

<br />

YouTimeFlow, standart bir Pomodoro sayacının ötesine geçerek görevlerinizi yönetmenizi, arka planda hangi uygulamada ne kadar vakit geçirdiğinizi ölçmenizi, sürükle-bırak ile kendi seslerinizi eklemenizi ve çalışma alışkanlıklarınızı analiz etmenizi sağlar.

## ✨ Öne Çıkan Özellikler

- 🍅 **Akıllı Pomodoro Sayacı:** Özelleştirilebilir çalışma (Work) ve mola (Break) süreleriyle zamanınızı dilediğiniz gibi planlayın. 
- 📝 **Görev Yönetimi (Gelişmiş Todo):** Yapılacaklar listenizi oluşturun, pomodoro sürelerini görevlerinizle eşleştirin ve gününüzü verimli planlayın.
- 📊 **Detaylı Analitik:** Geçmiş günlere ait kullanım istatistiklerini, odaklanma sürelerinizi, mola sürelerinizi ve tamamlanan görevlerinizi interaktif grafiklerle analiz edin.
- 🎵 **Özel Hatırlatıcılar & Ses Kütüphanesi:** Ayarlar menüsündeki alana bilgisayarınızdaki herhangi bir ses dosyasını (MP3, WAV, MP4 vb.) sürükleyip bırakarak kendi alarm seslerinizi oluşturun.
- 👁️ **Arka Plan Uygulama Takibi:** Bilgisayarınızda o an açık olan, odaklandığınız uygulamanın (örn. VS Code, Chrome) süresini arka planda sessizce kaydeder.
- 🔄 **Otomatik Güncelleme (Auto Updater):** Uygulamaya yeni bir özellik geldiğinde arka planda algılar ve tek tıkla baştan kurmaya gerek kalmadan otomatik günceller.
- 🎨 **Minimal, Cam Efektli (Glassmorphism) Arayüz:** Masaüstünüzde yer kaplamayan, modern karanlık tema.
- ⚡ **Akıllı Küçülme Modu:** Uygulamanın üzerinden farenizi çektiğinizde sadece süreyi gösterecek şekilde şık bir biçimde küçülür. 
- 📌 **Daima Üstte (Always on Top):** Ekranınızda kaybolmaz, çalışırken size her an eşlik eder.

---

## 🚀 İndirme ve Kurulum

YouTimeFlow, Windows, macOS ve Linux işletim sistemlerini yerel (native) olarak destekler. En güncel sürümü **[Releases](https://github.com/KULLANICI_ADI/PROJE_ADI/releases)** sayfasından indirebilirsiniz. 

> **💡 İpucu:** İlk kurulumdan sonra çıkacak tüm yeni güncellemeler otomatik olarak uygulamanızın içinden tek tıkla kurulacaktır. Tekrar GitHub'a gelmenize gerek kalmaz!

### 🪟 Windows (10 / 11)
1. Releases sayfasından **`.exe`** uzantılı kurulum dosyasını indirin.
2. Dosyaya çift tıklayarak kurulumu başlatın.
3. *Not: Uygulama henüz ücretli bir yayıncı sertifikasına sahip olmadığı için Windows SmartScreen uyarı verebilir. Bu durumda `Ek Bilgi -> Yine de Çalıştır` butonuna tıklayarak güvenle devam edebilirsiniz.*

### 🍎 macOS (Intel & Apple Silicon)
1. Releases sayfasından **`.dmg`** (veya `.app.tar.gz`) uzantılı dosyayı indirin.
2. `.dmg` dosyasını açıp **YouTimeFlow** ikonunu `Applications` (Uygulamalar) klasörüne sürükleyin.
3. Uygulamayı ilk kez açarken macOS "Kimliği belirsiz geliştirici" uyarısı verirse: `Sistem Ayarları -> Gizlilik ve Güvenlik` yolunu izleyip en alttan **"Yine de Aç"** seçeneğine tıklayın.

### 🐧 Linux (Ubuntu, Debian, Fedora, Arch)
Linux kullanıcıları için en uygun iki farklı dağıtım mevcuttur:
- **`.AppImage` ile Kurulum (Önerilen, Tüm Dağıtımlar):** Dosyayı indirin, sağ tıklayıp özelliklerden "Çalıştırılabilir" (Executable) izni verin ve çift tıklayarak açın.
- **`.deb` ile Kurulum (Ubuntu / Debian):** Dosyayı indirin ve terminalden `sudo dpkg -i youtimeflow_0.1.3_amd64.deb` komutu ile kurun.

---

## 🛠️ Teknolojiler

Bu uygulama modern web ve sistem teknolojilerinin harmanlanmasıyla ultra-hafif ve performanslı olacak şekilde geliştirilmiştir:
- **Tauri 2.0:** Güvenli, çok hızlı ve çok hafif (RAM ve CPU dostu) bir backend için Rust.
- **React + TypeScript:** Dinamik ve akıcı bir kullanıcı arayüzü için.
- **Vite:** Ultra hızlı derleme süreci için.
- **Recharts:** Veri görselleştirme ve analiz grafikleri için.
- **IndexedDB:** Özel sesleri ve görevleri güvenli yerel veritabanında saklamak için.
- **Rust (`active-win-pos-rs`):** Masaüstünde aktif olan pencereyi performans kaybı olmadan tespit etmek için.

---

## 🔮 Yol Haritası (Roadmap)

- [x] Gelişmiş Todo (Yapılacaklar) listesi entegrasyonu
- [x] Özel hatırlatıcılar ve alarm seçenekleri (Sürükle-Bırak)
- [x] Geçmiş günlere ait kullanım istatistiklerinin detaylı analizi
- [x] Otomatik Sürüm Güncelleme (Auto-Updater)
- [ ] Bulut Senkronizasyonu (Google Drive / iCloud ile verileri yedekleme)
- [ ] Daha fazla tema ve renk paleti seçenekleri

---

## 💻 Geliştiriciler İçin

Kendi bilgisayarınızda derlemek isterseniz sisteminizde `Node.js` ve `Rust (Cargo)` kurulu olmalıdır.

```bash
# Projeyi klonlayın
git clone https://github.com/KULLANICI_ADI/PROJE_ADI.git
cd pomodoro-app

# Bağımlılıkları yükleyin
npm install

# Geliştirme (dev) modunda çalıştırmak için:
npm run tauri dev

# Derleyip kurulum dosyalarını oluşturmak için (İşletim Sisteminize Özel):
npm run tauri build
```

<div align="center">
  <i>Üretkenliğinize ivme katması dileğiyle! 🚀</i>
</div>
