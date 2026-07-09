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
    pub input_file: String,
    pub output_path: String,
    pub text: String,
    pub position: String,
    pub opacity: f32,
    #[serde(rename = "angle")]
    pub _angle: Option<f32>,
    pub font_size: Option<f32>,
    pub color: Option<String>,
    pub overwrite: bool,
}

/// Options for PDF page numbers command
#[derive(Debug, Clone, Deserialize)]
pub struct PageNumCommandOpts {
    pub input_file: String,
    pub output_path: String,
    pub position: String,
    pub format: String,
    #[serde(rename = "start_number")]
    pub _start_number: Option<u32>,
    pub font_size: Option<f32>,
    pub overwrite: bool,
}

/// Options for PDF crop command
#[derive(Debug, Clone, Deserialize)]
pub struct CropCommandOpts {
    pub input_file: String,
    pub output_path: String,
    pub left: f64,
    pub top: f64,
    pub right: f64,
    pub bottom: f64,
    pub unit: String,
    pub overwrite: bool,
}

#[cfg(not(tarpaulin_include))]
#[tauri::command]
pub async fn pdf_rotate(
    app_state: State<'_, AppState>,
    input_file: String,
    output_path: String,
    pages: Option<Vec<u32>>,
    angle: u32,
    overwrite: bool,
) -> Result<String, String> {
    pdf_rotate_impl(&app_state, input_file, output_path, pages, angle, overwrite).await
}

pub async fn pdf_rotate_impl(
    app_state: &AppState,
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

#[cfg(not(tarpaulin_include))]
#[tauri::command]
pub async fn pdf_watermark(
    _app_state: State<'_, AppState>,
    opts: WatermarkCommandOpts,
) -> Result<String, String> {
    pdf_watermark_impl(&_app_state, opts).await
}

pub async fn pdf_watermark_impl(
    app_state: &AppState,
    opts: WatermarkCommandOpts,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    // temp_dir is used implicitly through the AppState's internal temp_dir lifecycle
    let _ = temp_dir;

    let pos = match opts.position.as_str() {
        "diagonal" => WatermarkPosition::Diagonal,
        "custom" => WatermarkPosition::Custom { x: 0.0, y: 0.0 },
        _ => WatermarkPosition::Center,
    };

    let opts2 = WatermarkOpts {
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
        tools::watermark::run(&opts2, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[cfg(not(tarpaulin_include))]
#[tauri::command]
pub async fn pdf_page_numbers(
    _app_state: State<'_, AppState>,
    opts: PageNumCommandOpts,
) -> Result<String, String> {
    pdf_page_numbers_impl(&_app_state, opts).await
}

pub async fn pdf_page_numbers_impl(
    app_state: &AppState,
    opts: PageNumCommandOpts,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
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

    let opts2 = PageNumOpts {
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
        tools::page_numbers::run(&opts2, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[cfg(not(tarpaulin_include))]
#[tauri::command]
pub async fn pdf_crop(
    _app_state: State<'_, AppState>,
    opts: CropCommandOpts,
) -> Result<String, String> {
    pdf_crop_impl(&_app_state, opts).await
}

pub async fn pdf_crop_impl(
    app_state: &AppState,
    opts: CropCommandOpts,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    // temp_dir is used implicitly through the AppState's internal temp_dir lifecycle
    let _ = temp_dir;

    let crop_unit = match opts.unit.as_str() {
        "percentage" => CropUnit::Percentage,
        _ => CropUnit::Points,
    };

    let opts2 = CropOpts {
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
        tools::crop::run(&opts2, &progress_cb)
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
    async fn test_pdf_rotate_impl() {
        let state = AppState::default();
        let pdf = common::get_dummy_pdf();
        let out = PathBuf::from("tests/fixtures/rotate_test_out.pdf");
        
        let result = pdf_rotate_impl(
            &state,
            pdf.to_string_lossy().to_string(),
            out.to_string_lossy().to_string(),
            None,
            90,
            true,
        ).await;
        
        assert!(result.is_ok());

        let result_err = pdf_rotate_impl(
            &state,
            pdf.to_string_lossy().to_string(),
            out.to_string_lossy().to_string(),
            None,
            45,
            true,
        ).await;
        assert!(result_err.is_err());
    }

    #[tokio::test]
    async fn test_pdf_watermark_impl() {
        let state = AppState::default();
        let pdf = common::get_dummy_pdf();
        let out = PathBuf::from("tests/fixtures/watermark_test_out.pdf");
        
        let opts = WatermarkCommandOpts {
            input_file: pdf.to_string_lossy().to_string(),
            output_path: out.to_string_lossy().to_string(),
            text: "Test".to_string(),
            position: "diagonal".to_string(),
            opacity: 0.5,
            _angle: None,
            font_size: Some(12.0),
            color: None,
            overwrite: true,
        };
        
        let result = pdf_watermark_impl(&state, opts).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_pdf_page_numbers_impl() {
        let state = AppState::default();
        let pdf = common::get_dummy_pdf();
        let out = PathBuf::from("tests/fixtures/numbers_test_out.pdf");
        
        let opts = PageNumCommandOpts {
            input_file: pdf.to_string_lossy().to_string(),
            output_path: out.to_string_lossy().to_string(),
            position: "top_left".to_string(),
            format: "1 of 2".to_string(),
            _start_number: None,
            font_size: Some(12.0),
            overwrite: true,
        };
        
        let result = pdf_page_numbers_impl(&state, opts).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_pdf_crop_impl() {
        let state = AppState::default();
        let pdf = common::get_dummy_pdf();
        let out = PathBuf::from("tests/fixtures/crop_test_out.pdf");
        
        let opts = CropCommandOpts {
            input_file: pdf.to_string_lossy().to_string(),
            output_path: out.to_string_lossy().to_string(),
            left: 10.0,
            top: 10.0,
            right: 10.0,
            bottom: 10.0,
            unit: "percentage".to_string(),
            overwrite: true,
        };
        
        let result = pdf_crop_impl(&state, opts).await;
        assert!(result.is_ok());
    }
}