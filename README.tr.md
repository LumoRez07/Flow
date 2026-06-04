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
  <img src="src/assets/flow-logo.png" width="128" height="128" alt="Flow logo" />
</p>

<h1 align="center">Flow Teleprompter</h1>

[English](/README.md) / [Español](/README.es.md) / Türkçe / [العربية](/README.ar.md) / [Deutsch](/README.de.md) / [Français](/README.fr.md)

<a href="https://github.com/LumoRez07/flow/releases" target="_blank">
  <img src="https://img.shields.io/github/downloads/LumoRez07/flow/total?style=flat-square&color=blue" alt="Downloads" height="20"/>
</a>
<a href="https://sourceforge.net/projects/flowteleprompter/files/latest/download">
  <img alt="Download Flow Teleprompter" src="https://img.shields.io/sourceforge/dm/flowteleprompter.svg" />
</a>

Rust ve Tauri ile geliştirilmiş, ultra hafif, donanım hızlandırmalı teleprompter.

![Windows][Windows-image]
![Tauri][Tauri-image]
![Rust][Rust-image]
<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-1.9.0-2563eb?style=for-the-badge" />
  <img alt="JavaScript" src="https://img.shields.io/badge/Frontend-Vanilla%20JS-f7df1e?style=for-the-badge&logo=javascript&logoColor=111827" />
</p>
<p align="center">
Size yardımcı olduysa lütfen bu depoyu yıldızlamayı düşünün! ⭐
</p>

## Flow şuralarda mevcuttur
<div align="center">
  <a href="https://sourceforge.net/p/flowteleprompter/">
    <img alt="Download Flow Teleprompter" src="https://sourceforge.net/sflogo.php?type=17&amp;group_id=4087698" width="200">
  </a>
  <a href="https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct">
    <img alt="Get it from Microsoft" src="https://get.microsoft.com/images/en-us%20dark.svg" width="200"/>
  </a>
  <br>
</div>



[Windows-image]: https://img.shields.io/badge/-Windows-0078D6?logo=windows&style=flat-square
[Tauri-image]: https://img.shields.io/badge/-Tauri-FFC131?logo=tauri&style=flat-square&logoColor=black
[Rust-image]: https://img.shields.io/badge/-Rust-000000?logo=rust&style=flat-square
</div>


> [!CAUTION]
> Ölçeklendirme sorunları yaşıyorsanız lütfen en son sürümü (1.9.0) indirin.
> Ses takibi modunda kaydırma başlamıyorsa, lütfen uygulamanın mikrofon izni ayarlarını kontrol edin ve ayarlarda doğru giriş cihazının seçildiğinden emin olun.


> [!IMPORTANT]
> Dağıtım notu: Microsoft Store sürümünün bir Pro sürümüne dönüştürülmesi planlanmaktadır. Sunucu kiralama masraflarını dengelemeye yardımcı olmak için fiyatının 5-10 USD (Henüz karar verilmedi) seviyesine çıkması beklenmektedir ve Pro sürümü gerekli kullanıcı eşiğine ulaştığında barındırılan hizmetler devreye alınacaktır. GitHub sürümü ücretsiz açık kaynaklı yapı olarak kalacak ve büyük özellikler ile güncellemeleri almaya devam edecektir.



## Öne Çıkan Özellikler

- Beş oynatma stili: vurgulama, kaydırma, satır, ok ve ses takibi.

- Önce yerel (local-first) metin depolama ve kalıcı ayarlar.

- Cihaz seçimi, canlı izleme, gürültü geçidi (noise gate) ve kazanç (gain) kontrolleri ile özel ses giriş ayarı.

- Yerelleştirilmiş uyanma selamlamaları ve daha dayanıklı tanıma işleme ile uygulama çapında sesli kontrol.

- Dahili İngilizce ve indirilebilir Türkçe, Arapça, Almanca, Fransızca ve İspanyolca destekli Vosk konuşma modelleri.

- Biçimlendirme, kelime sayımı ve okuma süresi yardımcıları içeren yerleşik metin düzenleyici.

- Gelen kutusu incelemesi, hızlı bağlantı QR linkleri ve gönderici tarafı yanıt durumu güncellemeleri ile uzaktan mesajlaşma akışı.

- Sınırsız sayıda misafirin katılmasına ve metni aynı anda düzenlemesine olanak tanıyan gerçek zamanlı metin düzenleme.

- İsteğe bağlı Groq destekli metin oluşturma ve yeniden yazma.

- Tıklama (click-through) ve yakalama koruması (capture-protection) seçenekleriyle her zaman üstte (always-on-top) Windows katmanı.

