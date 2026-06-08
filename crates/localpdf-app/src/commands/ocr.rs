//! Tauri commands for OCR and utility tools

use localpdf_core::tools;
use localpdf_core::types::{OcrOpts, RepairOpts, Progress, JobOutput};
use std::sync::mpsc::channel;
use std::path::PathBuf;
use tauri::State;
use crate::state::AppState;

#[tauri::command]
pub async fn pdf_ocr(
    app_state: State<'_, AppState>,
    input_file: String,
    output_path: String,
    language: String,
    dpi: Option<u32>,
    overwrite: bool,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    let _ = temp_dir;

    let langs: Vec<String> = language
        .split('+')
        .map(|s| s.trim().to_lowercase())
        .collect();

    let opts = OcrOpts {
        input_file: PathBuf::from(input_file),
        output_path: PathBuf::from(output_path),
        languages: langs,
        dpi: dpi.unwrap_or(300),
        overwrite,
    };

    let (tx, _rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result: std::result::Result<std::result::Result<JobOutput, localpdf_core::LpError>, tokio::task::JoinError> = tokio::task::spawn_blocking(move || {
        tools::ocr::run(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[tauri::command]
pub async fn pdf_repair(
    app_state: State<'_, AppState>,
    input_file: String,
    output_path: String,
    overwrite: bool,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    let _ = temp_dir;

    let opts = RepairOpts {
        input_file: PathBuf::from(input_file),
        output_path: PathBuf::from(output_path),
        overwrite,
    };

    let (tx, _rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result: std::result::Result<std::result::Result<JobOutput, localpdf_core::LpError>, tokio::task::JoinError> = tokio::task::spawn_blocking(move || {
        tools::repair::run(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}