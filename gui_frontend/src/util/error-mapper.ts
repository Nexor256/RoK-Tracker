export interface AnalyzedError {
  title: string
  suggestion: string
}

export function analyzeError(errorString: string): AnalyzedError {
  const lowerError = errorString.toLowerCase()

  // ADB Connection Errors
  if (lowerError.includes('adb') || lowerError.includes('failed to connect') || lowerError.includes('adberror')) {
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
  if (lowerError.includes('configerror') || lowerError.includes('validation error') || lowerError.includes('invalid json')) {
    return {
      title: 'Configuration Error',
      suggestion:
        'There is an issue saving or loading configuration files. Please double-check the values in your Settings page and ensure no files were manually corrupted.',
    }
  }

  // Template / Computer Vision Errors
  if (lowerError.includes('template') || lowerError.includes('could not find') || lowerError.includes('not found on screen')) {
    return {
      title: 'Image Matching Failed',
      suggestion:
        'The scanner could not locate the required UI elements. Please ensure your emulator resolution is set to exactly 1280x720, and the game is clearly visible on the right screen.',
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
      'An unexpected error occurred in the scanner. Please review the error message above or check the kingdom-scanner.log file in your app folder for more context.',
  }
}
