export interface AnalyzedError {
  title: string
  suggestion: string
}

interface ErrorPattern {
  pattern: RegExp
  title: string
  suggestion: string
}

/**
 * Table-driven error patterns, checked top to bottom before the generic
 * ADB/heuristic fallbacks. Add new entries here — most specific first.
 */
const ERROR_PATTERNS: ErrorPattern[] = [
  // --- Filesystem / output files ---
  {
    pattern: /permissionerror|\[errno\s*13\]|eacces|being used by another process|file_in_use/i,
    title: 'File Access Denied',
    suggestion:
      'A file could not be written or read. If your scan result is open in Excel, close it and retry. Also check that no antivirus has quarantined the app folder.',
  },
  {
    pattern: /no space left|disk full|errno\s*28/i,
    title: 'Disk Full',
    suggestion:
      'The drive holding the scan output is out of space. Free up some space and run the scan again.',
  },
  {
    pattern: /scan file is missing|failed to delete scan file|nosuchfile|filenotfound/i,
    title: 'Scan File Missing',
    suggestion:
      'The selected scan file no longer exists on disk. Refresh the history list — it may have been moved or deleted.',
  },

  // --- ADB runtime states (these do NOT contain the word "adb") ---
  {
    pattern: /device offline/i,
    title: 'Emulator Offline',
    suggestion:
      'The emulator reported itself offline. Wait a few seconds for it to finish booting, then try again. Restarting the emulator usually helps.',
  },
  {
    pattern: /device unauthorized|unauthorized device/i,
    title: 'ADB Unauthorized',
    suggestion:
      'The emulator is asking for permission to accept the ADB connection. Check the emulator screen for an authorization prompt and accept it.',
  },
  {
    pattern: /no devices\/emulators found|no devices found|device not found/i,
    title: 'No Emulator Found',
    suggestion:
      'ADB cannot see any running emulator. Make sure your emulator is fully started and its ADB option is enabled in the emulator settings.',
  },
  {
    pattern: /more than one device/i,
    title: 'Multiple Emulators Running',
    suggestion:
      'More than one emulator is running, so ADB cannot tell which one to use. Close all but one emulator instance (or set a specific port in Settings) and retry.',
  },
  {
    pattern: /address already in use/i,
    title: 'Port Already In Use',
    suggestion:
      'Something else is already listening on that port. Try a different ADB port in Settings or restart the emulator.',
  },

  // --- Emulator configuration ---
  {
    pattern: /bluestacks\.conf|bluestacks config/i,
    title: 'BlueStacks Config Missing',
    suggestion:
      'The BlueStacks configuration file could not be read. Verify the path in Settings points to bluestacks.conf (usually C:\\ProgramData\\BlueStacks_nxt\\bluestacks.conf).',
  },

  // --- Screenshot / computer vision stack ---
  {
    pattern: /cv2|opencv|mss|screencap failed|screenshot/i,
    title: 'Screenshot Capture Failed',
    suggestion:
      'The scanner could not capture the emulator screen. Restart the emulator and verify it renders the game correctly, then retry.',
  },

  // --- Sidecar lifecycle / packaging ---
  {
    pattern: /traceback|module not found|modulenotfounderror|importerror/i,
    title: 'Scanner Backend Crash',
    suggestion:
      'The scanner backend hit an unexpected internal error. Please share your sidecar.log file with the developers — see Troubleshooting on the wiki.',
  },
]

export function analyzeError(errorString: string): AnalyzedError {
  const lowerError = errorString.toLowerCase()

  for (const { pattern, title, suggestion } of ERROR_PATTERNS) {
    if (pattern.test(errorString) || pattern.test(lowerError)) {
      return { title, suggestion }
    }
  }

  // ADB Connection Errors (generic fallback after specific ADB states above)
  if (
    lowerError.includes('adb') ||
    lowerError.includes('failed to connect') ||
    lowerError.includes('adberror')
  ) {
    return {
      title: 'ADB Connection Failed',
      suggestion:
        'Please ensure your emulator is running and its ADB port is correct in the Settings. Also ensure USB debugging is enabled if using a physical device.',
    }
  }

  // Tesseract OCR Errors
  if (lowerError.includes('tesseract') || lowerError.includes('ocr')) {
    return {
      title: 'Tesseract OCR Error',
      suggestion:
        'Tesseract could not be found or executed. Please ensure Tesseract OCR is installed on your system and its path is correctly configured in the Settings.',
    }
  }

  // Configuration Errors
  if (
    lowerError.includes('configerror') ||
    lowerError.includes('validation error') ||
    lowerError.includes('invalid json')
  ) {
    return {
      title: 'Configuration Error',
      suggestion:
        'There is an issue saving or loading configuration files. Please double-check the values in your Settings page and ensure no files were manually corrupted.',
    }
  }

  // Template / Computer Vision Errors
  if (
    lowerError.includes('template') ||
    lowerError.includes('could not find') ||
    lowerError.includes('not found on screen')
  ) {
    return {
      title: 'Image Matching Failed',
      suggestion:
        'The scanner could not locate the required UI elements. Please ensure your emulator resolution is set to exactly 1600x900, and the game is clearly visible on the right screen.',
    }
  }

  // Memory / Generic App crashes
  if (lowerError.includes('memory') || lowerError.includes('oom') || lowerError.includes('killed')) {
    return {
      title: 'Out of Memory Error',
      suggestion:
        'The application ran out of memory. Please try restarting the tracker and close unnecessary programs.',
    }
  }

  // Fallback for everything else
  return {
    title: 'Unexpected Backend Error',
    suggestion:
      'An unexpected error occurred in the scanner. Please review the error message above or check the sidecar.log file in your app folder for more context.',
  }
}
