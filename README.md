# YouTimeFlow ⏳

YouTimeFlow, zamanınızı daha verimli yönetmenizi ve odaklanmanızı sağlayan minimal, şık ve akıllı bir masaüstü asistanıdır. Standart bir Pomodoro sayacının ötesine geçerek arka planda **hangi uygulamada ne kadar vakit geçirdiğinizi** ölçer ve çalışma alışkanlıklarınızı analiz etmenizi sağlar.

## ✨ Özellikler

- 🍅 **Akıllı Pomodoro Sayacı:** Özelleştirilebilir çalışma (Work) ve mola (Break) süreleriyle zamanınızı bölün.
- 👁️ **Arka Plan Uygulama Takibi (Aktif Süre):** Bilgisayarınızda o an açık olan, odaklandığınız uygulamanın (örn. VS Code, Chrome) süresini arka planda sessizce kaydeder ve size sunar.
- 🎨 **Minimal ve Premium Arayüz:** Masaüstünüzde yer kaplamaz. Şeffaflık, boyut ve renk (Tema) ayarları ile kişiselleştirilebilir bir floating (yüzen) pencere tasarımına sahiptir.
- ⚡ **Görünüm Modları:** Tek bir tuşla geleneksel sayaç modu ile "Bugün Aktif (Current App)" modu arasında geçiş yapabilirsiniz.
- 📌 **Daima Üstte (Always on Top):** Ekranınızda kaybolmaz, çalışırken size her an eşlik eder.

## 🚀 İndirme ve Kurulum

Uygulamanın derlenmiş güncel versiyonlarını (Windows ve Linux için) projenin yan tarafındaki **Releases** sekmesinden indirebilirsiniz.

### Windows İçin
1. **Releases** sekmesine gidin.
2. Sizin için hazırlanmış **.exe** (veya .msi) dosyasını indirin.
3. Uygulamayı kurup hemen kullanmaya başlayabilirsiniz!

*(Not: Uygulamamız tamamen açık kaynak kodludur ve virüs/zararlı yazılım içermez. Ancak henüz ücretli bir "Yayıncı Sertifikası" (Code Signing Certificate) satın alınmadığı için, Windows SmartScreen ilk kurulumda "Bilinmeyen Yayıncı" uyarısı verebilir. Bu çok normaldir, **"Ek Bilgi (More info)" -> "Yine de Çalıştır (Run anyway)"** diyerek güvenle devam edebilirsiniz.)*

## 🛠️ Teknolojiler

Bu uygulama modern web ve sistem teknolojilerinin harmanlanmasıyla geliştirilmiştir:
- **Tauri** (Güvenli, hızlı ve çok hafif bir backend için Rust)
- **React + TypeScript** (Dinamik ve akıcı bir kullanıcı arayüzü için)
- **Vite** (Ultra hızlı derleme için)
- **Rust (`active-win-pos-rs`)** (Masaüstünde aktif olan pencereyi arka planda güvenle tespit etmek için)

## 💻 Geliştiriciler İçin

Kendi bilgisayarınızda derlemek isterseniz:

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme (dev) modunda çalıştırmak için:
npm run tauri dev

# Derleyip kurulum dosyalarını (exe/msi vb.) oluşturmak için:
npm run tauri build
```

## 🔮 Yol Haritası (Roadmap)
- [ ] Gelişmiş Todo (Yapılacaklar) listesi entegrasyonu
- [ ] Özel hatırlatıcılar ve alarm seçenekleri
- [ ] Geçmiş günlere ait kullanım istatistiklerinin detaylı analizi

---
*Üretkenliğinize ivme katması dileğiyle!* 🚀
