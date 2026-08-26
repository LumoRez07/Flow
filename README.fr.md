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
    <img src="src/assets/readme-assets/fr-circle-active.webp" width="32" height="32" alt="Français (Sélectionné)" /><br />
    <sub><b>Français</b></sub>
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
    <img src="https://img.shields.io/github/downloads/LumoRez07/flow/total?style=flat-square&color=3b82f6" alt="Téléchargements GitHub" />
  </a>
  <a href="https://sourceforge.net/projects/flowteleprompter/files/latest/download">
    <img src="https://img.shields.io/sourceforge/dm/flowteleprompter.svg?style=flat-square" alt="Téléchargements SourceForge" />
  </a>
  <img src="https://img.shields.io/badge/plateforme-Windows%2010%20%7C%2011-0078D6?style=flat-square&logo=windows&logoColor=white" alt="Windows" />
  <img src="https://img.shields.io/badge/moteur-Rust%20%2B%20Tauri%20v2-FFC131?style=flat-square&logo=tauri&logoColor=black" alt="Tauri + Rust" />
  <img src="https://img.shields.io/badge/licence-GPLv3-22c55e?style=flat-square" alt="Licence GPLv3" />
</p>

<p align="center">
  <strong>Téléprompteur léger et haute performance pour Windows, développé avec Rust et Tauri.</strong>
</p>

<p align="center">
  N'hésitez pas à ajouter une étoile à ce dépôt si ce projet vous est utile ! ⭐
</p>

<p align="center">
  <a href="https://www.ghacks.net/de/2026/05/28/flow-teleprompter-windows-voice-tracking/" target="_blank">
    <img src="assets/featured%20on%20ghacks.svg" alt="Présenté sur Ghacks" width="480" />
  </a>
</p>

## Flow est disponible sur
<div align="center">
  <a href="https://sourceforge.net/p/flowteleprompter/">
    <img alt="Télécharger Flow Teleprompter" src="https://sourceforge.net/sflogo.php?type=17&amp;group_id=4087698" width="200">
  </a>
  <a href="https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct">
    <img alt="Disponible sur le Microsoft Store" src="https://get.microsoft.com/images/en-us%20dark.svg" width="200"/>
  </a>
  <br>
</div>

</div>

---

<p align="center">
  <img src="src/assets/readme-assets/fr-f.webp" alt="Fonctionnalités" width="960" />
</p>

- Cinq modes de lecture : surlignage (highlight), défilement (scroll), ligne par ligne (line), flèche repère (arrow) et suivi vocal (voice tracking).
- Stockage local des scripts et persistance des paramètres (approche local-first).
- Réglage dédié de l'entrée audio avec sélection du périphérique, monitoring en direct, noise gate et contrôle du gain.
- Contrôle vocal complet de l'application avec phrases d'activation localisées et reconnaissance vocale robuste.
- Modèles vocaux Vosk avec anglais inclus et prise en charge téléchargeable pour le français, l'espagnol, l'allemand, l'arabe, le turc, le portugais et le finnois.
- Cartes mémo (cue cards) avec pauses avec compte à rebours et reprise automatique.
- Éditeur de texte intégré avec outils de mise en forme, compteur de mots et estimation du temps de lecture.
- Messagerie à distance avec consultation de la boîte de réception, liens QR de connexion instantanée et mises à jour du statut de réponse pour l'expéditeur.
- Édition de texte en temps réel permettant à plusieurs invités de rejoindre et modifier le script simultanément via un salon de navigation privé.
- Génération et reformulation de texte optionnelles assistées par l'IA de Groq.
- Fenêtre flottante toujours au premier plan (always-on-top) pour Windows avec options de clic transparent (click-through) et protection contre la capture d'écran (capture-protection).
- Module de mise à jour officiel Tauri avec vérifications intégrées, contrôle de l'installation et flux de versions Windows signées.

---

<p align="center">
  <img src="src/assets/readme-assets/fr-sc.webp" alt="Démonstration des fonctionnalités" width="960" />
</p>

### 1. Envoi de messages (Message Injection)
https://github.com/user-attachments/assets/5e6a4fd1-5084-4e33-b56e-0142c2ad83ce

### 2. Édition en temps réel (Realtime Editing)
https://github.com/user-attachments/assets/653988f9-03f1-40ad-95b8-04339356cb07

---

<p align="center">
  <img src="src/assets/readme-assets/fr-ss.webp" alt="Captures d'écran" width="960" />
</p>

