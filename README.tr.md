<!--
  Flow - A high-performance teleprompter for Windows.
  Copyright (C) 2026 Waled Alturkmani (LumoRez07)

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
-->

<div align="center">

<p align="center">
  <img src="src/assets/readme-assets/github-readme-header.webp" width="960" alt="Flow Teleprompter v2" />
</p>

<table align="center">
  <tr>
    <td align="center"><a href="README.md"><img src="src/assets/readme-assets/en-circle.webp" width="32" height="32" alt="English" /><br /><sub><b>English</b></sub></a></td>
    <td align="center"><a href="README.es.md"><img src="src/assets/readme-assets/es-circle.webp" width="32" height="32" alt="Español" /><br /><sub><b>Español</b></sub></a></td>
    <td align="center"><img src="src/assets/readme-assets/tr-circle-active.webp" width="32" height="32" alt="Türkçe" /><br /><sub><b>Türkçe</b></sub></td>
    <td align="center"><a href="README.ar.md"><img src="src/assets/readme-assets/sa-circle.webp" width="32" height="32" alt="العربية" /><br /><sub><b>العربية</b></sub></a></td>
    <td align="center"><a href="README.de.md"><img src="src/assets/readme-assets/de-circle.webp" width="32" height="32" alt="Deutsch" /><br /><sub><b>Deutsch</b></sub></a></td>
    <td align="center"><a href="README.fr.md"><img src="src/assets/readme-assets/fr-circle.webp" width="32" height="32" alt="Français" /><br /><sub><b>Français</b></sub></a></td>
    <td align="center"><a href="README.pt.md"><img src="src/assets/readme-assets/br-circle.webp" width="32" height="32" alt="Português" /><br /><sub><b>Português</b></sub></a></td>
    <td align="center"><a href="README.fi.md"><img src="src/assets/readme-assets/fi-circle.webp" width="32" height="32" alt="Suomi" /><br /><sub><b>Suomi</b></sub></a></td>
  </tr>
</table>

<p align="center">
  <a href="https://github.com/LumoRez07/flow/releases" target="_blank">
    <img src="https://img.shields.io/github/v/release/LumoRez07/flow?style=flat-square&color=2563eb&label=s%C3%BCr%C3%BCm" alt="Sürüm 2.0.0" />
  </a>
  <a href="https://github.com/LumoRez07/flow/releases" target="_blank">
    <img src="https://img.shields.io/github/downloads/LumoRez07/flow/total?style=flat-square&color=3b82f6" alt="GitHub İndirmeleri" />
  </a>
  <a href="https://sourceforge.net/projects/flowteleprompter/files/latest/download">
    <img src="https://img.shields.io/sourceforge/dm/flowteleprompter.svg?style=flat-square" alt="SourceForge İndirmeleri" />
  </a>
  <img src="https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078D6?style=flat-square&logo=windows&logoColor=white" alt="Windows" />
  <img src="https://img.shields.io/badge/altyap%C4%B1-Rust%20%2B%20Tauri%20v2-FFC131?style=flat-square&logo=tauri&logoColor=black" alt="Tauri + Rust" />
  <img src="https://img.shields.io/badge/lisans-GPLv3-22c55e?style=flat-square" alt="GPLv3 Lisansı" />
</p>

<p align="center">
  <strong>Windows için Rust ve Tauri ile geliştirilmiş, yüksek performanslı ve hafif teleprompter.</strong>
</p>

<p align="center">
  Size yardımcı olduysa lütfen bu depoya bir yıldız vermeyi düşünün! ⭐
</p>

<p align="center">
  <a href="https://www.ghacks.net/de/2026/05/28/flow-teleprompter-windows-voice-tracking/" target="_blank">
    <img src="assets/featured%20on%20ghacks.svg" alt="Ghacks'te Öne Çıkarıldı" width="480" />
  </a>
</p>

## Flow'u edinin
<div align="center">
  <a href="https://sourceforge.net/p/flowteleprompter/">
    <img alt="Flow Teleprompter'ı İndir" src="https://sourceforge.net/sflogo.php?type=17&amp;group_id=4087698" width="200">
  </a>
  <a href="https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct">
    <img alt="Microsoft Store'dan Edin" src="https://get.microsoft.com/images/en-us%20dark.svg" width="200"/>
  </a>
  <br>
