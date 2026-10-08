; NSIS hooks — see `bundle > windows > nsis > installerHooks` in tauri.conf.json.
;
; Tauri's install section only checks whether the main binary is running
; (`CheckIfAppIsRunning "${MAINBINARYNAME}.exe"`), so it force-closes the app
; but never the Python sidecar. A live `scanner_sidecar.exe` keeps its own
; executable locked, and the installer then fails while copying it with:
;
;   Error opening file for writing: scanner_sidecar.exe
;
; Closing the sidecar here covers every user of this installer, including the
; update *into* this version — the app-side fix in `useUpdater.ts` cannot help
; there, because that update is driven by the previously installed (still
; unfixed) build.

!macro NSIS_HOOK_PREINSTALL
  ; Note the bare executable name. Tauri calls this macro the same way for the
  ; main binary, and `nsis_tauri_utils::FindProcess`/`KillProcess` match on the
  ; process image name. Passing "$INSTDIR\scanner_sidecar.exe" here does not
  ; match anything, so the hook silently does nothing.
  !insertmacro CheckIfAppIsRunning "scanner_sidecar.exe" "RoK Tracker Suite"

  ; `CheckIfAppIsRunning` kills the process and then waits a fixed 500 ms, which
  ; is not always long enough for Windows to release the executable image. Poll
  ; until the process is actually gone so the copy below cannot race the
  ; teardown. Bounded so a wedged sidecar cannot hang the installer forever.
  !define HookUniqueID ${__LINE__}
    StrCpy $R8 0
  sidecar_wait_${HookUniqueID}:
    IntCmp $R8 25 sidecar_done_${HookUniqueID}
    nsis_tauri_utils::FindProcess "scanner_sidecar.exe"
    Pop $R0
    ${If} $R0 != 0
      Goto sidecar_done_${HookUniqueID}
    ${EndIf}
    Sleep 200
    IntOp $R8 $R8 + 1
    Goto sidecar_wait_${HookUniqueID}
  sidecar_done_${HookUniqueID}:
  !undef HookUniqueID
!macroend
