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
    <img src="src/assets/readme-assets/fi-circle-active.webp" width="32" height="32" alt="Suomi (Valittu)" /><br />
    <sub><b>Suomi</b></sub>
  </span>
</p>

<p align="center">
  <a href="https://github.com/LumoRez07/flow/releases" target="_blank">
    <img src="https://img.shields.io/github/v/release/LumoRez07/flow?style=flat-square&color=2563eb&label=versio" alt="Versio 2.0.0" />
  </a>
  <a href="https://github.com/LumoRez07/flow/releases" target="_blank">
    <img src="https://img.shields.io/github/downloads/LumoRez07/flow/total?style=flat-square&color=3b82f6" alt="GitHub-lataukset" />
  </a>
  <a href="https://sourceforge.net/projects/flowteleprompter/files/latest/download">
    <img src="https://img.shields.io/sourceforge/dm/flowteleprompter.svg?style=flat-square" alt="SourceForge-lataukset" />
  </a>
  <img src="https://img.shields.io/badge/alusta-Windows%2010%20%7C%2011-0078D6?style=flat-square&logo=windows&logoColor=white" alt="Windows" />
  <img src="https://img.shields.io/badge/taustajärjestelmä-Rust%20%2B%20Tauri%20v2-FFC131?style=flat-square&logo=tauri&logoColor=black" alt="Tauri + Rust" />
  <img src="https://img.shields.io/badge/lisenssi-GPLv3-22c55e?style=flat-square" alt="GPLv3-lisenssi" />
</p>

<p align="center">
  <strong>Kevyt ja suorituskykyinen teleprompteri Windowsille, rakennettu Rustilla ja Taurilla.</strong>
</p>

<p align="center">
  Harkitse tähden antamista tälle repositoriolle, jos siitä on sinulle apua! ⭐
</p>

<p align="center">
  <a href="https://www.ghacks.net/de/2026/05/28/flow-teleprompter-windows-voice-tracking/" target="_blank">
    <img src="assets/featured%20on%20ghacks.svg" alt="Esitelty Ghacksissa" width="480" />
  </a>
</p>

## Flow on saatavilla
<div align="center">
  <a href="https://sourceforge.net/p/flowteleprompter/">
    <img alt="Lataa Flow Teleprompter" src="https://sourceforge.net/sflogo.php?type=17&amp;group_id=4087698" width="200">
  </a>
  <a href="https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct">
    <img alt="Hanki Microsoft Storesta" src="https://get.microsoft.com/images/en-us%20dark.svg" width="200"/>
  </a>
  <br>
</div>

</div>

---

<p align="center">
  <img src="src/assets/readme-assets/fi-f.webp" alt="Ominaisuudet" width="960" />
</p>

- Viisi toistotilaa: korostus (highlight), vieritys (scroll), rivi (line), nuoli (arrow) ja puheenseuranta (voice tracking).
- Paikallislähtöinen käsikirjoitusten tallennus ja asetusten säilyminen (local-first).
- Erillinen äänitulon säätö laitevalinnalla, reaaliaikaisella seurannalla, kohinaportilla (noise gate) ja vahvistuksen säädöllä (gain).
- Koko sovelluksen laajuinen ääniohjaus lokalisoiduilla herätysilmauksilla ja joustavalla tunnistuksella.
- Vosk-puhemallit sisäänrakennetulla englannin kielellä sekä ladattavalla suomen, turkin, arabian, saksan, ranskan, espanjan ja portugalin tuella.
- Vihjekortit (cue cards) laskentalaskentatauolla ja automaattisella jatkamisella.
- Sisäänrakennettu käsikirjoituseditori muotoilutyökaluilla, sanamäärälaskurilla ja arvioidulla lukuajan näytöllä.
- Etäviestintätoiminto saapuneiden viestien tarkastelulla, pikayhdistettävillä QR-linkeillä ja lähettäjäpuolen vastaustilapäivityksillä.
- Reaaliaikainen tekstinmuokkaus, jonka avulla useat vieraat voivat liittyä ja muokata käsikirjoitusta samanaikaisesti yksityisen selainhuoneen kautta.
- Valinnainen Groq-pohjainen tekoälytekstin luonti ja uudelleenkirjoitus.
- Aina päällimmäisenä pysyvä (always-on-top) Windows-peittokuva läpiklikkaus- (click-through) ja kaappauksenestovaihtoehdoilla (capture-protection).
- Virallinen Tauri-päivittäjä sovelluksen sisäisillä tarkistuksilla, asennushallinnalla ja allekirjoitettujen Windows-julkaisujen syötteillä.

---

<p align="center">
  <img src="src/assets/readme-assets/fi-sc.webp" alt="Ominaisuuksien esittely" width="960" />
</p>

### 1. Viestin syöttö (Message Injection)
https://github.com/user-attachments/assets/5e6a4fd1-5084-4e33-b56e-0142c2ad83ce

### 2. Reaaliaikainen muokkaus (Realtime Editing)
https://github.com/user-attachments/assets/653988f9-03f1-40ad-95b8-04339356cb07

---

<p align="center">
  <img src="src/assets/readme-assets/fi-ss.webp" alt="Kuvakaappaukset" width="960" />
</p>

