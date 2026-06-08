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

[English](/README.md) / [Español](/README.es.md) / [Türkçe](/README.tr.md) / العربية / [Deutsch](/README.de.md) / [Français](/README.fr.md)

<a href="https://github.com/LumoRez07/flow/releases" target="_blank">
  <img src="https://img.shields.io/github/downloads/LumoRez07/flow/total?style=flat-square&color=blue" alt="Downloads" height="20"/>
</a>
<a href="https://sourceforge.net/projects/flowteleprompter/files/latest/download">
  <img alt="Download Flow Teleprompter" src="https://img.shields.io/sourceforge/dm/flowteleprompter.svg" />
</a>

ملقن نصوص خفيف جداً ومسرّع بالهاردوير، مبني باستخدام Rust و Tauri.

![Windows][Windows-image]
![Tauri][Tauri-image]
![Rust][Rust-image]
<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-1.9.0-2563eb?style=for-the-badge" />
  <img alt="JavaScript" src="https://img.shields.io/badge/Frontend-Vanilla%20JS-f7df1e?style=for-the-badge&logo=javascript&logoColor=111827" />
</p>
<p align="center">
يرجى التفكير في إعطاء نجمة لهذا االمشروع إذا ساعدك! ⭐
</p>

<p align="center">
  <a href="https://www.ghacks.net/de/2026/05/28/flow-teleprompter-windows-voice-tracking/" target="_blank">
    <img src="assets/featured%20on%20ghacks.svg" alt="Featured on Ghacks" width="480" />
  </a>
</p>

## Flow is available on
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
> إذا كنت تواجه مشكلات في تغيير الحجم، يرجى تنزيل أحدث إصدار (1.9.0).
> إذا لم يبدأ Flow في التمرير في وضع التتبع الصوتي، يرجى التحقق من إعدادات إذن الميكروفون للتطبيق والتأكد من تحديد جهاز الإدخال الصحيح في الإعدادات.


> [!IMPORTANT]
> ملاحظة حول التوزيع: من المخطط أن تصبح نسخة متجر مايكروسوفت (Microsoft Store) إصدارًا احترافيًا (Pro). من المتوقع أن يرتفع سعرها إلى 5-10 دولارات أمريكية (لم يتقرر بعد) للمساعدة في تعويض تكاليف استئجار الخوادم، وسيتم تشغيل الخدمات المستضافة بمجرد وصول إصدار Pro إلى الحد المطلوب من المستخدمين. ستبقى نسخة GitHub هي النسخة المجانية مفتوحة المصدر وستستمر في تلقي الميزات والتحديثات الرئيسية.



## Highlights

- خمسة أنماط للتشغيل: التحديد، التمرير، الخط، السهم، والتتبع الصوتي.

- تخزين النصوص محلياً أولاً والاحتفاظ بالإعدادات.
  
- ضبط مخصص لإدخال الصوت مع إمكانية اختيار الجهاز، والمراقبة الحية، وبوابة الضوضاء (Noise Gate)، وعناصر التحكم في مستوى الصوت (Gain).

- تحكم صوتي شامل في التطبيق مع تحيات إيقاظ مخصصة ومعالجة أكثر مرونة للتعرف على الصوت.

- نماذج التعرف على الكلام Vosk مع دعم مدمج للغة الإنجليزية ودعم قابل للتنزيل للغات التركية، العربية، الألمانية، الفرنسية، والإسبانية.

- محرر نصوص مدمج مع أدوات التنسيق، وعد الكلمات، ومساعدات تقدير وقت القراءة.

- نظام مراسلة عن بُعد مع مراجعة صندوق الوارد، روابط QR للاتصال السريع، وتحديثات حالة الرد من جهة المرسل.

- تعديل النص في الوقت الفعلي مما يسمح لعدد غير محدود من الضيوف بالانضمام وتعديل النص في نفس الوقت.

- توليد وإعادة كتابة اختيارية مدعومة بـ Groq.

- نافذة ويندوز عائمة دائماً في المقدمة مع خيارات النقر من خلالها (Click-through) وحماية من التقاط الشاشة.

- أداة تحديث رسمية من Tauri مع فحوصات داخل التطبيق، ضوابط تثبيت، ودعم لتحديثات ويندوز الموقعة.

## 🎥 عرض الميزات

### 1. حقن الرسائل (Message Injection)
https://github.com/user-attachments/assets/5e6a4fd1-5084-4e33-b56e-0142c2ad83ce



