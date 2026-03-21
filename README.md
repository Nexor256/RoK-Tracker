# RokTracker

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-3776AB.svg)](https://www.python.org/)
[![Platform: Windows](https://img.shields.io/badge/Platform-Windows%2010%2F11-0078D6.svg)](#requirements)

**Open-source Rise of Kingdoms stats management tool.** Automatically scan and track the top players in your kingdom, alliance, and honor leaderboards using OCR and ADB.

Originally based on the tool by [nikolakis1919](https://github.com/nikolakis1919/RokTracker) and [Cyrexxis](https://github.com/Cyrexxis/RokTracker), this version has been heavily extended with a modern GUI, multiple OCR engines, and much more.

---

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Requirements](#requirements)
- [Installation](#installation)
  - [Simple Installation (Executable)](#simple-installation-executable)
  - [Advanced Installation (Python)](#advanced-installation-python)
- [Usage](#usage)
- [Configuration](#configuration)
- [Emulator Setup](#emulator-setup)
  - [Bluestacks 5](#bluestacks-5)
  - [LD Player (Experimental)](#ld-player-experimental)
- [Output Formats](#output-formats)
- [Building from Source](#building-from-source)
- [Important Notes](#important-notes)
- [Troubleshooting & Support](#troubleshooting--support)
- [License](#license)

---

## What's New in v7

- **Unified application** — all 4 scanners (Kingdom, Alliance, Honor, Seed) combined into a single executable
- **New GUI** — completely rebuilt interface using Quasar (Vue 3) + PyWebView
- **In-app settings** — configure everything from the Settings page, no more manual `config.json` editing
- **Historical database** — SQLite-based storage for tracking governor stats over time
- **Scan presets** — save and load custom scan configurations
- **Improved OCR** — better fallback handling between Tesseract and EasyOCR

> **Note:** v7 config is not compatible with earlier versions. If upgrading, launch the app and verify your settings on the **Settings** page.

---

## Features

### Kingdom Scanner

- Complete kingdom ranking scan with detailed governor data
- Captures: Governor ID, Name, Power, Kill Points, Ranged Points, T1–T5 Kills, Total Kills, T4+T5 Kills, Dead Troops, RSS Gathered, RSS Assistance, Helps, and Alliance Name
- **Kill validation** — detects incorrect kills based on kill-to-killpoint ratios; saves flagged images to `manual_review/` (prefix `F`) with log warnings
- **Kill reconstruction** — optionally attempts to recover incorrect kill data; saves images to `manual_review/` (prefix `R`) with log info
- **Inactive detection** — automatically skips inactive accounts (those that can't be clicked in rankings); optionally saves screenshots to `inactives/`
- **Power validation** — optional plausibility check for governor power on the power ranking page
- **City Hall check** — optionally filter governors by minimum City Hall level
- **Resume scan** — continue a scan from where you left off
- **Configurable scan presets** — choose exactly which data fields to capture

### Alliance Scanner

- Complete alliance ranking scan
- Saves governor name and score
- Saves a screenshot of each name (since OCR accuracy is limited by game rendering)

### Honor Scanner

- Complete personal honor ranking scan
- Same output format and image backup as the alliance scanner

### Seed Scanner

- Lightweight scanner for quickly capturing only kill points or power from kingdom rankings
- Works like the alliance scanner but targets kingdom-level data

### General

- **Multiple OCR engines** — Tesseract and EasyOCR with configurable fallback order
- **Multiple output formats** — XLSX, CSV, and JSONL
- **Unified application** — single executable with all 4 scanners (Kingdom, Alliance, Honor, Seed) in one interface
- **Modern GUI** — built with Quasar (Vue 3) + PyWebView for a native desktop experience
- **Historical database** — SQLite-based storage for tracking governor stats over time
- **Emulator support** — Bluestacks 5 (recommended) and LD Player (experimental)
- **Configurable timings** — fine-tune delays for different system speeds

---

## Screenshots

|        Kingdom Scanner         |         Alliance Scanner         |       Honor Scanner        |       Seed Scanner       |
| :----------------------------: | :------------------------------: | :------------------------: | :----------------------: |
| ![Kingdom](images/kingdom.png) | ![Alliance](images/alliance.png) | ![Honor](images/honor.png) | ![Seed](images/seed.png) |

|            Excel Output            |          CLI Options           |
| :--------------------------------: | :----------------------------: |
| ![Excel](images/excel-example.png) | ![CLI](images/cmd-options.png) |

---

## Requirements

| Requirement                         | Details                                                                                                                         |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **OS**                              | Windows 10 or 11                                                                                                                |
| **Emulator**                        | [Bluestacks 5](https://www.bluestacks.com/bluestacks-5.html) (recommended) or LD Player                                         |
| **Tesseract Data**                  | [Trained models](https://github.com/tesseract-ocr/tessdata) — place in `deps/tessdata/`                                         |
| **ADB Platform Tools**              | [Download](https://dl.google.com/android/repository/platform-tools_r31.0.3-windows.zip) — place in `deps/platform-tools/`       |
| **Python** (advanced only)          | [Python 3.11+](https://www.python.org/downloads/release/python-3110/)                                                           |
| **C++ Build Tools** (advanced only) | [Microsoft Build Tools for C++](https://visualstudio.microsoft.com/visual-cpp-build-tools/) — may be required for some packages |

---

## Installation

### Simple Installation (Executable)

No Python required — just download and run.

1. Download the latest release: **[Latest Release](https://github.com/Cyrexxis/RokTracker/releases/latest)** (choose `RoK-Scanner.zip`)
2. Extract the zip to your desired location
3. Download and place dependencies in the `deps/` folder:
   - Tesseract trained data → `deps/tessdata/`
   - ADB Platform Tools → `deps/platform-tools/`
4. Configure your emulator ([see Emulator Setup](#emulator-setup))
5. Double-click `RokScanner.exe` to launch — all 4 scanners are available from the single application
6. Adjust settings from the **Settings** page inside the app

**Expected folder structure:**

```
./
├── _internal/
├── deps/
│   ├── inputs/
│   ├── tessdata/
│   │   └── *.traineddata
│   └── platform-tools/
│       └── adb.exe
├── config.json
└── RokTracker.exe
```

### Advanced Installation (Python)

For developers or users who want to run from source.

1. Download the source code from the [Latest Release](https://github.com/Cyrexxis/RokTracker/releases/latest) or clone the repository
2. Install [Python 3.11+](https://www.python.org/downloads/release/python-3110/) and [C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
3. Download and place dependencies in the `deps/` folder (same as simple installation)
4. Set up a virtual environment and install dependencies:

```bash
python -m venv venv
./venv/Scripts/activate
pip install -r requirements_win64.txt
```

5. Configure your emulator ([see Emulator Setup](#emulator-setup))

**Expected folder structure:**

```
./
├── deps/
│   ├── inputs/
│   ├── tessdata/
│   │   └── *.traineddata
│   └── platform-tools/
│       └── adb.exe
├── roktracker/
├── gui_frontend/
├── config.json
└── main.py
```

---

## Usage

RokTracker is a single unified application that includes all 4 scanners — Kingdom, Alliance, Honor, and Seed — in one interface.

**Executable:** Double-click `RokScanner.exe`

**From source:**

```bash
python main.py
```

This opens a PyWebView window with a Quasar-based GUI where you can:

- Select which scanner to run (Kingdom, Alliance, Honor, or Seed)
- Configure scan settings and presets
- Monitor scan progress in real time
- View results and historical data

Scan results are saved to the corresponding `scans_*/` folder (e.g., `scans_kingdom/`, `scans_alliance/`).

---

## Configuration

All settings can be configured directly from the **Settings** page inside the application. There is no need to manually edit `config.json`.

Available settings include:

- **Scan** — kingdom name, number of governors, resume, scroll mode, inactive tracking, power/kill validation, kill reconstruction, City Hall filtering, and output formats (XLSX, CSV, JSONL)
- **OCR** — engine fallback order (Tesseract / EasyOCR), page segmentation mode, OCR engine mode, languages, and GPU toggle
- **Emulator** — emulator type (Bluestacks or LD Player), instance name, config file path, and ADB port

---

## Emulator Setup

### Bluestacks 5

Configure your Bluestacks instance with these **required** settings:

**Display Tab** ([Screenshot](images/bluestacks-display.png))

- Resolution: **1600 x 900**
- DPI: **Custom (450)**

**Advanced Tab** ([Screenshot](images/bluestacks-advanced.png))

- Android Debug Bridge: **Turned on**

#### Automatic Port Detection

1. Open the **Settings** page in the app and set the Bluestacks config path to your `bluestacks.conf` file
   - Usually located at `C:\ProgramData\BlueStacks_nxt\bluestacks.conf`
2. Ensure the Bluestacks instance name in Settings matches your instance exactly
3. If no `bluestacks.conf` file exists, your installation likely uses a fixed port (default: `5555`)

### LD Player (Experimental)

Select **LD Player** as the emulator in the app's **Settings** page. LD Player support is experimental — Bluestacks 5 is recommended for the most reliable experience.

---

## Output Formats

| Format    | Extension | Description                                     |
| --------- | --------- | ----------------------------------------------- |
| **Excel** | `.xlsx`   | Default output — full spreadsheet with all data |
| **CSV**   | `.csv`    | Comma-separated values for easy import          |
| **JSONL** | `.jsonl`  | JSON Lines — one JSON object per line           |

Configure which formats to generate in the **Settings** page of the app.

---

## Building from Source

To build the standalone executable yourself:

```bash
# Install Python dependencies
pip install -r requirements_win64.txt
pip install pyinstaller-hooks-contrib

# Build the frontend
cd gui_frontend
pnpm install
pnpm run build
cd ..

# Build the executable
python build.py
```

The executable will be created in the `publish/` directory.

For detailed build instructions, see [BUILD.md](BUILD.md).

---

## Important Notes

### Before Scanning

1. **Game language must be English.** Other languages will cause issues with inactive governor detection. Switch for the scan, then switch back.
2. **Your character must be in the HOME KINGDOM** to get only your kingdom's ranks. Otherwise, you'll capture KvK players from all kingdoms.
3. **Position the game correctly** before starting:
   - Kingdom scan: top of power rankings or kill points rankings
   - Alliance scan: top of the desired alliance leaderboard
   - Honor scan: top of the personal honor rankings
4. **Do not interact with the emulator** while scanning is in progress.
5. **[Kingdom scan]** Your account must rank lower than the number of players you want to scan (e.g., you can't scan the top 100 if your rank is 85 — use a farm account).
6. **[Kingdom scan]** The resume option starts scanning from the 4th governor visible on screen (the middle one). Position the view accordingly before resuming.

### General

- The scanner **does not require admin privileges**.
- Chinese characters may not display correctly in the terminal but will appear correctly in the output files.
- You can use your computer normally while scanning, but avoid copying to the clipboard as it may interfere with governor name capture.
- Always **back up your scan output files** — subsequent scans have a small chance of overwriting previous results.

> **Version 7 config is not compatible with earlier versions.** If upgrading, launch the app and verify your settings on the **Settings** page.

---

## Troubleshooting & Support

**Wiki:** Check the [Wiki](https://github.com/Cyrexxis/RokTracker/wiki/) for detailed explanations and guides.

**GitHub Discussions:** Post questions in [GitHub Discussions](https://github.com/Cyrexxis/RokTracker/discussions) so others can benefit from the answers.

**Discord:** `cyrexxis` — available on the official RoK Server and the Chisgule server.

When requesting help, please include:

- A clear description of the problem
- Your log file (`*-scanner-web.log` or the relevant log)
- Your `config.json` file (located in the app folder — remove any sensitive paths before sharing)

> _"It doesn't work"_ without details will be ignored. This is a free-time project — please respect that.

---

## License

This project is licensed under the [MIT License](LICENSE).

Copyright (c) 2021–2022 [nikolakis1919](https://github.com/nikolakis1919) · Copyright (c) 2022–2024 [Cyrexxis](https://github.com/Cyrexxis)
