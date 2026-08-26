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

<p align="center">
  <span style="display:inline-block; margin: 0 10px; text-align: center;">
    <a href="README.md" style="text-decoration:none;">
      <img src="src/assets/readme-assets/en-circle.webp" width="32" height="32" alt="English" /><br />
      <sub><b>English</b></sub>
    </a>
  </span>
  <span style="display:inline-block; margin: 0 10px; text-align: center;">
    <a href="README.es.md" style="text-decoration:none;">
      <img src="src/assets/readme-assets/es-circle.webp" width="32" height="32" alt="Español" /><br />
      <sub><b>Español</b></sub>
    </a>
  </span>
  <span style="display:inline-block; margin: 0 10px; text-align: center;">
    <a href="README.tr.md" style="text-decoration:none;">
      <img src="src/assets/readme-assets/tr-circle.webp" width="32" height="32" alt="Türkçe" /><br />
      <sub><b>Türkçe</b></sub>
    </a>
  </span>
  <span style="display:inline-block; margin: 0 10px; text-align: center;">
    <img src="src/assets/readme-assets/sa-circle-active.webp" width="32" height="32" alt="العربية (محدد)" /><br />
    <sub><b>العربية</b></sub>
  </span>
  <span style="display:inline-block; margin: 0 10px; text-align: center;">
    <a href="README.de.md" style="text-decoration:none;">
      <img src="src/assets/readme-assets/de-circle.webp" width="32" height="32" alt="Deutsch" /><br />
      <sub><b>Deutsch</b></sub>
    </a>
  </span>
  <span style="display:inline-block; margin: 0 10px; text-align: center;">
    <a href="README.fr.md" style="text-decoration:none;">
      <img src="src/assets/readme-assets/fr-circle.webp" width="32" height="32" alt="Français" /><br />
      <sub><b>Français</b></sub>
    </a>
  </span>
  <span style="display:inline-block; margin: 0 10px; text-align: center;">
    <a href="README.pt.md" style="text-decoration:none;">
      <img src="src/assets/readme-assets/br-circle.webp" width="32" height="32" alt="Português" /><br />
      <sub><b>Português</b></sub>
    </a>
  </span>
  <span style="display:inline-block; margin: 0 10px; text-align: center;">
    <a href="README.fi.md" style="text-decoration:none;">
      <img src="src/assets/readme-assets/fi-circle.webp" width="32" height="32" alt="Suomi" /><br />
      <sub><b>Suomi</b></sub>
    </a>
  </span>
</p>

<p align="center">
  <a href="https://github.com/LumoRez07/flow/releases" target="_blank">
    <img src="https://img.shields.io/github/v/release/LumoRez07/flow?style=flat-square&color=2563eb&label=version" alt="Version 2.0.0" />
  </a>
  <a href="https://github.com/LumoRez07/flow/releases" target="_blank">
    <img src="https://img.shields.io/github/downloads/LumoRez07/flow/total?style=flat-square&color=3b82f6" alt="GitHub Downloads" />
  </a>
  <a href="https://sourceforge.net/projects/flowteleprompter/files/latest/download">
    <img src="https://img.shields.io/sourceforge/dm/flowteleprompter.svg?style=flat-square" alt="SourceForge Downloads" />
  </a>
  <img src="https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078D6?style=flat-square&logo=windows&logoColor=white" alt="Windows" />
  <img src="https://img.shields.io/badge/backend-Rust%20%2B%20Tauri%20v2-FFC131?style=flat-square&logo=tauri&logoColor=black" alt="Tauri + Rust" />
  <img src="https://img.shields.io/badge/license-GPLv3-22c55e?style=flat-square" alt="GPLv3 License" />
</p>

<p align="center">
  <strong>مُلقِّن نصوص عالي الأداء وخفيف الوزن لنظام Windows، مبني باستخدام Rust وTauri.</strong>
</p>

<p align="center">
  إذا نال هذا المشروع إعجابك، يرجى التفكير في دعمه بنجمة! ⭐
</p>

<p align="center">
  <a href="https://www.ghacks.net/de/2026/05/28/flow-teleprompter-windows-voice-tracking/" target="_blank">
    <img src="assets/featured%20on%20ghacks.svg" alt="Featured on Ghacks" width="480" />
  </a>
</p>

## برنامج Flow متوفر على
<div align="center">
  <a href="https://sourceforge.net/p/flowteleprompter/">
    <img alt="Download Flow Teleprompter" src="https://sourceforge.net/sflogo.php?type=17&amp;group_id=4087698" width="200">
  </a>
  <a href="https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct">
    <img alt="Get it from Microsoft" src="https://get.microsoft.com/images/en-us%20dark.svg" width="200"/>
  </a>
  <br>
