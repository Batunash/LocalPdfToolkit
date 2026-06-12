//! Tauri commands for edit tools

use localpdf_core::tools;
use localpdf_core::types::{RotateOpts, RotationAngle, WatermarkOpts, WatermarkType, WatermarkPosition, PageNumOpts, PageNumPosition, PageNumFormat, CropOpts, CropMargins, CropUnit, Progress, JobOutput};
use serde::Deserialize;
use std::sync::mpsc::channel;
use std::path::PathBuf;
use tauri::State;
use crate::state::AppState;

/// Options for PDF watermark command
#[derive(Debug, Clone, Deserialize)]
pub struct WatermarkCommandOpts {
    input_file: String,
    output_path: String,
    text: String,
    position: String,
    opacity: f32,
    #[serde(rename = "angle")]
    _angle: Option<f32>,
    font_size: Option<f32>,
    color: Option<String>,
    overwrite: bool,
}

/// Options for PDF page numbers command
#[derive(Debug, Clone, Deserialize)]
pub struct PageNumCommandOpts {
    input_file: String,
    output_path: String,
    position: String,
    format: String,
    #[serde(rename = "start_number")]
    _start_number: Option<u32>,
    font_size: Option<f32>,
    overwrite: bool,
}

/// Options for PDF crop command
#[derive(Debug, Clone, Deserialize)]
pub struct CropCommandOpts {
    input_file: String,
    output_path: String,
    left: f64,
    top: f64,
    right: f64,
    bottom: f64,
    unit: String,
    overwrite: bool,
}

#[tauri::command]
pub async fn pdf_rotate(
    app_state: State<'_, AppState>,
    input_file: String,
    output_path: String,
    pages: Option<Vec<u32>>,
    angle: u32,
    overwrite: bool,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    // temp_dir is used implicitly through the AppState's internal temp_dir lifecycle
    let _ = temp_dir;

    let rotation = match angle {
        90 => RotationAngle::Deg90,
        180 => RotationAngle::Deg180,
        270 => RotationAngle::Deg270,
        _ => return Err("Angle must be 90, 180, or 270".to_string()),
    };

    let opts = RotateOpts {
        input_file: PathBuf::from(input_file),
        output_path: PathBuf::from(output_path),
        pages,
        rotation,
        overwrite,
    };

    let (tx, _rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p); // Silently ignore if receiver is dropped (job completed)
    };

    let result: std::result::Result<std::result::Result<JobOutput, localpdf_core::LpError>, tokio::task::JoinError> = tokio::task::spawn_blocking(move || {
        tools::rotate::run(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[tauri::command]
pub async fn pdf_watermark(
    _app_state: State<'_, AppState>,
    opts: WatermarkCommandOpts,
) -> Result<String, String> {
    let temp_dir = _app_state.create_temp_dir().map_err(|e| e.to_string())?;
    // temp_dir is used implicitly through the AppState's internal temp_dir lifecycle
    let _ = temp_dir;

    let pos = match opts.position.as_str() {
        "diagonal" => WatermarkPosition::Diagonal,
        "custom" => WatermarkPosition::Custom { x: 0.0, y: 0.0 },
        _ => WatermarkPosition::Center,
    };

    let opts = WatermarkOpts {
        input_file: PathBuf::from(opts.input_file),
        output_path: PathBuf::from(opts.output_path),
        watermark_type: WatermarkType::Text,
        text: Some(opts.text),
        image_path: None,
        position: pos,
        opacity: opts.opacity.clamp(0.0, 1.0),
        font_size: opts.font_size,
        font_color: opts.color,
        overwrite: opts.overwrite,
    };

    let (tx, _rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p); // Silently ignore if receiver is dropped (job completed)
    };

    let result: std::result::Result<std::result::Result<JobOutput, localpdf_core::LpError>, tokio::task::JoinError> = tokio::task::spawn_blocking(move || {
        tools::watermark::run(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[tauri::command]
pub async fn pdf_page_numbers(
    _app_state: State<'_, AppState>,
    opts: PageNumCommandOpts,
) -> Result<String, String> {
    let temp_dir = _app_state.create_temp_dir().map_err(|e| e.to_string())?;
    // temp_dir is used implicitly through the AppState's internal temp_dir lifecycle
    let _ = temp_dir;

    let pos = match opts.position.as_str() {
        "top_left" => PageNumPosition::TopLeft,
        "top_right" => PageNumPosition::TopRight,
        "bottom_left" => PageNumPosition::BottomLeft,
        "bottom_right" => PageNumPosition::BottomRight,
        _ => PageNumPosition::BottomCenter,
    };

    let fmt = if opts.format.contains('/') || opts.format.contains("of") {
        PageNumFormat::Fraction
    } else if opts.format.contains('{') {
        PageNumFormat::Custom(opts.format)
    } else {
        PageNumFormat::Simple
    };

    let opts = PageNumOpts {
        input_file: PathBuf::from(opts.input_file),
        output_path: PathBuf::from(opts.output_path),
        position: pos,
        format: fmt,
        font_size: opts.font_size,
        font_color: None,
        overwrite: opts.overwrite,
    };

    let (tx, _rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p); // Silently ignore if receiver is dropped (job completed)
    };

    let result: std::result::Result<std::result::Result<JobOutput, localpdf_core::LpError>, tokio::task::JoinError> = tokio::task::spawn_blocking(move || {
        tools::page_numbers::run(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[tauri::command]
pub async fn pdf_crop(
    _app_state: State<'_, AppState>,
    opts: CropCommandOpts,
) -> Result<String, String> {
    let temp_dir = _app_state.create_temp_dir().map_err(|e| e.to_string())?;
    // temp_dir is used implicitly through the AppState's internal temp_dir lifecycle
    let _ = temp_dir;

    let crop_unit = match opts.unit.as_str() {
        "percentage" => CropUnit::Percentage,
        _ => CropUnit::Points,
    };

    let opts = CropOpts {
        input_file: PathBuf::from(opts.input_file),
        output_path: PathBuf::from(opts.output_path),
        margins: CropMargins {
            left: opts.left as f32,
            top: opts.top as f32,
            right: opts.right as f32,
            bottom: opts.bottom as f32,
        },
        unit: crop_unit,
        overwrite: opts.overwrite,
    };

    let (tx, _rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p); // Silently ignore if receiver is dropped (job completed)
    };

    let result: std::result::Result<std::result::Result<JobOutput, localpdf_core::LpError>, tokio::task::JoinError> = tokio::task::spawn_blocking(move || {
        tools::crop::run(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}