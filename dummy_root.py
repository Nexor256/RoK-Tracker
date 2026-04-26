import sys
import os
from pathlib import Path


def get_app_root() -> Path:
    """
    Returns the root directory where config files (config.json, presets.json) live.

    - Development (plain Python):  directory containing this file (project root).
    - PyInstaller --onefile:       ``sys._MEIPASS`` parent → use sys.executable.
    - Nuitka --onefile:            ``sys.argv[0]`` parent (or its parent if inside `binaries`).
    """
    candidates = []

    # 1. PyInstaller frozen bundle
    if getattr(sys, "frozen", False):
        exe_path = Path(sys.executable).resolve().parent
        candidates.append(exe_path)
        if exe_path.name == "binaries":
            candidates.append(exe_path.parent)

    # 2. Executable / Entrypoint path (works for Nuitka onefile)
    if sys.argv and sys.argv[0]:
        argv_path = Path(sys.argv[0]).resolve().parent
        candidates.append(argv_path)
        if argv_path.name == "binaries":
            candidates.append(argv_path.parent)

    # 3. Current Working Directory
    candidates.append(Path.cwd())

    # 4. Fallback to normal Python execution
    file_path = Path(__file__).resolve().parent
    candidates.append(file_path)

    # Return the first candidate that contains config.json
    for candidate in candidates:
        if (candidate / "config.json").exists():
            return candidate

    # If not found, use the fallback depending on bundle type
    if getattr(sys, "frozen", False):
        exe_path = Path(sys.executable).resolve().parent
        if exe_path.name == "binaries":
            return exe_path.parent
        return exe_path
        
    if sys.argv and sys.argv[0] and ("onefile" in str(__file__).lower() or "temp" in str(__file__).lower() or "tmp" in str(__file__).lower()):
        argv_path = Path(sys.argv[0]).resolve().parent
        if argv_path.name == "binaries":
            return argv_path.parent
        return argv_path
        
    return file_path
