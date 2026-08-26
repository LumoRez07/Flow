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
    <img src="src/assets/readme-assets/es-circle-active.webp" width="32" height="32" alt="Español (Seleccionado)" /><br />
    <sub><b>Español</b></sub>
  </span>
  <span style="display:inline-block; margin: 0 10px; text-align: center;">
    <a href="README.tr.md" style="text-decoration:none;">
      <img src="src/assets/readme-assets/tr-circle.webp" width="32" height="32" alt="Türkçe" /><br />
      <sub><b>Türkçe</b></sub>
    </a>
  </span>
  <span style="display:inline-block; margin: 0 10px; text-align: center;">
    <a href="README.ar.md" style="text-decoration:none;">
      <img src="src/assets/readme-assets/sa-circle.webp" width="32" height="32" alt="العربية" /><br />
      <sub><b>العربية</b></sub>
    </a>
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
    <img src="https://img.shields.io/github/v/release/LumoRez07/flow?style=flat-square&color=2563eb&label=versión" alt="Versión 2.0.0" />
  </a>
  <a href="https://github.com/LumoRez07/flow/releases" target="_blank">
    <img src="https://img.shields.io/github/downloads/LumoRez07/flow/total?style=flat-square&color=3b82f6" alt="Descargas en GitHub" />
  </a>
  <a href="https://sourceforge.net/projects/flowteleprompter/files/latest/download">
    <img src="https://img.shields.io/sourceforge/dm/flowteleprompter.svg?style=flat-square" alt="Descargas en SourceForge" />
  </a>
  <img src="https://img.shields.io/badge/plataforma-Windows%2010%20%7C%2011-0078D6?style=flat-square&logo=windows&logoColor=white" alt="Windows" />
  <img src="https://img.shields.io/badge/motor-Rust%20%2B%20Tauri%20v2-FFC131?style=flat-square&logo=tauri&logoColor=black" alt="Tauri + Rust" />
  <img src="https://img.shields.io/badge/licencia-GPLv3-22c55e?style=flat-square" alt="Licencia GPLv3" />
</p>

<p align="center">
  <strong>Teleprónter ligero y de alto rendimiento para Windows, desarrollado con Rust y Tauri.</strong>
</p>

<p align="center">
  ¡Por favor, considera darle una estrella a este repositorio si te resulta útil! ⭐
</p>

<p align="center">
  <a href="https://www.ghacks.net/de/2026/05/28/flow-teleprompter-windows-voice-tracking/" target="_blank">
    <img src="assets/featured%20on%20ghacks.svg" alt="Destacado en Ghacks" width="480" />
  </a>
</p>

## Flow está disponible en
<div align="center">
  <a href="https://sourceforge.net/p/flowteleprompter/">
    <img alt="Descargar Flow Teleprompter" src="https://sourceforge.net/sflogo.php?type=17&amp;group_id=4087698" width="200">
  </a>
  <a href="https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct">
    <img alt="Obtenerlo de Microsoft" src="https://get.microsoft.com/images/en-us%20dark.svg" width="200"/>
  </a>
  <br>
</div>

</div>

---

<p align="center">
  <img src="src/assets/readme-assets/es-f.webp" alt="Características" width="960" />
</p>

- Cinco modos de reproducción: resaltado (highlight), desplazamiento (scroll), línea (line), flecha (arrow) y seguimiento de voz (voice tracking).
- Almacenamiento local de guiones y persistencia de ajustes bajo el principio local-first.
- Calibración dedicada de entrada de audio con selección de dispositivo, monitorización en tiempo real, puerta de ruido (noise gate) y control de ganancia (gain).
- Control por voz en toda la aplicación con frases de activación localizadas y reconocimiento robusto.
- Modelos de voz Vosk con inglés integrado y soporte descargable para español, turco, árabe, alemán, francés, portugués y finlandés.
- Tarjetas guía (cue cards) con pausas de cuenta regresiva y reanudación automática.
- Editor de guiones integrado con herramientas de formato, contador de palabras y cálculo de tiempo estimado de lectura.
- Flujo de mensajería remota con bandeja de entrada, enlaces QR de conexión rápida y actualizaciones de estado de respuesta para el remitente.
- Edición de texto en tiempo real que permite a múltiples invitados unirse y editar el guion simultáneamente a través de una sala privada en el navegador.
- Generación y reescritura de texto opcional impulsada por IA con Groq.
- Superposición siempre visible (always-on-top) para Windows con opciones de clic a través (click-through) y protección contra capturas de pantalla (capture-protection).
- Actualizador oficial de Tauri con comprobaciones en la aplicación, controles de instalación y soporte para feeds de versiones firmadas de Windows.

---

<p align="center">
  <img src="src/assets/readme-assets/es-sc.webp" alt="Demostración de funciones" width="960" />
</p>

### 1. Inyección de mensajes (Message Injection)
https://github.com/user-attachments/assets/5e6a4fd1-5084-4e33-b56e-0142c2ad83ce

### 2. Edición en tiempo real (Realtime Editing)
https://github.com/user-attachments/assets/653988f9-03f1-40ad-95b8-04339356cb07

---

