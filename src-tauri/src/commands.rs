use serde_json::{json, Value};
use tauri::State;

use crate::sidecar::SidecarManager;

/// Send a generic command to the Python sidecar.
fn send(sidecar: &SidecarManager, cmd: &str, args: Option<Value>) -> Result<(), String> {
    sidecar.send_command(cmd, args)
}

const SCAN_DIRS: [&str; 4] = ["scans_kingdom", "scans_alliance", "scans_honor", "scans_seed"];

/// Resolve `path` to a canonical path and make sure it lives inside one of
/// the known scan output directories. This is a defense-in-depth check run
/// before a frontend-supplied path is forwarded to the sidecar or the OS
/// shell (delete / reveal-in-folder).
fn resolve_scan_path(path: &str) -> Result<std::path::PathBuf, String> {
    // `canonicalize` returns a verbatim `\\?\`-prefixed path on Windows, while
    // the roots below are plain paths. `starts_with` compares components, so
    // the mismatched prefixes made every comparison fail. `dunce::simplified`
    // strips the prefix from both sides (and leaves non-Windows paths alone).
    let canon = std::path::Path::new(path)
        .canonicalize()
        .map_err(|e| format!("Invalid path: {}", e))?;
    let canon = dunce::simplified(&canon).to_path_buf();

    // Determine project/app root depending on build mode
    let root = if cfg!(debug_assertions) {
        let cwd = std::env::current_dir().map_err(|e| e.to_string())?;
        cwd.parent().unwrap_or(&cwd).to_path_buf()
    } else {
        std::env::current_exe()
            .map_err(|e| e.to_string())?
            .parent()
            .ok_or("Failed to get exe dir")?
            .to_path_buf()
    };
    let root = dunce::simplified(&root.canonicalize().unwrap_or(root)).to_path_buf();

    // Compare canonical forms of the scan dirs too, so a symlinked or
    // differently-spelled root still matches.
    let in_scan_dir = SCAN_DIRS.iter().any(|d| {
        let dir = root.join(d);
        let dir = dunce::simplified(&dir.canonicalize().unwrap_or(dir)).to_path_buf();
        canon.starts_with(dir)
    });
    if !in_scan_dir {
        return Err(format!("Path not in scan directories: {}", path));
    }

    Ok(canon)
}

#[tauri::command]
pub fn load_config(sidecar: State<'_, SidecarManager>) -> Result<(), String> {
    send(&sidecar, "LoadFullConfig", None)
}

#[tauri::command]
pub fn load_scan_presets(sidecar: State<'_, SidecarManager>) -> Result<(), String> {
    send(&sidecar, "LoadScanPresets", None)
}

#[tauri::command]
pub fn save_config(sidecar: State<'_, SidecarManager>, config: Value) -> Result<(), String> {
    send(&sidecar, "SaveConfig", Some(json!({ "config": config })))
}

#[tauri::command]
pub fn save_scan_presets(
    sidecar: State<'_, SidecarManager>,
    presets: Value,
) -> Result<(), String> {
    send(
        &sidecar,
        "SaveScanPresets",
        Some(json!({ "presets": presets })),
    )
}

#[tauri::command]
pub fn start_kingdom_scan(
    sidecar: State<'_, SidecarManager>,
    config: Value,
    preset: Value,
) -> Result<(), String> {
    send(
        &sidecar,
        "StartKingdomScan",
        Some(json!({ "config": config, "preset": preset })),
    )
}

#[tauri::command]
pub fn stop_kingdom_scan(sidecar: State<'_, SidecarManager>) -> Result<(), String> {
    send(&sidecar, "StopKingdomScan", None)
}

#[tauri::command]
pub fn confirm_kingdom(
    sidecar: State<'_, SidecarManager>,
    confirmed: bool,
) -> Result<(), String> {
    send(
        &sidecar,
        "ConfirmKingdom",
        Some(json!({ "confirmed": confirmed })),
    )
}

#[tauri::command]
pub fn start_batch_scan(
    sidecar: State<'_, SidecarManager>,
    config: Value,
    batch_type: String,
) -> Result<(), String> {
    send(
        &sidecar,
        "StartBatchScan",
        Some(json!({ "config": config, "batch_type": batch_type })),
    )
}

#[tauri::command]
pub fn stop_batch_scan(
    sidecar: State<'_, SidecarManager>,
    batch_type: String,
) -> Result<(), String> {
    send(
        &sidecar,
        "StopBatchScan",
        Some(json!({ "batch_type": batch_type })),
    )
}

#[tauri::command]
pub fn confirm_batch(
    sidecar: State<'_, SidecarManager>,
    confirmed: bool,
    batch_type: String,
) -> Result<(), String> {
    send(
        &sidecar,
        "ConfirmBatch",
        Some(json!({ "confirmed": confirmed, "batch_type": batch_type })),
    )
}

// --- Scan History ---

#[tauri::command]
pub fn list_scan_history(sidecar: State<'_, SidecarManager>) -> Result<(), String> {
    send(&sidecar, "ListScanHistory", None)
}

#[tauri::command]
pub fn get_scan_detail(
    sidecar: State<'_, SidecarManager>,
    path: String,
    page: Option<u32>,
    page_size: Option<u32>,
) -> Result<(), String> {
    send(
        &sidecar,
        "GetScanDetail",
        Some(json!({
            "path": path,
            "page": page.unwrap_or(1),
            "page_size": page_size.unwrap_or(50),
        })),
    )
}

#[tauri::command]
pub fn compare_scans(
    sidecar: State<'_, SidecarManager>,
    path_a: String,
    path_b: String,
) -> Result<(), String> {
    send(
        &sidecar,
        "CompareScanFiles",
        Some(json!({ "path_a": path_a, "path_b": path_b })),
    )
}

#[tauri::command]
pub fn delete_scan_file(sidecar: State<'_, SidecarManager>, path: String) -> Result<(), String> {
    let canon = resolve_scan_path(&path)?;
    send(
        &sidecar,
        "DeleteScanFile",
        Some(json!({ "path": canon.to_string_lossy() })),
    )
}

#[tauri::command]
pub fn open_scan_folder(app: tauri::AppHandle, path: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    let canon = resolve_scan_path(&path)?;

    app.opener()
        .reveal_item_in_dir(&canon)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn detect_emulators(sidecar: State<'_, SidecarManager>) -> Result<(), String> {
    send(&sidecar, "DetectEmulators", None)
}

/// Stop the sidecar so a pending update can replace its executable.
///
/// Must be called *before* the update is installed. On Windows the NSIS
/// installer's `CheckIfAppIsRunning` only shuts down the main binary, so a
/// live `scanner_sidecar.exe` keeps its own file locked and the installer fails
/// with "Error opening file for writing: scanner_sidecar.exe".
///
/// This deliberately does not exit the process. `downloadAndInstall` ends in
/// `std::process::exit(0)` on Windows, so any teardown sequenced after it in JS
/// never runs; killing here — between the download and the install — is what
/// makes the ordering deterministic.
///
/// `SidecarManager::kill` already waits for the child to be reaped, so the OS
/// has released the executable image by the time this returns.
#[tauri::command]
pub fn shutdown_for_update(sidecar: State<'_, SidecarManager>) {
    sidecar.kill();
}

