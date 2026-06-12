//! Tauri commands for security tools

use localpdf_core::tools;
use localpdf_core::types::{ProtectOpts, UnlockOpts, EncryptionPermissions, Progress, JobOutput};
use serde::Deserialize;
use std::sync::mpsc::channel;
use std::path::PathBuf;
use tauri::State;
use crate::state::AppState;

/// Options for PDF protect command
#[derive(Debug, Clone, Deserialize)]
pub struct ProtectCommandOpts {
    input_file: String,
    output_path: String,
    user_password: String,
    owner_password: Option<String>,
    allow_print: bool,
    allow_modify: bool,
    allow_copy: bool,
    allow_annotate: bool,
    overwrite: bool,
}

#[tauri::command]
pub async fn pdf_protect(
    _app_state: State<'_, AppState>,
    opts: ProtectCommandOpts,
) -> Result<String, String> {
    let temp_dir = _app_state.create_temp_dir().map_err(|e| e.to_string())?;
    // temp_dir is used implicitly through the AppState's internal temp_dir lifecycle
    let _ = temp_dir;

    let permissions = EncryptionPermissions {
        print: opts.allow_print,
        modify: opts.allow_modify,
        extract: opts.allow_copy,
        annotate: opts.allow_annotate,
    };

    let opts = ProtectOpts {
        input_file: PathBuf::from(opts.input_file),
        output_path: PathBuf::from(opts.output_path),
        user_password: opts.user_password.clone(),
        owner_password: opts.owner_password.or(Some(opts.user_password)),
        permissions,
        overwrite: opts.overwrite,
    };

    let (tx, _rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p); // Silently ignore if receiver is dropped (job completed)
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
    // temp_dir is used implicitly through the AppState's internal temp_dir lifecycle
    let _ = temp_dir;

    let opts = UnlockOpts {
        input_file: PathBuf::from(input_file),
        output_path: PathBuf::from(output_path),
        password,
        overwrite,
    };

    let (tx, _rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p); // Silently ignore if receiver is dropped (job completed)
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