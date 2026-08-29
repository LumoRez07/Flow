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
    <td align="center"><a href="README.tr.md"><img src="src/assets/readme-assets/tr-circle.webp" width="32" height="32" alt="Türkçe" /><br /><sub><b>Türkçe</b></sub></a></td>
    <td align="center"><a href="README.ar.md"><img src="src/assets/readme-assets/sa-circle.webp" width="32" height="32" alt="العربية" /><br /><sub><b>العربية</b></sub></a></td>
    <td align="center"><a href="README.de.md"><img src="src/assets/readme-assets/de-circle.webp" width="32" height="32" alt="Deutsch" /><br /><sub><b>Deutsch</b></sub></a></td>
    <td align="center"><a href="README.fr.md"><img src="src/assets/readme-assets/fr-circle.webp" width="32" height="32" alt="Français" /><br /><sub><b>Français</b></sub></a></td>
    <td align="center"><img src="src/assets/readme-assets/br-circle-active.webp" width="32" height="32" alt="Português" /><br /><sub><b>Português</b></sub></td>
    <td align="center"><a href="README.fi.md"><img src="src/assets/readme-assets/fi-circle.webp" width="32" height="32" alt="Suomi" /><br /><sub><b>Suomi</b></sub></a></td>
  </tr>
</table>

<p align="center">
  <a href="https://github.com/LumoRez07/flow/releases" target="_blank">
    <img src="https://img.shields.io/github/v/release/LumoRez07/flow?style=flat-square&color=2563eb&label=versão" alt="Versão 2.0.0" />
  </a>
  <a href="https://github.com/LumoRez07/flow/releases" target="_blank">
    <img src="https://img.shields.io/github/downloads/LumoRez07/flow/total?style=flat-square&color=3b82f6" alt="Downloads no GitHub" />
  </a>
  <a href="https://sourceforge.net/projects/flowteleprompter/files/latest/download">
    <img src="https://img.shields.io/sourceforge/dm/flowteleprompter.svg?style=flat-square" alt="Downloads no SourceForge" />
  </a>
  <img src="https://img.shields.io/badge/plataforma-Windows%2010%20%7C%2011-0078D6?style=flat-square&logo=windows&logoColor=white" alt="Windows" />
  <img src="https://img.shields.io/badge/platform-Linux%20(community)-FCC624?style=flat-square&logo=linux&logoColor=black" alt="Linux (community port)" />
  <img src="https://img.shields.io/badge/motor-Rust%20%2B%20Tauri%20v2-FFC131?style=flat-square&logo=tauri&logoColor=black" alt="Tauri + Rust" />
  <img src="https://img.shields.io/badge/licen%C3%A7a-GPLv3-22c55e?style=flat-square" alt="Licença GPLv3" />
</p>

<p align="center">
  <strong>Teleprompter leve e de alto desempenho para Windows, desenvolvido com Rust e Tauri.</strong>
</p>

<p align="center">
  Por favor, considere dar uma estrela a este repositório se ele te ajudar! ⭐
</p>

<p align="center">
  <a href="https://www.ghacks.net/de/2026/05/28/flow-teleprompter-windows-voice-tracking/" target="_blank">
    <img src="assets/featured%20on%20ghacks.svg" alt="Destaque no Ghacks" width="480" />
  </a>
</p>

## O Flow está disponível em
<div align="center">
  <a href="https://sourceforge.net/p/flowteleprompter/">
    <img alt="Baixar o Flow Teleprompter" src="https://sourceforge.net/sflogo.php?type=17&amp;group_id=4087698" width="200">
  </a>
  <a href="https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct">
    <img alt="Obter na Microsoft Store" src="https://get.microsoft.com/images/en-us%20dark.svg" width="200"/>
  </a>
  <br>
</div>

</div>

---

<p align="center">
  <img src="src/assets/readme-assets/pt-f.webp" alt="Recursos" width="960" />
</p>