</div>

</div>

---

<p align="center">
  <img src="src/assets/readme-assets/tr-f.webp" alt="Özellikler" width="960" />
</p>

- Beş oynatma modu: vurgu (highlight), kaydırma (scroll), satır (line), ok işareti (arrow) ve ses takibi (voice tracking).
- Yerel öncelikli (local-first) metin depolama ve kalıcı ayarlar.
- Cihaz seçimi, canlı izleme, gürültü kapısı (noise gate) ve kazanç (gain) kontrolleri ile özel ses girişi ayarı.
- Yerelleştirilmiş uyandırma ifadeleri ve esnek tanıma işleme ile uygulama genelinde sesli kontrol.
- Dahili İngilizce desteği ve indirilebilir Türkçe, Arapça, Almanca, Fransızca, İspanyolca, Portekizce ve Fince desteğine sahip Vosk konuşma modelleri.
- Geri sayım duraklamaları ve otomatik devam etme özelliğine sahip yönlendirme kartları (cue cards).
- Biçimlendirme, kelime sayısı ve tahmini okuma süresi araçlarına sahip dahili metin düzenleyici.
- Gelen kutusu incelemesi, hızlı bağlantı QR bağlantıları ve gönderen tarafında yanıt durumu güncellemeleri ile uzaktan mesajlaşma akışı.
- Birden fazla konuğun özel bir tarayıcı odası üzerinden metne aynı anda katılmasına ve metni düzenlemesine olanak tanıyan gerçek zamanlı metin düzenleme.
- Groq destekli isteğe bağlı yapay zeka metin oluşturma ve yeniden yazma.
- Tıklama (click-through) ve ekran yakalama koruması (capture-protection) seçenekleriyle her zaman üstte (always-on-top) Windows katmanı.
- Uygulama içi denetimler, kurulum kontrolleri ve imzalı Windows sürüm akışı desteği ile resmi Tauri güncelleyici.

---

<p align="center">
  <img src="src/assets/readme-assets/tr-sc.webp" alt="Özellik Vitrini" width="960" />
</p>

### 1. Mesaj Enjeksiyonu (Message Injection)
https://github.com/user-attachments/assets/5e6a4fd1-5084-4e33-b56e-0142c2ad83ce

### 2. Gerçek Zamanlı Düzenleme (Realtime Editing)
https://github.com/user-attachments/assets/653988f9-03f1-40ad-95b8-04339356cb07

---

<p align="center">
  <img src="src/assets/readme-assets/tr-ss.webp" alt="Ekran Görüntüleri" width="960" />
</p>

<div align="center">
  <h3>Ana Teleprompter Görünümü</h3>
  <img src="./assets/main teleprompter.png" width="400" alt="Ana Görünüm"/>
  <img src="./assets/main chaned size.png" width="400" alt="Boyutlandırılmış Düzen"/>
  
  <br><br>
  
  <h3>Metin Düzenleyici ve Dahili Yapay Zeka Asistanı</h3>
  <img src="./assets/text editor.png" width="400" alt="Metin Düzenleyici Arayüzü"/>
  <img src="./assets/AI assistant.png" width="400" alt="Yapay Zeka Çalışma Alanı Entegrasyonu"/>

  <br><br>

  <h3>Ayarlar ve Kompakt Görünüm</h3>
  <img src="./assets/settings.png" width="400" alt="Uygulama Ayarları"/>
  <img src="./assets/minimized.png" width="400" alt="Kompakt Katman Görünümü"/>
</div>

---

<p align="center">
  <img src="src/assets/readme-assets/tr-win.webp" alt="Neler Yeni?" width="960" />
</p>