<p align="center">
  <img src="src/assets/readme-assets/es-ss.webp" alt="Capturas de pantalla" width="960" />
</p>

<div align="center">
  <h3>Aspecto principal del teleprónter</h3>
  <img src="./assets/main teleprompter.png" width="400" alt="Vista principal"/>
  <img src="./assets/main chaned size.png" width="400" alt="Diseño redimensionado"/>
  
  <br><br>
  
  <h3>Editor de texto y asistente de IA integrado</h3>
  <img src="./assets/text editor.png" width="400" alt="Interfaz del editor de texto"/>
  <img src="./assets/AI assistant.png" width="400" alt="Integración del asistente de IA"/>

  <br><br>

  <h3>Ajustes y vista compacta</h3>
  <img src="./assets/settings.png" width="400" alt="Configuración de la aplicación"/>
  <img src="./assets/minimized.png" width="400" alt="Superposición compacta"/>
</div>

---

<p align="center">
  <img src="src/assets/readme-assets/es-win.webp" alt="Novedades" width="960" />
</p>

- **Biblioteca y gestor de guiones**: Se incorporó un gestor de guiones integrado para guardar, organizar, buscar y alternar entre múltiples guiones al instante, junto con funciones rápidas de importación de archivos.<br><br>
- **Navegador de secciones y seguimiento de progreso**: Se añadieron etiquetas de sección e indicadores de progreso para dividir guiones extensos en hitos claros, permitiendo saltar entre secciones con un clic y monitorear el avance en tiempo real.<br><br>
- **Base de código modularizada**: Se reestructuraron las funciones principales en una arquitectura modular optimizada para mayor estabilidad, menor tiempo de carga y un desarrollo continuo más ágil.<br><br>
- **Pantalla de inicio (Splash screen)**: Se añadió una pantalla de arranque con transición suave (crossfade) para eliminar cualquier parpadeo visual al iniciar la aplicación.<br><br>
- **Correcciones para multimonitor y DPI**: Se mejoró el posicionamiento de las ventanas, la precisión de coordenadas y el escalado en configuraciones de múltiples monitores con diferentes DPI.<br><br>

---

<p align="center">
  <img src="src/assets/readme-assets/es-rm.webp" alt="Hoja de ruta" width="960" />
</p>

- [x] Reescritura de la arquitectura central con Tauri + Rust
- [x] Superposición invisible para compartir pantalla, presentaciones y videollamadas
- [x] Certificación y publicación en Microsoft Store
- [x] Migración a Cloudflare
- [x] v2.0.0: Refactorización de módulos de JavaScript del frontend y mejoras de rendimiento
- [x] v2.0.0: Implementación de la lógica de división entre versiones Free/Pro
- [ ] v2.1.0: Mejoras en la página de inicio web y en el cliente de control remoto
- [ ] v2.2.0+: Por determinar

---

<p align="center">
  <img src="src/assets/readme-assets/es-gs.webp" alt="Primeros pasos" width="960" />
</p>

1. Descarga la versión más reciente desde [Microsoft Store](https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct) o [GitHub Releases](https://github.com/LumoRez07/flow/releases);
2. Ejecuta el instalador `.exe` o `.msi`;
3. Abre Flow y comienza a presentar.

---

## Desarrollo

Requisitos:
- Node.js
- Rust
- Requisitos previos de Tauri para Windows

Ejecutar localmente:

```bash
npm install
npm run tauri dev
```

Compilar (Build):

```bash
npm run tauri build
```

Archivos generados:

```text
src-tauri/target/release
src-tauri/target/release/bundle
```

### Versión firmada para el actualizador

Para generar una versión para Windows lista para GitHub Releases y el actualizador integrado de Flow, carga la clave de firma del actualizador en las variables de entorno antes de compilar:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Raw "$HOME\.tauri\flow-updater.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "<your-updater-key-password>"
npm run tauri build
```

Publica estos archivos desde `src-tauri/target/release/bundle` en la versión de GitHub:

- `msi/flow_2.0.0_x64_en-US.msi`
- `latest.json`

El archivo `.sig` se genera junto con el instalador MSI como referencia, mientras que `latest.json` es el canal de actualizaciones que consume la aplicación.

---

## Privacidad

- La mayoría de los datos se almacenan localmente en el dispositivo.
- El seguimiento por voz se ejecuta de forma local con modelos Vosk.
- Las solicitudes a Groq solo se envían al usar las funciones de IA.
- Consulta [privacy-policy.md](privacy-policy.md) para ver la política de privacidad actual.

---

## Agradecimientos

Un agradecimiento especial a [@emanschigames](https://www.instagram.com/emanschigames/?hl=en) y [@nour690](https://github.com/nour690) por apoyar a Flow Teleprompter cuando más lo necesitaba. Aunque haya sido un pequeño gesto, significó mucho y se agradece de corazón.


---

## Licencia

Este proyecto está bajo la licencia GPL-3.0-or-later. Consulta [LICENSE](LICENSE).

---

## Historial de estrellas (Star History)

<a href="https://www.star-history.com/?repos=LumoRez07%2FFlow&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
 </picture>
</a>