### 2. التعديل في الوقت الفعلي
https://github.com/user-attachments/assets/653988f9-03f1-40ad-95b8-04339356cb07

---




## 📸 لقطات الشاشة

<div align="center">
  <h3>المظهر الرئيسي لملقن النصوص</h3>
  <img src="./assets/main teleprompter.png" width="400" alt="Main Teleprompter"/>
  <img src="./assets/main chaned size.png" width="400" alt="Resized Layout"/>
  
  <br><br>
  
  <h3>محرر النصوص ومساعد الذكاء الاصطناعي المدمج</h3>
  <img src="./assets/text editor.png" width="400" alt="Text Editor Interface"/>
  <img src="./assets/AI assistant.png" width="400" alt="AI Workspace Integration"/>

  <br><br>

  <h3>الإعدادات والعرض المصغر</h3>
  <img src="./assets/settings.png" width="400" alt="Application Settings"/>
  <img src="./assets/minimized.png" width="400" alt="Minimized Compact Overlay"/>
</div>

---

## خارطة الطريق

- [x] إعادة كتابة البنية الأساسية باستخدام Tauri + Rust
- [x] نافذة عائمة مخفية لتخطي OBS
- [x] الاعتماد والإصدار على متجر مايكروسوفت
- [x] الانتقال إلى Cloudflare
- [ ] الإصدار v2.0.0: إعادة هيكلة وتحسين وحدات الواجهة الأمامية (JavaScript) لتحسين الأداء
- [ ] الإصدار v2.0.0: تنفيذ منطق الفصل بين النسخة المجانية والاحترافية (Free/Pro)

---

## ما الجديد في الإصدار v1.9.0

- تقديم ميزة التعديل في الوقت الفعلي الجديدة باستخدام WebRTC (PeerJS)، مما يتيح التعديل المباشر للنصوص عبر أجهزة متعددة من خلال غرفة متصفح خاصة وآمنة.
- ترقية مولد رمز الاستجابة السريعة (QR Code) إلى مكتبة ذات أداء أعلى (QRCode).
- تحسين الاستقرار، الأداء، والتحجيم في جميع أنحاء التطبيق من خلال تحسينات وإصلاحات داخلية متنوعة.
- تقليل استهلاك ذاكرة الوصول العشوائي (RAM) مع الحفاظ على الأداء أو تحسينه.

---

## البدء

1. قم بتنزيل أحدث إصدار من [متجر مايكروسوفت](https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct) أو [GitHub Releases](https://github.com/LumoRez07/flow/releases);
2. قم بتشغيل مثبت .exe أو .msi؛
3. قم بتشغيل Flow وابدأ التلقين.

---

## التطوير

المتطلبات:
- Node.js
- Rust
- Tauri prerequisites for Windows

التشغيل محلياً:

```bash
npm install
npm run tauri dev
```

Build:

```bash
npm run tauri build
```

Build output:

```text
src-tauri/target/release
src-tauri/target/release/bundle
```

### إصدار المحدث الموقّع

لإنتاج إصدار ويندوز جاهز لإصدارات GitHub ومحدث Flow الداخلي، قم بتحميل مفتاح توقيع المحدث إلى بيئة العمل قبل البناء:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Raw "$HOME\.tauri\flow-updater.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "<your-updater-key-password>"
npm run tauri build
```

قم بنشر هذه الملفات من src-tauri/target/release/bundle إلى إصدار GitHub:

- `msi/flow_1.9.0_x64_en-US.msi`
- `latest.json`

يتم إنشاء ملف .sig بجانب MSI كمرجع، بينما latest.json هو موجز التحديث الذي يستهلكه التطبيق.


## الخصوصية

- يتم تخزين معظم البيانات محلياً على الجهاز.
- صُمم التتبع الصوتي للعمل محلياً باستخدام نماذج Vosk.
- يتم إرسال طلبات Groq فقط عند استخدام ميزات الذكاء الاصطناعي.
- راجع [privacy-policy.md](privacy-policy.md) لمعرفة سياسة الخصوصية الحالية.

## الترخيص

هذا المشروع مرخص بموجب GPL-3.0-or-later. راجع ملف الترخيص [LICENSE](LICENSE).

## سجل النجوم

<a href="https://www.star-history.com/?repos=LumoRez07%2FFlow&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
 </picture>
</a>
