use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Spawn the FastAPI server sidecar
      let mut sidecar_command = app.shell().sidecar("server")
        .expect("Failed to define server sidecar command");

      // Explicitly inherit environment variables
      for (key, val) in std::env::vars() {
        sidecar_command = sidecar_command.env(key, val);
      }

      let (mut rx, _child) = sidecar_command.spawn()
        .expect("Failed to spawn FastAPI server sidecar");


      // Spawn a task to monitor stdout/stderr for logging
      tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
          match event {
            CommandEvent::Stdout(line) => {
              log::info!("Sidecar stdout: {}", String::from_utf8_lossy(&line));
            }
            CommandEvent::Stderr(line) => {
              log::error!("Sidecar stderr: {}", String::from_utf8_lossy(&line));
            }
            CommandEvent::Terminated(payload) => {
              log::warn!("Sidecar terminated: {:?}", payload);
            }
            _ => {}
          }
        }
      });


      // Apply macOS window vibrancy
      #[cfg(target_os = "macos")]
      {
        if let Some(window) = app.get_webview_window("main") {
          use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState};
          let _ = apply_vibrancy(
            &window,
            NSVisualEffectMaterial::Sidebar,
            Some(NSVisualEffectState::Active),
            None,
          );
        }
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