<div align="center">
  <h3>Teleprompterin päänäkymä</h3>
  <img src="./assets/main teleprompter.png" width="400" alt="Päänäkymä"/>
  <img src="./assets/main chaned size.png" width="400" alt="Uudelleenskaalattu asettelu"/>
  
  <br><br>
  
  <h3>Tekstieditori ja sisäänrakennettu tekoälyavustaja</h3>
  <img src="./assets/text editor.png" width="400" alt="Tekstieditorin käyttöliittymä"/>
  <img src="./assets/AI assistant.png" width="400" alt="Tekoälytyötilan integraatio"/>

  <br><br>

  <h3>Asetukset ja kompaktinäkymä</h3>
  <img src="./assets/settings.png" width="400" alt="Sovelluksen asetukset"/>
  <img src="./assets/minimized.png" width="400" alt="Kompakti peittokuvanäkymä"/>
</div>

---

<p align="center">
  <img src="src/assets/readme-assets/fi-win.webp" alt="Mitä uutta?" width="960" />
</p>

- **Käsikirjoituskirjasto ja -hallinta**: Sisäänrakennettu käsikirjoitusten hallintatyökalu useiden tekstien tallentamiseen, järjestämiseen, hakemiseen ja vaihtamiseen välittömästi sekä nopea tiedostojen tuontitoiminto.<br><br>
- **Osionavigaattori ja edistymisen seuranta**: Uudet osiotunnisteet ja visuaaliset virstanpylväät pitkien tekstien jakamiseen selkeisiin osiin, mahdollistaen nopean siirtymisen osiosta toiseen ja reaaliaikaisen edistymisen seurannan lukemisen aikana.<br><br>
- **Modulaarinen koodipohja**: Ydintoimintojen uudelleenjärjestely suorituskykyiseen modulaariseen arkkitehtuuriin nopeampaa latautumista ja vakaata toimintaa varten.<br><br>
- **Aloitusruutu (Splash Screen)**: Tyylikäs käynnistysruutu pehmeällä häivytyksellä (crossfade), joka poistaa ikkunan välkkymisen käynnistyksen yhteydessä.<br><br>
- **Moninäyttö- ja DPI-korjaukset**: Parannettu ikkunoiden kohdistus, koordinaattitarkkuus ja skaalaus usean näytön ja sekalaisten DPI-arvojen ympäristöissä.<br><br>

---

<p align="center">
  <img src="src/assets/readme-assets/fi-rm.webp" alt="Tiekartta" width="960" />
</p>

- [x] Ydinarkkitehtuurin uudelleenkirjoitus Tauri + Rust -teknologioilla
- [x] Näkymätön peittokuva näytönjakoon, esityksiin ja videopuheluihin
- [x] Microsoft Store -sertifiointi ja julkaisu
- [x] Siirtyminen Cloudflare-infrastruktuuriin
- [x] v2.0.0: Frontendin JavaScript-moduulien uudelleenjärjestely ja suorituskykyparannukset
- [x] v2.0.0: Free/Pro-versioiden erottelulogiikan toteutus
- [ ] v2.1.0: Verkkolaskeutumissivun ja etäohjausasiakkaan parannukset
- [ ] v2.2.0+: Päätetään myöhemmin

---

<p align="center">
  <img src="src/assets/readme-assets/fi-gs.webp" alt="Aloittaminen" width="960" />
</p>

1. Lataa uusin versio [Microsoft Storesta](https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct) tai [GitHub Releases -sivulta](https://github.com/LumoRez07/flow/releases);
2. Suorita `.exe`- tai `.msi`-asennusohjelma;
3. Käynnistä Flow ja aloita esityksesi.

---

## Kehitys

Vaatimukset:
- Node.js
- Rust
- Taurin edellytykset Windowsille

Suorita paikallisesti:

```bash
npm install
npm run tauri dev
```

Käännä (Build):

```bash
npm run tauri build
```

Käännöksen tuloste:

```text
src-tauri/target/release
src-tauri/target/release/bundle
```

### Allekirjoitettu päivittäjän julkaisu

Jotta voit luoda Windows-julkaisun, joka on valmis GitHub Releases -julkaisuun ja Flow'n sovelluksen sisäiseen päivittäjään, aseta päivittäjän allekirjoitusavain ympäristömuuttujiin ennen kääntämistä:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Raw "$HOME\.tauri\flow-updater.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "<your-updater-key-password>"
npm run tauri build
```

Julkaise nämä tiedostot hakemistosta `src-tauri/target/release/bundle` GitHub-julkaisuun:

- `msi/flow_2.0.0_x64_en-US.msi`
- `latest.json`

`.sig`-tiedosto luodaan MSI-tiedoston rinnalle viitteeksi, kun taas `latest.json` on sovelluksen käyttämä päivityssyöte.

---

## Tietosuoja

- Suurin osa tiedoista tallennetaan paikallisesti laitteellesi.
- Puheenseuranta toimii paikallisesti Vosk-malleilla.
- Groq-pyynnöt lähetetään vain silloin, kun tekoälyominaisuuksia käytetään aktiivisesti.
- Katso nykyinen tietosuojakäytäntö tiedostosta [privacy-policy.md](privacy-policy.md).

---

## Kiitokset

Erityiskiitos käyttäjille [@emanschigames](https://www.instagram.com/emanschigames/?hl=en) ja [@nour690](https://github.com/nour690) Flow Teleprompterin tukemisesta silloin, kun sitä eniten tarvittiin. Vaikka ele olisi ollut pieni, se merkitsi paljon ja sitä arvostetaan vilpittömästi.


---

## Lisenssi

Tämä projekti on lisensoitu GPL-3.0-or-later -lisenssillä. Katso [LICENSE](LICENSE).

---

## Tähtihistoria (Star History)

<a href="https://www.star-history.com/?repos=LumoRez07%2FFlow&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
 </picture>
</a>
