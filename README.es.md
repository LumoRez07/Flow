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

[English](/README.md) / Español / [Türkçe](/README.tr.md) / [العربية](/README.ar.md) / [Deutsch](/README.de.md) / [Français](/README.fr.md)

<a href="https://github.com/LumoRez07/flow/releases" target="_blank">
  <img src="https://img.shields.io/github/downloads/LumoRez07/flow/total?style=flat-square&color=blue" alt="Downloads" height="20"/>
</a>
<a href="https://sourceforge.net/projects/flowteleprompter/files/latest/download">
  <img alt="Download Flow Teleprompter" src="https://img.shields.io/sourceforge/dm/flowteleprompter.svg" />
</a>

Teleprompter ultraligero y acelerado por hardware, creado con Rust y Tauri.

![Windows][Windows-image]
![Tauri][Tauri-image]
![Rust][Rust-image]
<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-1.9.0-2563eb?style=for-the-badge" />
  <img alt="JavaScript" src="https://img.shields.io/badge/Frontend-Vanilla%20JS-f7df1e?style=for-the-badge&logo=javascript&logoColor=111827" />
</p>
<p align="center">
¡Considera darle una estrella a este repositorio si te ayuda! ⭐
</p>

## Flow está disponible en
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
> Si experimentas problemas de escala, descarga la última versión (1.9.0).
> Si Flow no comienza a desplazarse en el modo de seguimiento de voz, verifica la configuración de permisos del micrófono para la aplicación y asegúrate de seleccionar el dispositivo de entrada correcto en la configuración.


> [!IMPORTANT]
> Nota de distribución: está previsto que la edición de Microsoft Store se convierta en una versión Pro. Se espera que su precio aumente a 5-10 USD (Aún no decidido) para ayudar a compensar el alquiler del servidor, y los servicios alojados se activarán una vez que el lanzamiento Pro alcance el umbral de usuarios requerido. La versión de GitHub seguirá siendo la versión gratuita de código abierto y continuará recibiendo funciones y actualizaciones importantes.



## Características principales

- Cinco estilos de reproducción: resaltado, desplazamiento, línea, flecha y seguimiento de voz.

- Almacenamiento de guiones primero en local y persistencia de configuraciones.

- Ajuste dedicado de entrada de sonido con selección de dispositivo, monitoreo en vivo, puerta de ruido y controles de ganancia.

- Control por voz en toda la aplicación con saludos de activación localizados y un manejo de reconocimiento más resistente.

- Modelos de voz Vosk con soporte incluido para inglés y descargable para turco, árabe, alemán, francés y español.

- Editor de guiones integrado con ayudas de formato, recuento de palabras y tiempo de lectura.

- Flujo de mensajería remota con revisión de bandeja de entrada, enlaces QR de conexión rápida y actualizaciones del estado de respuesta del lado del remitente.

- Edición de texto en tiempo real que permite a un número ilimitado de invitados unirse y editar el guion al mismo tiempo.

- Generación y reescritura opcionales impulsadas por Groq.

- Superposición de Windows siempre visible (always-on-top) con opciones para hacer clic a través (click-through) y protección contra capturas.

- Actualizador oficial de Tauri con comprobaciones en la aplicación, controles de instalación y soporte para fuentes de lanzamiento firmadas de Windows.

## 🎥 Demostración de funciones

### 1. Inyección de mensajes
https://github.com/user-attachments/assets/5e6a4fd1-5084-4e33-b56e-0142c2ad83ce



### 2. Edición en tiempo real
https://github.com/user-attachments/assets/653988f9-03f1-40ad-95b8-04339356cb07

---




## 📸 Capturas de pantalla

<div align="center">
  <h3>Vista principal del teleprompter</h3>
  <img src="./assets/main teleprompter.png" width="400" alt="Main Teleprompter"/>
  <img src="./assets/main chaned size.png" width="400" alt="Resized Layout"/>
  
  <br><br>
  
  <h3>Editor de texto y asistente de IA integrado</h3>
  <img src="./assets/text editor.png" width="400" alt="Text Editor Interface"/>
  <img src="./assets/AI assistant.png" width="400" alt="AI Workspace Integration"/>

  <br><br>

  <h3>Configuración y vista compacta</h3>
  <img src="./assets/settings.png" width="400" alt="Application Settings"/>
  <img src="./assets/minimized.png" width="400" alt="Minimized Compact Overlay"/>
</div>

---

## Hoja de ruta

- [x] Reescritura de la arquitectura central con Tauri + Rust
- [x] Superposición invisible para evitar OBS
- [x] Certificación y lanzamiento en Microsoft Store
- [x] Migración a Cloudflare
- [ ] v2.0.0: Refactorización y mejora del módulo JavaScript del frontend para mejorar el rendimiento
- [ ] v2.0.0: Implementación de la lógica de división de niveles Gratis/Pro (Free/Pro)

---

## Novedades en la v1.9.0

- Se introdujo una nueva función de edición en tiempo real utilizando WebRTC (PeerJS), que permite la edición de guiones en vivo entre dispositivos a través de una sala de navegador privada y segura.
- Se actualizó el generador de códigos QR a una biblioteca con mejor rendimiento (QRCode).
- Mejora de la estabilidad, el rendimiento y el escalado en toda la aplicación con varias optimizaciones y correcciones internas.
- Disminución del uso de RAM manteniendo/mejorando el rendimiento.

---

## Primeros pasos

1. Descarga la última versión de [Microsoft Store](https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct) o de [GitHub Releases](https://github.com/LumoRez07/flow/releases);
2. Ejecuta el instalador .exe o .msi;
3. Inicia Flow y comienza a leer.

---

## Desarrollo

Requisitos:
- Node.js
- Rust
- Tauri prerequisites for Windows

Ejecutar localmente:

```bash
npm install
npm run tauri dev
```

Construir:

```bash
npm run tauri build
```

Salida de la construcción:

```text
src-tauri/target/release
src-tauri/target/release/bundle
```

### Versión con actualizador firmado

Para producir una versión de Windows lista para GitHub Releases y el actualizador integrado de Flow, carga la clave de firma del actualizador en el entorno antes de compilar:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Raw "$HOME\.tauri\flow-updater.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "<your-updater-key-password>"
npm run tauri build
```

Publica estos archivos desde `src-tauri/target/release/bundle` en la versión de GitHub:

- `msi/flow_1.9.0_x64_en-US.msi`
- `latest.json`

El archivo `.sig` se genera junto con el MSI como referencia, mientras que `latest.json` es el feed del actualizador que consume la aplicación.


## Privacidad

- La mayoría de los datos se almacenan localmente en el dispositivo.
- El seguimiento de voz está diseñado para ejecutarse localmente con modelos Vosk.
- Las solicitudes a Groq solo se envían cuando se utilizan funciones de IA.
- Consulta [privacy-policy.md](privacy-policy.md) para ver la política de privacidad actual.
## Licencia

Este proyecto tiene licencia GPL-3.0-or-later. Consulta el archivo [LICENSE](LICENSE).

## Historial de estrellas

<a href="https://www.star-history.com/?repos=LumoRez07%2FFlow&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
 </picture>
</a>
