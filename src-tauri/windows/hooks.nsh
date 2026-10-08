; NSIS hooks — see `bundle > windows > nsis > installerHooks` in tauri.conf.json.
;
; Tauri's installer only checks whether the main binary is running
; (`CheckIfAppIsRunning "$INSTDIR\${MAINBINARYNAME}.exe"`), so it force-closes
; the app but never the Python sidecar. A live `scanner_sidecar.exe` keeps its
; own executable locked, and the installer then fails while copying it with:
;
;   Error opening file for writing: scanner_sidecar.exe
;
; Closing the sidecar here fixes that for every user of this installer,
; including the update *into* this version — the app-side fix in
; `useUpdater.ts` cannot help there, because that update is driven by the
; previously installed (still unfixed) build.

!macro NSIS_HOOK_PREINSTALL
  ; Uses the same Windows Restart Manager mechanism as the main-binary check,
  ; so it is bitness-independent and needs no extra plugin. In passive mode
  ; (which the updater uses) this closes the sidecar without prompting.
  ; Registering a path that does not exist is a no-op, so fresh installs are
  ; unaffected.
  !insertmacro CheckIfAppIsRunning "$INSTDIR\scanner_sidecar.exe" "RoK Tracker Suite"
!macroend
