//! Tauri commands for security tools

use localpdf_core::tools;
use localpdf_core::types::{ProtectOpts, UnlockOpts, EncryptionPermissions, Progress, JobOutput};
use std::sync::mpsc::channel;
use std::path::PathBuf;
use tauri::State;
use crate::state::AppState;

#[tauri::command]
pub async fn pdf_protect(
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
        user_password: user_password.clone(),
        owner_password: owner_password.or(Some(user_password)),
        permissions,
        overwrite,
    };

    let (tx, _rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result: std::result::Result<std::result::Result<JobOutput, localpdf_core::LpError>, tokio::task::JoinError> = tokio::task::spawn_blocking(move || {
        tools::protect::run(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[tauri::command]
pub async fn pdf_unlock(
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

    let (tx, _rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result: std::result::Result<std::result::Result<JobOutput, localpdf_core::LpError>, tokio::task::JoinError> = tokio::task::spawn_blocking(move || {
        tools::unlock::run(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}