- **Metin Kütüphanesi ve Yöneticisi**: Birden fazla metni anında kaydetmek, düzenlemek, aramak ve aralarında geçiş yapmak için yerleşik bir metin yöneticisi ile hızlı dosya içe aktarma özelliği eklendi.<br><br>
- **Bölüm Gezgini ve İlerleme Takibi**: Uzun metinleri net bölümlere ayırmak, bölümler arasında tek tıkla gezinmek ve konuşma sırasında tamamlanma oranını canlı takip etmek için bölüm etiketleri eklendi.<br><br>
- **Modüler Kod Tabanı**: Daha hızlı açılış süreleri, üstün kararlılık ve kolay bakım için temel işlevler yüksek performanslı modüler bir mimariye dönüştürüldü.<br><br>
- **Açılış Ekranı (Splash Screen)**: Başlatma sırasında pencere titremelerini ortadan kaldırmak için yumuşak geçişli (crossfade) zarif bir açılış ekranı entegre edildi.<br><br>
- **Çoklu Monitör ve DPI Düzeltmeleri**: Karışık DPI ve çoklu monitör kurulumlarında pencere konumlandırması, koordinat hassasiyeti ve ölçeklendirme geliştirildi.<br><br>

---

<p align="center">
  <img src="src/assets/readme-assets/tr-rm.webp" alt="Yol Haritası" width="960" />
</p>

- [x] Tauri + Rust çekirdek mimarisinin yeniden yazılması
- [x] Ekran paylaşımı, sunumlar ve görüntülü görüşmeler için görünmez katman
- [x] Microsoft Store sertifikasyonu ve sürümü
- [x] Cloudflare geçişi
- [x] v2.0.0: Ön uç JavaScript modüllerinin yeniden düzenlenmesi ve performans iyileştirmeleri
- [x] v2.0.0: Ücretsiz/Pro (Free/Pro) sürüm ayrımı mantığının uygulanması
- [ ] v2.1.0: Web açılış sayfası ve uzaktan bağlantı istemcisinde geliştirmeler
- [ ] v2.2.0+: Belirlenecek

---

<p align="center">
  <img src="src/assets/readme-assets/tr-gs.webp" alt="Başlayın" width="960" />
</p>

1. En son sürümü [Microsoft Store](https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct) veya [GitHub Sürümleri (Releases)](https://github.com/LumoRez07/flow/releases) üzerinden indirin;
2. `.exe` veya `.msi` yükleyicisini çalıştırın;
3. Flow'u başlatın ve sunumunuza başlayın.

---

## Geliştirme

Gereksinimler:
- Node.js
- Rust
- Windows için Tauri önkoşulları

Yerel olarak çalıştırma:

```bash
npm install
npm run tauri dev
```

Derleme (Build):

```bash
npm run tauri build
```

Derleme çıktıları:

```text
src-tauri/target/release
src-tauri/target/release/bundle
```

### İmzalı güncelleyici sürümü

GitHub Releases ve Flow'un uygulama içi güncelleyicisi için hazır bir Windows sürümü oluşturmak adına, derlemeden önce güncelleyici imzalama anahtarını ortam değişkenlerine yükleyin:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Raw "$HOME\.tauri\flow-updater.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "<your-updater-key-password>"
npm run tauri build
```

`src-tauri/target/release/bundle` dizinindeki bu dosyaları GitHub sürümünde yayınlayın:

- `msi/flow_2.0.0_x64_en-US.msi`
- `latest.json`

`.sig` dosyası referans için MSI ile birlikte oluşturulurken, `latest.json` uygulama tarafından tüketilen güncelleyici akışıdır.

---

## Gizlilik

- Çoğu veri yerel olarak cihazda depolanır.
- Ses takibi Vosk modelleriyle yerel olarak çalışır.
- Groq istekleri yalnızca yapay zeka özellikleri aktif olarak kullanıldığında gönderilir.
- Mevcut gizlilik politikası için [privacy-policy.md](privacy-policy.md) dosyasına bakın.

---

## Teşekkürler

Flow Teleprompter'a en çok ihtiyaç duyduğu anda destek oldukları için [@emanschigames](https://www.instagram.com/emanschigames/?hl=en) ve [@nour690](https://github.com/nour690)'a özel teşekkürler. Küçük bir jest olsa bile çok şey ifade etti ve içtenlikle takdir edilmektedir.


---

## Lisans

Bu proje GPL-3.0-or-later kapsamında lisanslanmıştır. Bkz. [LICENSE](LICENSE).

---

## Yıldız Geçmişi (Star History)

<a href="https://www.star-history.com/?repos=LumoRez07%2FFlow&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
 </picture>
</a>
