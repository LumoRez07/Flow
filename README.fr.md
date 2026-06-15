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

[English](/README.md) / [Español](/README.es.md) / [Türkçe](/README.tr.md) / [العربية](/README.ar.md) / [Deutsch](/README.de.md) / Français

<a href="https://github.com/LumoRez07/flow/releases" target="_blank">
  <img src="https://img.shields.io/github/downloads/LumoRez07/flow/total?style=flat-square&color=blue" alt="Downloads" height="20"/>
</a>
<a href="https://sourceforge.net/projects/flowteleprompter/files/latest/download">
  <img alt="Download Flow Teleprompter" src="https://img.shields.io/sourceforge/dm/flowteleprompter.svg" />
</a>

Téléprompteur ultra-léger à accélération matérielle conçu avec Rust & Tauri.

![Windows][Windows-image]
![Tauri][Tauri-image]
![Rust][Rust-image]
<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-1.9.0-2563eb?style=for-the-badge" />
  <img alt="JavaScript" src="https://img.shields.io/badge/Frontend-Vanilla%20JS-f7df1e?style=for-the-badge&logo=javascript&logoColor=111827" />
</p>
<p align="center">
N'hésitez pas à mettre une étoile à ce dépôt s'il vous aide! ⭐
</p>

<p align="center">
  <a href="https://www.ghacks.net/de/2026/05/28/flow-teleprompter-windows-voice-tracking/" target="_blank">
    <img src="assets/featured%20on%20ghacks.svg" alt="Featured on Ghacks" width="480" />
  </a>
</p>

## Flow est disponible sur
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
> Si vous rencontrez des problèmes de mise à l'échelle, veuillez télécharger la dernière version (1.9.0).
> Si Flow ne commence pas à défiler en mode de suivi vocal, veuillez vérifier les paramètres d'autorisation du microphone pour l'application et assurez-vous que le bon périphérique d'entrée est sélectionné dans les paramètres.


> [!IMPORTANT]
> Note de distribution : il est prévu que l'édition Microsoft Store devienne une version Pro. Son prix devrait augmenter entre 5 et 10 USD (pas encore décidé) pour aider à compenser la location du serveur, et les services hébergés seront activés une fois que la version Pro aura atteint le seuil d'utilisateurs requis. La version GitHub restera la version open-source gratuite et continuera de recevoir les fonctionnalités et mises à jour majeures.



## Points forts

- Cinq styles de lecture : surbrillance, défilement, ligne, flèche et suivi vocal.
- Stockage des scripts en local et persistance des paramètres.
- Réglage dédié de l'entrée sonore avec sélection de l'appareil, surveillance en direct, noise gate et contrôles de gain.
- Contrôle vocal dans toute l'application avec des mots de réveil localisés et une gestion plus résiliente de la reconnaissance.
- Modèles vocaux Vosk avec l'anglais inclus et prise en charge téléchargeable du turc, de l'arabe, de l'allemand, du français et de l'espagnol.
- Éditeur de script intégré avec formatage, nombre de mots et aides au temps de lecture.
- Flux de messagerie à distance avec examen de la boîte de réception, liens QR de connexion rapide et mises à jour de l'état des réponses côté expéditeur.
- Édition de texte en temps réel permettant à un nombre illimité d'invités de rejoindre et de modifier le script en même temps.
- Génération et réécriture optionnelles propulsées par Groq.
- Superposition Windows toujours au premier plan avec options de clic au travers et de protection contre la capture.
- Outil de mise à jour officiel de Tauri avec vérifications intégrées à l'application, contrôles d'installation et prise en charge des flux de versions Windows signés.

## 🎥 Présentation des fonctionnalités

### 1. Injection de messages
https://github.com/user-attachments/assets/5e6a4fd1-5084-4e33-b56e-0142c2ad83ce



### 2. Édition en temps réel
https://github.com/user-attachments/assets/653988f9-03f1-40ad-95b8-04339356cb07

---




## 📸 Captures d'écran

<div align="center">
  <h3>Apparence principale du téléprompteur</h3>
  <img src="./assets/main teleprompter.png" width="400" alt="Main Teleprompter"/>
  <img src="./assets/main chaned size.png" width="400" alt="Resized Layout"/>
  
  <br><br>
  
  <h3>Éditeur de texte et assistant IA intégré</h3>
  <img src="./assets/text editor.png" width="400" alt="Text Editor Interface"/>
  <img src="./assets/AI assistant.png" width="400" alt="AI Workspace Integration"/>

  <br><br>

  <h3>Paramètres et vue compacte</h3>
  <img src="./assets/settings.png" width="400" alt="Application Settings"/>
  <img src="./assets/minimized.png" width="400" alt="Minimized Compact Overlay"/>
</div>

---

## Feuille de route

- [x] Réécriture de l'architecture de base Tauri + Rust
- [x] Superposition invisible pour contourner OBS
- [x] Certification et sortie sur le Microsoft Store
- [x] Migration vers Cloudflare
- [ ] v2.0.0 : Refonte et amélioration des modules JavaScript frontend pour des améliorations de performances
- [ ] v2.0.0 : Implémentation de la logique de séparation des niveaux Gratuit/Pro

---

## Nouveautés de la v1.9.0

- Introduction d'une nouvelle fonctionnalité d'édition en temps réel utilisant WebRTC (PeerJS), permettant l'édition de scripts en direct sur plusieurs appareils via un salon de navigateur privé et sécurisé.
- Mise à niveau du générateur de code QR vers une bibliothèque plus performante (QRCode).
- Amélioration de la stabilité, des performances et de la mise à l'échelle dans toute l'application avec diverses optimisations et corrections sous le capot.
- Diminution de l'utilisation de la RAM tout en maintenant/améliorant les performances.

---

## Pour commencer

1. Téléchargez la dernière version depuis le [Microsoft Store](https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct) ou les [GitHub Releases](https://github.com/LumoRez07/flow/releases);
2. Exécutez le programme d'installation `.exe` ou `.msi`;
3. Lancez Flow et commencez à prompter.

---

## Développement

Prérequis :
- Node.js
- Rust
- Prérequis Tauri pour Windows

Exécuter localement :

```bash
npm install
npm run tauri dev
```

Construire :

```bash
npm run tauri build
```

Sortie de construction :

```text
src-tauri/target/release
src-tauri/target/release/bundle
```

### Version de mise à jour signée

Pour produire une version Windows prête pour les versions GitHub et l'outil de mise à jour intégré de Flow, chargez la clé de signature de mise à jour dans les variables d'environnement avant de construire :

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Raw "$HOME\.tauri\flow-updater.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "<your-updater-key-password>"
npm run tauri build
```

Publiez ces fichiers à partir de `src-tauri/target/release/bundle` dans la version GitHub :

- `msi/flow_1.9.0_x64_en-US.msi`
- `latest.json`

Le fichier `.sig` est généré aux côtés du MSI pour référence, tandis que `latest.json` est le flux de mise à jour consommé par l'application.

## Confidentialité

- La plupart des données sont stockées localement sur l'appareil.
- Le suivi vocal est conçu pour fonctionner localement avec les modèles Vosk.
- Les requêtes Groq ne sont envoyées que lorsque les fonctionnalités d'IA sont utilisées.
- Voir [privacy-policy.md](privacy-policy.md) pour la politique de confidentialité actuelle.

## Licence

Ce projet est sous licence GPL-3.0-or-later. Voir [LICENSE](LICENSE).

## Historique des étoiles

<a href="https://www.star-history.com/?repos=LumoRez07%2FFlow&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
 </picture>
</a>
