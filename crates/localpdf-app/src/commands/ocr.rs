//! Tauri commands for OCR and utility tools

use localpdf_core::tools;
use localpdf_core::types::{OcrOpts, RepairOpts, Progress, JobOutput};
use std::sync::mpsc::channel;
use std::path::PathBuf;
use tauri::State;
use crate::state::AppState;

#[cfg(not(tarpaulin_include))]
#[tauri::command]
pub async fn pdf_ocr(
    app_state: State<'_, AppState>,
    input_file: String,
    output_path: String,
    language: String,
    dpi: Option<u32>,
    overwrite: bool,
) -> Result<String, String> {
    pdf_ocr_impl(&app_state, input_file, output_path, language, dpi, overwrite).await
}

pub async fn pdf_ocr_impl(
    app_state: &AppState,
    input_file: String,
    output_path: String,
    language: String,
    dpi: Option<u32>,
    overwrite: bool,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    // temp_dir is used implicitly through the AppState's internal temp_dir lifecycle
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
        let _ = tx.send(p); // Silently ignore if receiver is dropped (job completed)
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

#[cfg(not(tarpaulin_include))]
#[tauri::command]
pub async fn pdf_repair(
    app_state: State<'_, AppState>,
    input_file: String,
    output_path: String,
    overwrite: bool,
) -> Result<String, String> {
    pdf_repair_impl(&app_state, input_file, output_path, overwrite).await
}

pub async fn pdf_repair_impl(
    app_state: &AppState,
    input_file: String,
    output_path: String,
    overwrite: bool,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    // temp_dir is used implicitly through the AppState's internal temp_dir lifecycle
    let _ = temp_dir;

    let opts = RepairOpts {
        input_file: PathBuf::from(input_file),
        output_path: PathBuf::from(output_path),
        overwrite,
    };

    let (tx, _rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p); // Silently ignore if receiver is dropped (job completed)
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

#[cfg(test)]
mod tests {
    use super::*;

    use crate::commands::common_test as common;

    #[tokio::test]
    async fn test_pdf_ocr_impl() {
        let state = AppState::default();
        let pdf = common::get_dummy_pdf();
        let out = PathBuf::from("tests/fixtures/ocr_test_out.pdf");
        
        let result = pdf_ocr_impl(
            &state,
            pdf.to_string_lossy().to_string(),
            out.to_string_lossy().to_string(),
            "eng".to_string(),
            Some(300),
            true,
        ).await;
        
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_pdf_repair_impl() {
        let state = AppState::default();
        let pdf = common::get_dummy_pdf();
        let out = PathBuf::from("tests/fixtures/repair_test_out.pdf");
        
        let result = pdf_repair_impl(
            &state,
            pdf.to_string_lossy().to_string(),
            out.to_string_lossy().to_string(),
            true,
        ).await;
        
        assert!(result.is_ok());
    }
}