</div>

</div>

---

<div dir="rtl">

<p align="center">
  <img src="src/assets/readme-assets/ar-f.webp" alt="المميزات" width="960" />
</p>

- خمسة أنماط تشغيل: التمييز (highlight)، التمرير التلقائي (scroll)، نمط السطر (line)، المؤشر السهمي (arrow)، والتتبع الصوتي (voice tracking).
- حفظ محلي أولاً للنصوص وإعدادات التطبيق.
- ضبط مخصص لمدخلات الصوت مع اختيار الجهاز، والمراقبة الحية، وبوابة الضوضاء (noise gate)، والتحكم في الكسب (gain).
- تحكم صوتي شامل في التطبيق مع تحيات تنبيه مترجمة ومعالجة مرنة للتعرف على الصوت.
- نماذج Vosk للتعرف على الصوت مع دعم مدمج للغة الإنجليزية وإمكانية تنزيل التركية، العربية، الألمانية، الفرنسية، الإسبانية، البرتغالية، والفنلندية.
- بطاقات توجيهية مع مؤقتات تنازلية للتوقف المؤقت والاستئناف التلقائي.
- محرر نصوص مدمج مع أدوات التنسيق، وعد الكلمات، وحساب وقت القراءة المقدر.
- تدفق رسائل عن بُعد مع مراجعة صندوق الوارد، وروابط الاستجابة السريعة (QR)، وتحديثات حالة الرد من جانب المرسل.
- تحرير فوري للنصوص يتيح لعدة ضيوف الانضمام وتعديل النص في نفس الوقت عبر غرفة متصفح خاصة ومحمية.
- توليد وإعادة صياغة النصوص اختيارياً باستخدام الذكاء الاصطناعي المدعوم من Groq.
- نافذة عائمة دائمة في المقدمة لنظام Windows مع خيارات النقر عبر النافذة (click-through) وحماية التقاط الشاشة (capture-protection).
- نظام تحديث رسمي من Tauri مع فحوصات داخل التطبيق، وعناصر تحكم في التثبيت، ودعم تغذية إصدارات Windows الموقعة.

---

<p align="center">
  <img src="src/assets/readme-assets/ar-sc.webp" alt="استعراض الميزات" width="960" />
</p>

### 1. إرسال الرسائل (Message Injection)
https://github.com/user-attachments/assets/5e6a4fd1-5084-4e33-b56e-0142c2ad83ce

### 2. التحرير في الوقت الفعلي (Realtime Editing)
https://github.com/user-attachments/assets/653988f9-03f1-40ad-95b8-04339356cb07

---

<p align="center">
  <img src="src/assets/readme-assets/ar-ss.webp" alt="لقطات الشاشة" width="960" />
</p>

<div align="center">
  <h3>المظهر الرئيسي للمُلقن</h3>
  <img src="./assets/main teleprompter.png" width="400" alt="المُلقن الرئيسي"/>
  <img src="./assets/main chaned size.png" width="400" alt="تغيير الحجم والتخطيط"/>
  
  <br><br>
  
  <h3>محرر النصوص ومساعد الذكاء الاصطناعي المدمج</h3>
  <img src="./assets/text editor.png" width="400" alt="واجهة محرر النصوص"/>
  <img src="./assets/AI assistant.png" width="400" alt="تكامل مساحة عمل الذكاء الاصطناعي"/>

  <br><br>

  <h3>الإعدادات والعرض المصغر</h3>
  <img src="./assets/settings.png" width="400" alt="إعدادات التطبيق"/>
  <img src="./assets/minimized.png" width="400" alt="النافذة المصغرة"/>
</div>

---

<p align="center">
  <img src="src/assets/readme-assets/ar-win.webp" alt="ما الجديد؟" width="960" />
</p>

