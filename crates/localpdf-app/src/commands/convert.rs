//! Tauri commands for conversion utilities

use localpdf_core::tools;
use localpdf_core::types::{ConvertOpts, PdfInfo, ThumbnailOpts, Progress, JobOutput};
use std::path::PathBuf;
use tauri::State;
use crate::state::AppState;

#[tauri::command]
pub async fn convert_any(
    app_state: State<'_, AppState>,
    input_file: String,
    output_path: String,
    target_format: String,
    dpi: Option<u32>,
    quality: Option<u32>,
    overwrite: bool,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    let _ = temp_dir;

    let format = match target_format.to_lowercase().as_str() {
        "pdf" => localpdf_core::types::TargetFormat::Pdf,
        "docx" => localpdf_core::types::TargetFormat::Docx,
        "xlsx" => localpdf_core::types::TargetFormat::Xlsx,
        "pptx" => localpdf_core::types::TargetFormat::Pptx,
        "jpg" | "jpeg" => localpdf_core::types::TargetFormat::Jpg,
        "png" => localpdf_core::types::TargetFormat::Png,
        "html" => localpdf_core::types::TargetFormat::Html,
        _ => localpdf_core::types::TargetFormat::Pdf,
    };

    let opts = ConvertOpts {
        input_file: PathBuf::from(input_file),
        output_path: PathBuf::from(output_path),
        target_format: format,
        options: localpdf_core::types::ConversionOptions {
            dpi,
            quality,
            page_range: None,
        },
        overwrite,
    };

    let (tx, _rx) = std::sync::mpsc::channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result: std::result::Result<std::result::Result<JobOutput, localpdf_core::LpError>, tokio::task::JoinError> = tokio::task::spawn_blocking(move || {
        tools::convert::run(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[tauri::command]
pub async fn pdf_info(input_file: String) -> Result<serde_json::Value, String> {
    let result: std::result::Result<std::result::Result<PdfInfo, localpdf_core::LpError>, tokio::task::JoinError> = tokio::task::spawn_blocking(move || {
        localpdf_core::utils::get_pdf_info(&PathBuf::from(input_file))
    }).await;

    match result {
        Ok(Ok(info)) => {
            serde_json::to_value(info).map_err(|e| e.to_string())
        },
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[tauri::command]
pub async fn pdf_thumbnail(
    app_state: State<'_, AppState>,
    input_file: String,
    pages: Vec<u32>,
    dpi: Option<u32>,
    _overwrite: bool,
) -> Result<Vec<String>, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    let _ = temp_dir;

    let _opts = ThumbnailOpts {
        input_file: PathBuf::from(input_file),
        pages,
        dpi: dpi.unwrap_or(150),
    };

    // Stub - actual thumbnail generation needed
    Ok(vec![])
}

