//! Tauri commands for organize category tools

use localpdf_core::tools;
use localpdf_core::types::{
    MergeOpts, SplitOpts, SplitStrategy, PageRange, RemoveOpts, ExtractOpts,
    OrganizeOpts, CompressOpts, CompressionLevel, Progress, JobOutput,
};
use std::sync::mpsc::channel;
use std::path::PathBuf;
use tauri::State;
use crate::state::AppState;

#[cfg(not(tarpaulin_include))]
#[tauri::command]
pub async fn pdf_merge(
    app_state: State<'_, AppState>,
    input_files: Vec<String>,
    output_path: String,
    overwrite: bool,
) -> Result<String, String> {
    pdf_merge_impl(&app_state, input_files, output_path, overwrite).await
}

pub async fn pdf_merge_impl(
    app_state: &AppState,
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

    let (tx, _rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result: std::result::Result<std::result::Result<JobOutput, localpdf_core::LpError>, tokio::task::JoinError> = tokio::task::spawn_blocking(move || {
        tools::merge::run(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[cfg(not(tarpaulin_include))]
#[tauri::command]
pub async fn pdf_split(
    app_state: State<'_, AppState>,
    input_file: String,
    output_dir: String,
    mode: String,
    ranges: Option<String>,
    n_pages: Option<u32>,
    overwrite: bool,
) -> Result<Vec<String>, String> {
    pdf_split_impl(&app_state, input_file, output_dir, mode, ranges, n_pages, overwrite).await
}

pub async fn pdf_split_impl(
    app_state: &AppState,
    input_file: String,
    output_dir: String,
    mode: String,
    ranges: Option<String>,
    n_pages: Option<u32>,
    overwrite: bool,
) -> Result<Vec<String>, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    let _ = temp_dir;

    let parsed_ranges: Option<Vec<PageRange>> = ranges.as_ref().and_then(|r| parse_page_ranges(r));
    let strategy = match mode.as_str() {
        "by_ranges" => SplitStrategy::ByRanges,
        "by_every" => SplitStrategy::ByEvery(n_pages.unwrap_or(1)),
        "by_size" => SplitStrategy::BySize(10 * 1024 * 1024), // 10MB default
        _ => SplitStrategy::ByEvery(1),
    };

    let opts = SplitOpts {
        input_file: PathBuf::from(input_file),
        output_dir: PathBuf::from(output_dir),
        strategy,
        ranges: parsed_ranges,
        overwrite,
    };

    let (tx, _rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result: std::result::Result<std::result::Result<Vec<JobOutput>, localpdf_core::LpError>, tokio::task::JoinError> = tokio::task::spawn_blocking(move || {
        tools::split::run(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(outputs)) => Ok(outputs.iter().map(|o| o.output_path.to_string_lossy().to_string()).collect()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[cfg(not(tarpaulin_include))]
#[tauri::command]
pub async fn pdf_remove_pages(
    app_state: State<'_, AppState>,
    input_file: String,
    output_path: String,
    page_ranges: String,
    overwrite: bool,
) -> Result<String, String> {
    pdf_remove_pages_impl(&app_state, input_file, output_path, page_ranges, overwrite).await
}

pub async fn pdf_remove_pages_impl(
    app_state: &AppState,
    input_file: String,
    output_path: String,
    page_ranges: String,
    overwrite: bool,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    let _ = temp_dir;

    let pages = parse_page_numbers(&page_ranges);
    let opts = RemoveOpts {
        input_file: PathBuf::from(input_file),
        output_path: PathBuf::from(output_path),
        pages_to_remove: pages,
        overwrite,
    };

    let (tx, _rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result: std::result::Result<std::result::Result<JobOutput, localpdf_core::LpError>, tokio::task::JoinError> = tokio::task::spawn_blocking(move || {
        tools::remove_pages::run(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[cfg(not(tarpaulin_include))]
#[tauri::command]
pub async fn pdf_extract_pages(
    app_state: State<'_, AppState>,
    input_file: String,
    output_path: String,
    page_ranges: String,
    overwrite: bool,
) -> Result<String, String> {
    pdf_extract_pages_impl(&app_state, input_file, output_path, page_ranges, overwrite).await
}

pub async fn pdf_extract_pages_impl(
    app_state: &AppState,
    input_file: String,
    output_path: String,
    page_ranges: String,
    overwrite: bool,
) -> Result<String, String> {
    let temp_dir = app_state.create_temp_dir().map_err(|e| e.to_string())?;
    let _ = temp_dir;

    let pages = parse_page_numbers(&page_ranges);
    let opts = ExtractOpts {
        input_file: PathBuf::from(input_file),
        output_path: PathBuf::from(output_path),
        pages_to_extract: pages,
        overwrite,
    };

    let (tx, _rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result: std::result::Result<std::result::Result<JobOutput, localpdf_core::LpError>, tokio::task::JoinError> = tokio::task::spawn_blocking(move || {
        tools::extract_pages::run(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[cfg(not(tarpaulin_include))]
#[tauri::command]
pub async fn pdf_organize(
    app_state: State<'_, AppState>,
    input_file: String,
    output_path: String,
    page_order: Option<Vec<u32>>,
    page_rotations: Option<std::collections::HashMap<u32, u32>>,
    overwrite: bool,
) -> Result<String, String> {
    pdf_organize_impl(&app_state, input_file, output_path, page_order, page_rotations, overwrite).await
}

pub async fn pdf_organize_impl(
    app_state: &AppState,
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

    let (tx, _rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result: std::result::Result<std::result::Result<JobOutput, localpdf_core::LpError>, tokio::task::JoinError> = tokio::task::spawn_blocking(move || {
        tools::organize::run(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

#[cfg(not(tarpaulin_include))]
#[tauri::command]
pub async fn pdf_compress(
    app_state: State<'_, AppState>,
    input_file: String,
    output_path: String,
    level: String,
    overwrite: bool,
) -> Result<String, String> {
    pdf_compress_impl(&app_state, input_file, output_path, level, overwrite).await
}

pub async fn pdf_compress_impl(
    app_state: &AppState,
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

    let (tx, _rx) = channel::<Progress>();
    let progress_cb = move |p: Progress| {
        let _ = tx.send(p);
    };

    let result: std::result::Result<std::result::Result<JobOutput, localpdf_core::LpError>, tokio::task::JoinError> = tokio::task::spawn_blocking(move || {
        tools::compress::run(&opts, &progress_cb)
    }).await;

    match result {
        Ok(Ok(output)) => Ok(output.output_path.to_string_lossy().to_string()),
        Ok(Err(e)) => Err(e.to_string()),
        Err(e) => Err(format!("Task failed: {}", e)),
    }
}

/// Parse ranges string into Vec<PageRange> (e.g., "1-3,5,7-9" -> [PageRange{1,3}, PageRange{5,5}, PageRange{7,9}])
pub fn parse_page_ranges(s: &str) -> Option<Vec<PageRange>> {
    let mut ranges = Vec::new();
    for part in s.split(',') {
        let part = part.trim();
        if part.contains('-') {
            let bounds: Vec<&str> = part.split('-').collect();
            if bounds.len() == 2 {
                if let (Ok(start), Ok(end)) = (bounds[0].trim().parse(), bounds[1].trim().parse()) {
                    ranges.push(PageRange { start, end });
                }
            }
        } else if let Ok(n) = part.parse() {
            ranges.push(PageRange { start: n, end: n });
        }
    }
    if ranges.is_empty() { None } else { Some(ranges) }
}

/// Parse ranges string into Vec<u32> of individual page numbers (e.g., "1-3,5" -> [1,2,3,5])
pub fn parse_page_numbers(s: &str) -> Vec<u32> {
    let mut pages = Vec::new();
    for part in s.split(',') {
        let part = part.trim();
        if part.contains('-') {
            let bounds: Vec<&str> = part.split('-').collect();
            if bounds.len() == 2 {
                if let (Ok(start), Ok(end)) = (bounds[0].trim().parse::<u32>(), bounds[1].trim().parse::<u32>()) {
                    pages.extend(start..=end);
                }
            }
        } else if let Ok(n) = part.parse() {
            pages.push(n);
        }
    }
    pages
}

#[cfg(test)]
mod tests {
    use super::*;

    #[path = "../../../../../localpdf-core/tests/common/mod.rs"]
    mod common;

    #[tokio::test]
    async fn test_pdf_merge_impl() {
        let state = AppState::default();
        let pdf1 = common::get_dummy_pdf();
        let pdf2 = common::get_dummy_pdf();
        let out = PathBuf::from("tests/fixtures/app_merged_out.pdf");
        
        let result = pdf_merge_impl(
            &state,
            vec![pdf1.to_string_lossy().to_string(), pdf2.to_string_lossy().to_string()],
            out.to_string_lossy().to_string(),
            true,
        ).await;
        
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_pdf_split_impl() {
        let state = AppState::default();
        let pdf = common::get_dummy_pdf();
        let out = PathBuf::from("tests/fixtures/app_split_out_dir");
        std::fs::create_dir_all(&out).unwrap();
        
        let result = pdf_split_impl(
            &state,
            pdf.to_string_lossy().to_string(),
            out.to_string_lossy().to_string(),
            "by_every".to_string(),
            None,
            Some(1),
            true,
        ).await;
        
        assert!(result.is_ok());

        let _ = pdf_split_impl(
            &state,
            pdf.to_string_lossy().to_string(),
            out.to_string_lossy().to_string(),
            "by_ranges".to_string(),
            Some("1".to_string()),
            None,
            true,
        ).await;

        let _ = pdf_split_impl(
            &state,
            pdf.to_string_lossy().to_string(),
            out.to_string_lossy().to_string(),
            "by_size".to_string(),
            None,
            None,
            true,
        ).await;
    }

    #[tokio::test]
    async fn test_pdf_remove_pages_impl() {
        let state = AppState::default();
        let pdf = common::get_dummy_pdf();
        let out = PathBuf::from("tests/fixtures/app_remove_out.pdf");
        
        let result = pdf_remove_pages_impl(
            &state,
            pdf.to_string_lossy().to_string(),
            out.to_string_lossy().to_string(),
            "1".to_string(),
            true,
        ).await;
        
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_pdf_extract_pages_impl() {
        let state = AppState::default();
        let pdf = common::get_dummy_pdf();
        let out = PathBuf::from("tests/fixtures/app_extract_out.pdf");
        
        let result = pdf_extract_pages_impl(
            &state,
            pdf.to_string_lossy().to_string(),
            out.to_string_lossy().to_string(),
            "1".to_string(),
            true,
        ).await;
        
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_pdf_organize_impl() {
        let state = AppState::default();
        let pdf = common::get_dummy_pdf();
        let out = PathBuf::from("tests/fixtures/app_organize_out.pdf");
        
        let result = pdf_organize_impl(
            &state,
            pdf.to_string_lossy().to_string(),
            out.to_string_lossy().to_string(),
            Some(vec![1]),
            None,
            true,
        ).await;
        
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_pdf_compress_impl() {
        let state = AppState::default();
        let pdf = common::get_dummy_pdf();
        let out = PathBuf::from("tests/fixtures/app_compress_out.pdf");
        
        let result = pdf_compress_impl(
            &state,
            pdf.to_string_lossy().to_string(),
            out.to_string_lossy().to_string(),
            "balanced".to_string(),
            true,
        ).await;
        
        assert!(result.is_ok());
    }

    #[test]
    fn test_parse_helpers() {
        let ranges = parse_page_ranges("1-3,5,7-9").unwrap();
        assert_eq!(ranges.len(), 3);
        assert_eq!(ranges[0].start, 1);
        assert_eq!(ranges[0].end, 3);
        
        let nums = parse_page_numbers("1-3,5");
        assert_eq!(nums, vec![1, 2, 3, 5]);
    }
}