- **مكتبة وإدارة النصوص (Script Library & Manager)**: إضافة مدير نصوص مدمج لحفظ النصوص المتعددة وتنظيمها والبحث فيها والتبديل بينها على الفور، مع دعم الاستيراد السريع للملفات.<br><br>
- **متصفح الأقسام وتتبع الإنجاز (Section Navigator & Completion Tracker)**: إضافة وسوم الأقسام لتقسيم النصوص الطويلة إلى محطات واضحة، مع إمكانية التنقل السريع بين الأقسام ومتابعة نسبة الإنجاز والتقدم أثناء القراءة مباشرة.<br><br>
- **هيكلة برمجية نمطية (Modularized Codebase)**: إعادة بناء الوظائف الأساسية ضمن بنية معمارية نمطية عالية الكفاءة لتحسين سرعة التحميل والاستقرار الفائق والتطوير المستقبلي.<br><br>
- **شاشة بدء التشغيل (Splash Screen)**: إضافة شاشة بدء أنيقة بتأثير انتقال سلس (crossfade) لمنع أي وميض بصري عند فتح التطبيق.<br><br>
- **تحسينات الشاشات المتعددة ودقة DPI**: تحسين تموضع النوافذ، ودقة الإحداثيات، وتوافق التحجيم عبر الشاشات المتعددة وبيئات كثافة النقاط المتنوعة (mixed-DPI).<br><br>

---

<p align="center">
  <img src="src/assets/readme-assets/ar-rm.webp" alt="خارطة الطريق" width="960" />
</p>

- [x] إعادة كتابة البنية المعمارية الأساسية باستخدام Tauri + Rust
- [x] طبقة شفافة وغير مرئية لمشاركة الشاشة، والعروض التقديمية، ومكالمات الفيديو
- [x] التوثيق والإطلاق على متجر Microsoft Store
- [x] الانتقال إلى Cloudflare
- [x] v2.0.0: إعادة هيكلة وحدات JavaScript للواجهة الأمامية وتحسين الأداء
- [x] v2.0.0: تطبيق منطق الفصل بين النسخة المجانية والاحترافية (Free/Pro)
- [ ] v2.1.0: تحسينات على الصفحة الرئيسية لموقع الويب وعميل التحكم عن بعد
- [ ] v2.2.0+: سيتم تحديده لاحقاً

---

<p align="center">
  <img src="src/assets/readme-assets/ar-gs.webp" alt="ابدأ الآن" width="960" />
</p>

1. قم بتنزيل أحدث إصدار من [Microsoft Store](https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct) أو [إصدارات GitHub](https://github.com/LumoRez07/flow/releases)؛
2. شغّل ملف التثبيت بصيغة `.exe` أو `.msi`؛
3. افتح Flow وابدأ الإلقاء.

---

## التطوير

المتطلبات:
- Node.js
- Rust
- متطلبات Tauri لنظام التشغيل Windows

التشغيل محلياً:

<div dir="ltr">

```bash
npm install
npm run tauri dev
```

</div>

البناء والتجميع:

<div dir="ltr">

```bash
npm run tauri build
```

</div>

مخرجات البناء:

<div dir="ltr">

```text
src-tauri/target/release
src-tauri/target/release/bundle
```

</div>

### إصدار التحديثات الموقع

لإنشاء إصدار Windows جاهز للنشر على GitHub Releases ونظام التحديث المدمج في Flow، قم بتحميل مفتاح توقيع أداة التحديث في بيئة العمل قبل البناء:

<div dir="ltr">

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Raw "$HOME\.tauri\flow-updater.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "<your-updater-key-password>"
npm run tauri build
```

</div>

انشر هذه الملفات من المجلد `src-tauri/target/release/bundle` إلى إصدار GitHub:

- `msi/flow_2.0.0_x64_en-US.msi`
- `latest.json`

يتم إنشاء ملف `.sig` بجانب ملف MSI كمرجع، بينما يمثل `latest.json` مصدر التحديثات الذي يستهلكه التطبيق.

---

## الخصوصية

- يتم تخزين معظم البيانات محلياً على جهازك.
- يعمل التتبع الصوتي محلياً بالكامل عبر نماذج Vosk.
- تُرسل طلبات Groq فقط عند استخدام ميزات الذكاء الاصطناعي.
- راجع [privacy-policy.md](privacy-policy.md) للاطلاع على سياسة الخصوصية الحالية.

---

## شكر وتقدير

شكر خاص لكل من [@emanschigames](https://www.instagram.com/emanschigames/?hl=en) و[@nour690](https://github.com/nour690) على دعمهما لـ Flow Teleprompter في الوقت الذي كان بأمس الحاجة إليه. حتى لو كانت لفتة صغيرة، فقد عنت الكثير وهي محل تقدير وامتنان خالص.


---

## الترخيص

هذا المشروع مرخص بموجب رخصة GPL-3.0-or-later. راجع ملف [LICENSE](LICENSE).

---

## سجل النجوم (Star History)

<div align="center" dir="ltr">
<a href="https://www.star-history.com/?repos=LumoRez07%2FFlow&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
 </picture>
</a>
</div>

</div>