- Uygulama içi kontroller, yükleme denetimleri ve imzalı Windows sürüm akışı desteği ile resmi Tauri güncelleyici.

## 🎥 Özellik Gösterimi

### 1. Mesaj Enjeksiyonu (Message Injection)
https://github.com/user-attachments/assets/5e6a4fd1-5084-4e33-b56e-0142c2ad83ce



### 2. Gerçek Zamanlı Düzenleme (Realtime Editing)
https://github.com/user-attachments/assets/653988f9-03f1-40ad-95b8-04339356cb07

---




## 📸 Ekran Görüntüleri

<div align="center">
  <h3>Ana Teleprompter Görünümü</h3>
  <img src="./assets/main teleprompter.png" width="400" alt="Main Teleprompter"/>
  <img src="./assets/main chaned size.png" width="400" alt="Resized Layout"/>
  
  <br><br>
  
  <h3>Metin Düzenleyici ve Dahili Yapay Zeka Asistanı</h3>
  <img src="./assets/text editor.png" width="400" alt="Text Editor Interface"/>
  <img src="./assets/AI assistant.png" width="400" alt="AI Workspace Integration"/>

  <br><br>

  <h3>Ayarlar ve Kompakt Görünüm</h3>
  <img src="./assets/settings.png" width="400" alt="Application Settings"/>
  <img src="./assets/minimized.png" width="400" alt="Minimized Compact Overlay"/>
</div>

---

## Yol Haritası

- [x] Tauri + Rust çekirdek mimarisinin yeniden yazılması
- [x] OBS'i atlamak için görünmez katman
- [x] Microsoft Store sertifikasyonu ve sürümü
- [x] Cloudflare migration
- [ ] v2.0.0: Performans iyileştirmeleri için Frontend JavaScript modülünün yeniden düzenlenmesi ve geliştirilmesi
- [ ] v2.0.0: Ücretsiz/Pro (Free/Pro) sürüm ayrımı mantığının uygulanması

---

## v1.9.0 Sürümündeki Yenilikler

- WebRTC (PeerJS) kullanılarak güvenli ve özel bir tarayıcı odası üzerinden cihazlar arası canlı metin düzenlemeye olanak tanıyan yeni Gerçek Zamanlı Düzenleme özelliği eklendi.
- QR kod oluşturucu, daha performanslı bir kütüphaneye (QRCode) yükseltildi.
- Çeşitli altyapı optimizasyonları ve düzeltmeleri ile uygulama genelinde kararlılık, performans ve ölçeklendirme iyileştirildi.
- Performans korunarak/iyileştirilerek RAM kullanımı azaltıldı.

---

## Başlangıç

1. En son sürümü [Microsoft Store](https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct) 'dan veya [GitHub](https://github.com/LumoRez07/flow/releases) Sürümleri'nden (Releases) indirin;
2. .exe veya .msi yükleyicisini çalıştırın;
3. Flow'u başlatın ve metin okumaya başlayın.

---

## Geliştirme

Gereksinimler:
- Node.js
- Rust
- Tauri prerequisites for Windows

Yerel olarak çalıştırma:

```bash
npm install
npm run tauri dev
```

Oluşturma (Build):

```bash
npm run tauri build
```

Oluşturma çıktısı:

```text
src-tauri/target/release
src-tauri/target/release/bundle
```

### İmzalı güncelleyici sürümü

GitHub Sürümleri ve Flow'un uygulama içi güncelleyicisi için hazır bir Windows sürümü oluşturmak adına, yapımdan önce güncelleyici imzalama anahtarını ortama yükleyin:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Raw "$HOME\.tauri\flow-updater.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "<your-updater-key-password>"
npm run tauri build
```

src-tauri/target/release/bundle dizinindeki bu dosyaları GitHub sürümünde yayınlayın:

- `msi/flow_1.9.0_x64_en-US.msi`
- `latest.json`

.sig dosyası referans için MSI ile birlikte oluşturulurken, latest.json uygulama tarafından tüketilen güncelleyici akışıdır.


## Gizlilik

- Çoğu veri cihazda yerel olarak saklanır.
- Ses takibi, Vosk modelleri ile yerel olarak çalışacak şekilde tasarlanmıştır.
- Groq istekleri yalnızca yapay zeka özellikleri kullanıldığında gönderilir.
- Mevcut gizlilik politikası için [privacy-policy.md](privacy-policy.md) dosyasına bakın.

## Lisans

Bu proje GPL-3.0-or-later lisansı altındadır. [LICENSE](LICENSE). dosyasına bakın.

## Yıldız Geçmişi

<a href="https://www.star-history.com/?repos=LumoRez07%2FFlow&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
 </picture>
</a>