- Cinco modos de reprodução: destaque (highlight), rolagem contínua (scroll), linha por linha (line), seta indicadora (arrow) e acompanhamento por voz (voice tracking).
- Armazenamento local de roteiros e persistência de configurações com foco em privacidade (local-first).
- Calibração dedicada de entrada de áudio com seleção de dispositivo, monitoramento em tempo real, noise gate e controle de ganho (gain).
- Controle por voz em todo o aplicativo com saudações de ativação localizadas e reconhecimento resiliente.
- Modelos de fala Vosk com inglês integrado e suporte para download em português, turco, árabe, alemão, francês, espanhol e finlandês.
- Cartões de deixa (cue cards) com pausas em contagem regressiva e retomada automática.
- Editor de roteiros integrado com ferramentas de formatação, contagem de palavras e estimativa de tempo de leitura.
- Fluxo de mensagens remotas com visualização na caixa de entrada, links QR de conexão rápida e atualizações de status de resposta do remetente.
- Edição de texto em tempo real permitindo que múltiplos convidados participem e editem o roteiro simultaneamente por meio de uma sala privada no navegador.
- Geração e reescrita de texto opcionais alimentadas por IA com Groq.
- Sobreposição em primeiro plano constante (always-on-top) para Windows com opções de clique transparente (click-through) e proteção contra captura de tela (capture-protection).
- Atualizador oficial do Tauri com verificações no aplicativo, controles de instalação e suporte a feeds de versões assinadas para Windows.

---

<p align="center">
  <img src="src/assets/readme-assets/pt-sc.webp" alt="Demonstração de Recursos" width="960" />
</p>

### 1. Injeção de Mensagens (Message Injection)
https://github.com/user-attachments/assets/5e6a4fd1-5084-4e33-b56e-0142c2ad83ce

### 2. Edição em Tempo Real (Realtime Editing)
https://github.com/user-attachments/assets/653988f9-03f1-40ad-95b8-04339356cb07

---

<p align="center">
  <img src="src/assets/readme-assets/pt-ss.webp" alt="Capturas de Tela" width="960" />
</p>

<div align="center">
  <h3>Visualização Principal do Teleprompter</h3>
  <img src="./assets/main teleprompter.png" width="400" alt="Visualização Principal"/>
  <img src="./assets/main chaned size.png" width="400" alt="Layout Redimensionado"/>
  
  <br><br>
  
  <h3>Editor de Texto & Assistente de IA Integrado</h3>
  <img src="./assets/text editor.png" width="400" alt="Interface do Editor de Texto"/>
  <img src="./assets/AI assistant.png" width="400" alt="Integração do Assistente de IA"/>

  <br><br>

  <h3>Configurações & Visualização Compacta</h3>
  <img src="./assets/settings.png" width="400" alt="Configurações do Aplicativo"/>
  <img src="./assets/minimized.png" width="400" alt="Sobreposição Compacta"/>
</div>

---

<p align="center">
  <img src="src/assets/readme-assets/pt-win.webp" alt="Novidades" width="960" />
</p>

- **Biblioteca e gerenciador de roteiros**: Adicionado um gerenciador de roteiros integrado para salvar, organizar, pesquisar e alternar entre vários roteiros instantaneamente, além de recursos rápidos de importação de arquivos.<br><br>
- **Navegador de seções e acompanhamento de progresso**: Adicionadas marcações de seção para dividir roteiros longos em etapas claras, permitindo navegar entre blocos com um clique e acompanhar a conclusão da leitura em tempo real.<br><br>
- **Base de código modularizada**: Reestruturação das funcionalidades centrais em uma arquitetura modular de alto desempenho para inicialização mais rápida e máxima estabilidade.<br><br>
- **Tela de inicialização (Splash Screen)**: Adicionada uma tela de abertura elegante com transição suave (crossfade) para eliminar oscilações visuais ao abrir o app.<br><br>
- **Ajustes para múltiplos monitores e DPI**: Aprimorado o posicionamento de janelas, a precisão das coordenadas e o dimensionamento em configurações com diferentes densidades de pixels (DPI).<br><br>

---

<p align="center">
  <img src="src/assets/readme-assets/pt-rm.webp" alt="Roteiro de Desenvolvimento (Roadmap)" width="960" />
</p>

