//! Tauri commands for edit tools

use localpdf_core::tools::{run_rotate, run_watermark, run_page_numbers, run_crop};
use localpdf_core::types::{RotateOpts, RotationAngle, WatermarkOpts, WatermarkType, WatermarkPosition, PageNumOpts, PageNumPosition, PageNumFormat, CropOpts, CropMargins, CropUnit, Progress};
use std::sync::mpsc::channel;
use std::path::PathBuf;
use tauri::State;
use crate::state::AppState;

#[tauri::command]
async fn pdf_rotate(
    app_state: State<'_, AppState>,
    input_file: String,
    output_path: String,
    pages: Option<Vec<u32>>,
    angle: u32,
    overwrite: bool,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    let _ = temp_dir;

    let rotation = match angle {
        90 => RotationAngle::Deg90,
        180 => RotationAngle::Deg180,
        270 => RotationAngle::Deg270,
        _ => RotationAngle::Deg90,
    };

    let opts = RotateOpts {
        input_file: PathBuf::from(input_file),
        output_path: PathBuf::from(output_path),
        pages,
        rotation,
        overwrite,
    };

    let (tx, rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result = tokio::task::spawn_blocking(move || {
        run_rotate(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[tauri::command]
async fn pdf_watermark(
    app_state: State<'_, AppState>,
    input_file: String,
    output_path: String,
    text: String,
    position: String,
    opacity: f32,
    angle: Option<f32>,
    font_size: Option<f32>,
    color: Option<String>,
    overwrite: bool,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    let _ = temp_dir;

    let pos = match position.as_str() {
        "diagonal" => WatermarkPosition::Diagonal,
        "custom" => WatermarkPosition::Custom { x: 0.0, y: 0.0 },
        _ => WatermarkPosition::Center,
    };

    let opts = WatermarkOpts {
        input_file: PathBuf::from(input_file),
        output_path: PathBuf::from(output_path),
        watermark_type: WatermarkType::Text,
        text: Some(text),
        image_path: None,
        position: pos,
        opacity: opacity.clamp(0.0, 1.0),
        font_size,
        font_color: color,
        overwrite,
    };

    let (tx, rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result = tokio::task::spawn_blocking(move || {
        run_watermark(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[tauri::command]
async fn pdf_page_numbers(
    app_state: State<'_, AppState>,
    input_file: String,
    output_path: String,
    position: String,
    format: String,
    start_number: Option<u32>,
    font_size: Option<f32>,
    overwrite: bool,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    let _ = temp_dir;

    let pos = match position.as_str() {
        "top_left" => PageNumPosition::TopLeft,
        "top_right" => PageNumPosition::TopRight,
        "bottom_left" => PageNumPosition::BottomLeft,
        "bottom_right" => PageNumPosition::BottomRight,
        _ => PageNumPosition::BottomCenter,
    };

    let fmt = if format.contains('/') || format.contains("of") {
        PageNumFormat::Fraction
    } else if format.contains('{') {
        PageNumFormat::Custom(format)
    } else {
        PageNumFormat::Simple
    };

    let opts = PageNumOpts {
        input_file: PathBuf::from(input_file),
        output_path: PathBuf::from(output_path),
        position: pos,
        format: fmt,
        font_size,
        font_color: None,
        overwrite,
    };

    let (tx, rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result = tokio::task::spawn_blocking(move || {
        run_page_numbers(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[tauri::command]
async fn pdf_crop(
    app_state: State<'_, AppState>,
    input_file: String,
    output_path: String,
    left: f64,
    top: f64,
    right: f64,
    bottom: f64,
    unit: String,
    overwrite: bool,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    let _ = temp_dir;

    let crop_unit = match unit.as_str() {
        "percentage" => CropUnit::Percentage,
        _ => CropUnit::Points,
    };

    let opts = CropOpts {
        input_file: PathBuf::from(input_file),
        output_path: PathBuf::from(output_path),
        margins: CropMargins {
            left: left as f32,
            top: top as f32,
            right: right as f32,
            bottom: bottom as f32,
        },
        unit: crop_unit,
        overwrite,
    };

    let (tx, rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result = tokio::task::spawn_blocking(move || {
        run_crop(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}