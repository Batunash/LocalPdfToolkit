//! Tauri commands for utility functions

use std::path::PathBuf;
use tauri::State;
use crate::state::AppState;

#[tauri::command]
async fn get_temp_dir(app_state: State<'_, AppState>) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    Ok(temp_dir.to_string_lossy().to_string())
}

#[tauri::command]
async fn clean_temp(app_state: State<'_, AppState>) -> Result<u64, String> {
    let temp_guard = app_state.temp_dir.read().map_err(|e| e.to_string())?;
    if let Some(ref temp) = *temp_guard {
        let path = temp.path().to_path_buf();
        drop(temp_guard);
        let count = count_entries(&path);

        let _ = std::fs::remove_dir_all(&path);

        Ok(count)
    } else {
        Ok(0)
    }
}

fn count_entries(path: &PathBuf) -> u64 {
    let mut count = 0;
    if let Ok(mut entries) = std::fs::read_dir(path) {
        while let Some(Ok(_)) = entries.next() {
            count += 1;
        }
    }
    count
}

#[tauri::command]
fn app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}