fn main() {
    // Expose the target triple so sidecar.rs can resolve the correct binary name.
    // Tauri's externalBin installs binaries as `name-{target_triple}[.exe]`.
    let target = std::env::var("TARGET").unwrap();
    println!("cargo:rustc-env=TARGET_TRIPLE={}", target);

    tauri_build::build()
}