<div align="center">
  <h3>Interface principale du téléprompteur</h3>
  <img src="./assets/main teleprompter.png" width="400" alt="Vue principale"/>
  <img src="./assets/main chaned size.png" width="400" alt="Disposition redimensionnée"/>
  
  <br><br>
  
  <h3>Éditeur de texte et assistant IA intégré</h3>
  <img src="./assets/text editor.png" width="400" alt="Interface de l'éditeur de texte"/>
  <img src="./assets/AI assistant.png" width="400" alt="Intégration de l'espace de travail IA"/>

  <br><br>

  <h3>Paramètres et vue compacte</h3>
  <img src="./assets/settings.png" width="400" alt="Paramètres de l'application"/>
  <img src="./assets/minimized.png" width="400" alt="Superposition compacte"/>
</div>

---

<p align="center">
  <img src="src/assets/readme-assets/fr-win.webp" alt="Nouveautés" width="960" />
</p>

- **Bibliothèque et gestionnaire de scripts** : Ajout d'un gestionnaire de scripts intégré pour sauvegarder, organiser, rechercher et basculer instantanément entre plusieurs scripts, avec importation rapide de fichiers.<br><br>
- **Navigateur de sections et suivi d'avancement** : Ajout de balises de section pour découper les scripts longs en étapes claires, naviguer d'une section à l'autre en un clic et suivre la progression de lecture en direct.<br><br>
- **Base de code modularisée** : Restructuration complète des fonctionnalités principales dans une architecture modulaire pour des temps de chargement réduits et une stabilité optimale.<br><br>
- **Écran de démarrage (Splash Screen)** : Intégration d'un écran de chargement avec fondu enchaîné (crossfade) pour éliminer tout clignotement au lancement.<br><br>
- **Corrections multi-écrans et DPI** : Amélioration du positionnement des fenêtres, de la précision des coordonnées et de la mise à l'échelle sur les configurations multi-moniteurs et multi-DPI.<br><br>

---

<p align="center">
  <img src="src/assets/readme-assets/fr-rm.webp" alt="Feuille de route" width="960" />
</p>

- [x] Réécriture complète de l'architecture principale avec Tauri + Rust
- [x] Fenêtre superposée invisible pour le partage d'écran, les présentations et les visioconférences
- [x] Certification et publication sur le Microsoft Store
- [x] Migration vers Cloudflare
- [x] v2.0.0 : Refonte des modules JavaScript frontend et optimisations des performances
- [x] v2.0.0 : Mise en place de la logique de séparation entre versions Free et Pro
- [ ] v2.1.0 : Améliorations de la page d'accueil web et du client relais distant
- [ ] v2.2.0+ : À définir

---

<p align="center">
  <img src="src/assets/readme-assets/fr-gs.webp" alt="Démarrage rapide" width="960" />
</p>

1. Téléchargez la dernière version depuis le [Microsoft Store](https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct) ou les [GitHub Releases](https://github.com/LumoRez07/flow/releases) ;
2. Exécutez le programme d'installation `.exe` ou `.msi` ;
3. Lancez Flow et commencez votre présentation.

---

## Développement

Prérequis :
- Node.js
- Rust
- Prérequis Tauri pour Windows

Exécution en local :

```bash
npm install
npm run tauri dev
```

Compilation (Build) :

```bash
npm run tauri build
```

Fichiers de sortie :

```text
src-tauri/target/release
src-tauri/target/release/bundle
```

### Version signée pour le module de mise à jour

Pour créer une version Windows prête pour GitHub Releases et le système de mise à jour intégré de Flow, chargez la clé de signature du module dans l'environnement avant la compilation :

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Raw "$HOME\.tauri\flow-updater.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "<your-updater-key-password>"
npm run tauri build
```

Publiez ces fichiers depuis `src-tauri/target/release/bundle` sur la version GitHub :

- `msi/flow_2.0.0_x64_en-US.msi`
- `latest.json`

Le fichier `.sig` est généré aux côtés du MSI à titre de référence, tandis que `latest.json` constitue le flux de mise à jour exploité par l'application.

---

## Confidentialité

- La majorité des données est stockée localement sur votre appareil.
- Le suivi vocal s'exécute localement avec les modèles Vosk.
- Les requêtes Groq ne sont envoyées que lors de l'utilisation active des fonctionnalités IA.
- Consultez [privacy-policy.md](privacy-policy.md) pour la politique de confidentialité en vigueur.

---

## Remerciements

Un grand merci à [@emanschigames](https://www.instagram.com/emanschigames/?hl=en) et [@nour690](https://github.com/nour690) pour leur soutien à Flow Teleprompter au moment où le projet en avait le plus besoin. Même s'il s'agissait d'un geste modeste, il a eu une grande importance et est sincèrement apprécié.


---

## Licence

Ce projet est sous licence GPL-3.0-or-later. Voir le fichier [LICENSE](LICENSE).

---

## Historique des étoiles (Star History)

<a href="https://www.star-history.com/?repos=LumoRez07%2FFlow&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
 </picture>
</a>
