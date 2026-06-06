//! Tauri commands for security tools

use localpdf_core::tools::{run_protect, run_unlock};
use localpdf_core::types::{ProtectOpts, UnlockOpts, EncryptionPermissions, Progress};
use std::sync::mpsc::channel;
use std::path::PathBuf;
use tauri::State;
use crate::state::AppState;

#[tauri::command]
async fn pdf_protect(
    app_state: State<'_, AppState>,
    input_file: String,
    output_path: String,
    user_password: String,
    owner_password: Option<String>,
    allow_print: bool,
    allow_modify: bool,
    allow_copy: bool,
    allow_annotate: bool,
    overwrite: bool,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    let _ = temp_dir;

    let permissions = EncryptionPermissions {
        print: allow_print,
        modify: allow_modify,
        extract: allow_copy,
        annotate: allow_annotate,
    };

    let opts = ProtectOpts {
        input_file: PathBuf::from(input_file),
        output_path: PathBuf::from(output_path),
        user_password,
        owner_password: owner_password.or(Some(user_password.clone())),
        permissions,
        overwrite,
    };

    let (tx, rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result = tokio::task::spawn_blocking(move || {
        run_protect(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[tauri::command]
async fn pdf_unlock(
    app_state: State<'_, AppState>,
    input_file: String,
    output_path: String,
    password: String,
    overwrite: bool,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    let _ = temp_dir;

    let opts = UnlockOpts {
        input_file: PathBuf::from(input_file),
        output_path: PathBuf::from(output_path),
        password,
        overwrite,
    };

    let (tx, rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result = tokio::task::spawn_blocking(move || {
        run_unlock(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}