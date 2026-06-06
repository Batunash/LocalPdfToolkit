//! Tauri commands for organize category tools

use localpdf_core::tools::{run_merge, run_split, run_remove, run_extract, run_organize, run_compress};
use localpdf_core::types::{MergeOpts, SplitOpts, SplitStrategy, PageRange, RemoveOpts, ExtractOpts, OrganizeOpts, CompressOpts, CompressionLevel, Progress};
use std::sync::mpsc::channel;
use std::path::PathBuf;
use tauri::State;
use crate::state::AppState;

#[tauri::command]
async fn pdf_merge(
    app_state: State<'_, AppState>,
    input_files: Vec<String>,
    output_path: String,
    overwrite: bool,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    let _ = temp_dir; // TempDir is kept alive by AppState
    let opts = MergeOpts {
        input_files: input_files.into_iter().map(PathBuf::from).collect(),
        output_path: PathBuf::from(output_path),
        overwrite,
    };

    let (tx, rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result = tokio::task::spawn_blocking(move || {
        run_merge(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[tauri::command]
async fn pdf_split(
    app_state: State<'_, AppState>,
    input_file: String,
    output_dir: String,
    mode: String,
    ranges: Option<String>,
    n_pages: Option<u32>,
    overwrite: bool,
) -> Result<Vec<String>, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    let _ = temp_dir;

    let strategy = match mode.as_str() {
        "by_ranges" => {
            let parsed_ranges = ranges.and_then(|r| parse_ranges(&r));
            SplitStrategy::ByRanges(parsed_ranges.unwrap_or_default())
        }
        "by_every" => SplitStrategy::ByEvery(n_pages.unwrap_or(1)),
        "by_size" => SplitStrategy::BySize(10 * 1024 * 1024), // 10MB default
        _ => SplitStrategy::ByEvery(1),
    };

    let opts = SplitOpts {
        input_file: PathBuf::from(input_file),
        output_dir: PathBuf::from(output_dir),
        strategy,
        ranges: None,
        overwrite,
    };

    let (tx, rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result = tokio::task::spawn_blocking(move || {
        run_split(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(vec![output.output_path.to_string_lossy().to_string()]),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[tauri::command]
async fn pdf_remove_pages(
    app_state: State<'_, AppState>,
    input_file: String,
    output_path: String,
    page_ranges: String,
    overwrite: bool,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    let _ = temp_dir;

    let pages = parse_ranges(&page_ranges).unwrap_or_default();
    let opts = RemoveOpts {
        input_file: PathBuf::from(input_file),
        output_path: PathBuf::from(output_path),
        pages_to_remove: pages,
        overwrite,
    };

    let (tx, rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result = tokio::task::spawn_blocking(move || {
        run_remove(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[tauri::command]
async fn pdf_extract_pages(
    app_state: State<'_, AppState>,
    input_file: String,
    output_path: String,
    page_ranges: String,
    overwrite: bool,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    let _ = temp_dir;

    let pages = parse_ranges(&page_ranges).unwrap_or_default();
    let opts = ExtractOpts {
        input_file: PathBuf::from(input_file),
        output_path: PathBuf::from(output_path),
        pages_to_extract: pages,
        overwrite,
    };

    let (tx, rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result = tokio::task::spawn_blocking(move || {
        run_extract(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[tauri::command]
async fn pdf_organize(
    app_state: State<'_, AppState>,
    input_file: String,
    output_path: String,
    page_order: Option<Vec<u32>>,
    page_rotations: Option<std::collections::HashMap<u32, u32>>,
    overwrite: bool,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    let _ = temp_dir;

    let opts = OrganizeOpts {
        input_file: PathBuf::from(input_file),
        output_path: PathBuf::from(output_path),
        page_order,
        page_rotations,
        overwrite,
    };

    let (tx, rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result = tokio::task::spawn_blocking(move || {
        run_organize(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[tauri::command]
async fn pdf_compress(
    app_state: State<'_, AppState>,
    input_file: String,
    output_path: String,
    level: String,
    overwrite: bool,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    let _ = temp_dir;

    let compress_level = match level.as_str() {
        "maximum" => CompressionLevel::Maximum,
        "high" => CompressionLevel::High,
        "balanced" => CompressionLevel::Balanced,
        "low" => CompressionLevel::Low,
        _ => CompressionLevel::Balanced,
    };

    let opts = CompressOpts {
        input_file: PathBuf::from(input_file),
        output_path: PathBuf::from(output_path),
        level: compress_level,
        overwrite,
    };

    let (tx, rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result = tokio::task::spawn_blocking(move || {
        run_compress(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

fn parse_ranges(s: &str) -> Option<Vec<u32>> {
    let mut pages = Vec::new();
    for part in s.split(',') {
        let part = part.trim();
        if part.contains('-') {
            let bounds: Vec<&str> = part.split('-').collect();
            if bounds.len() == 2 {
                if let (Ok(start), Ok(end)) = (bounds[0].trim().parse(), bounds[1].trim().parse()) {
                    pages.extend(start..=end);
                }
            }
        } else if let Ok(n) = part.parse() {
            pages.push(n);
        }
    }
    if pages.is_empty() {
        None
    } else {
        Some(pages)
    }
}