- [x] Reescrita da arquitetura principal com Tauri + Rust
- [x] Sobreposição invisível para compartilhamento de tela, apresentações e chamadas de vídeo
- [x] Certificação e lançamento na Microsoft Store
- [x] Migração para Cloudflare
- [x] v2.0.0: Refatoração de módulos JavaScript do frontend e melhorias de desempenho
- [x] v2.0.0: Implementação da lógica de divisão de recursos entre versões Free/Pro
- [ ] v2.1.0: Melhorias na página inicial web e no cliente de controle remoto
- [ ] v2.2.0+: A definir

---

<p align="center">
  <img src="src/assets/readme-assets/pt-gs.webp" alt="Como Começar" width="960" />
</p>

1. Baixe a versão mais recente na [Microsoft Store](https://apps.microsoft.com/detail/9p1fvfhwpmqr?mode=direct) ou no [GitHub Releases](https://github.com/LumoRez07/flow/releases);
2. Execute o instalador `.exe` ou `.msi`;
3. Abra o Flow e comece a apresentar.

---

## Desenvolvimento

Requisitos:
- Node.js
- Rust
- Pré-requisitos do Tauri para Windows

Executar localmente:

```bash
npm install
npm run tauri dev
```

Compilar (Build):

```bash
npm run tauri build
```

Saída da compilação:

```text
src-tauri/target/release
src-tauri/target/release/bundle
```

### Versão assinada do atualizador

Para gerar uma versão para Windows pronta para o GitHub Releases e o atualizador integrado do Flow, carregue a chave de assinatura do atualizador no ambiente antes de compilar:

```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content -Raw "$HOME\.tauri\flow-updater.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "<your-updater-key-password>"
npm run tauri build
```

Publique estes arquivos de `src-tauri/target/release/bundle` na versão do GitHub:

- `msi/flow_2.0.0_x64_en-US.msi`
- `latest.json`

O arquivo `.sig` é gerado junto com o MSI para referência, enquanto o `latest.json` é o feed do atualizador consumido pelo aplicativo.

---

## Linux (community port)

Flow also builds natively on Linux, as an AppImage, `.deb`, `.rpm`, or an Arch `PKGBUILD`. This is a community-maintained port; Windows remains the primary, officially supported platform. See [BUILDING-LINUX.md](BUILDING-LINUX.md) for prerequisites and build instructions — there is no official pre-built binary release yet, so building from source (or grabbing an artifact from the [Linux CI workflow](.github/workflows/build-linux.yml)) is currently required.

Honest limitations compared to Windows:

| Feature | Linux |
| --- | --- |
| Screen-capture protection | Not available — the underlying API is Windows-only, with no X11/Wayland equivalent. |
| Wayland | Runs via XWayland by default (always-on-top, absolute positioning, and global hotkeys need it); native Wayland is opt-in but breaks those three. |
| Remote Control | Works, but needs a one-time manual firewall exception for TCP port 43127 (most Linux desktops default-deny inbound connections, unlike Windows' first-launch prompt). |
| In-app auto-update | Works for the AppImage; `.deb`/`.rpm`/`PKGBUILD` installs update through your distro's package manager instead. |

---

## Privacidade

- A maior parte dos dados é armazenada localmente no dispositivo.
- O acompanhamento por voz é executado localmente por meio de modelos Vosk.
- Solicitações ao Groq são enviadas apenas quando recursos de IA são utilizados ativamente.
- Consulte [privacy-policy.md](privacy-policy.md) para acessar a política de privacidade atual.

---

## Agradecimentos

Um agradecimento especial a [@emanschigames](https://www.instagram.com/emanschigames/?hl=en) e [@nour690](https://github.com/nour690) por apoiarem o Flow Teleprompter no momento em que ele mais precisava. Mesmo sendo um pequeno gesto, significou muito e é sinceramente apreciado.


---

## Licença

Este projeto está licenciado sob a GPL-3.0-or-later. Consulte [LICENSE](LICENSE).

---

## Histórico de Estrelas (Star History)

<a href="https://www.star-history.com/?repos=LumoRez07%2FFlow&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
   <img alt="Star History Chart" src="https://api.star-history.com/chart?repos=LumoRez07/Flow&type=date&legend=top-left" />
 </picture>
</a>
