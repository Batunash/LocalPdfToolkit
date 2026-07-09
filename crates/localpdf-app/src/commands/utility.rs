//! Tauri commands for utility functions

use std::path::PathBuf;
use tauri::State;
use crate::state::AppState;

#[cfg(not(tarpaulin_include))]
#[tauri::command]
pub async fn get_temp_dir(app_state: State<'_, AppState>) -> Result<String, String> {
    get_temp_dir_impl(&app_state)
}

pub fn get_temp_dir_impl(app_state: &AppState) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    Ok(temp_dir.to_string_lossy().to_string())
}

#[cfg(not(tarpaulin_include))]
#[tauri::command]
pub async fn clean_temp(app_state: State<'_, AppState>) -> Result<u64, String> {
    clean_temp_impl(&app_state)
}

pub fn clean_temp_impl(app_state: &AppState) -> Result<u64, String> {
    let temp_guard = app_state.temp_dir.read().map_err(|e| e.to_string())?;
    if let Some(ref temp) = *temp_guard {
        let path = temp.path().to_path_buf();
        drop(temp_guard);
        let count = count_entries(&path);

        let _ = std::fs::remove_dir_all(&path); // Silently ignore cleanup failures

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
pub fn app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_app_version() {
        assert!(!app_version().is_empty());
    }

    #[test]
    fn test_get_temp_dir_impl() {
        let state = AppState::default();
        let path = get_temp_dir_impl(&state).unwrap();
        assert!(!path.is_empty());
    }

    #[test]
    fn test_clean_temp_impl() {
        let state = AppState::default();
        // Nothing to clean yet
        assert_eq!(clean_temp_impl(&state).unwrap(), 0);
        
        // Create temp dir and put a file in it
        let path = get_temp_dir_impl(&state).unwrap();
        let file_path = PathBuf::from(&path).join("test.txt");
        std::fs::write(&file_path, "test").unwrap();
        
        // Should clean it
        let cleaned = clean_temp_impl(&state).unwrap();
        assert_eq!(cleaned, 1);
    }
}