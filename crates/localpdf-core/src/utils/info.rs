//! Utility functions for PDF info and metadata

use crate::error::LpError;
use crate::types::{PdfInfo, PageSize};
use std::path::PathBuf;

/// Get PDF metadata/info
pub fn get_pdf_info(input_file: &PathBuf) -> Result<PdfInfo, LpError> {
    // Stub implementation - actual implementation would use pdfium to read metadata
    let file_size = std::fs::metadata(input_file)
        .map(|m| m.len())
        .unwrap_or(0);

    Ok(PdfInfo {
        file_path: input_file.clone(),
        file_size,
        file_size_formatted: format_bytes(file_size),
        page_count: 1, // Stub
        page_sizes: vec![PageSize {
            width: 595.0,  // A4 width in points
            height: 842.0, // A4 height in points
            unit: "points".to_string(),
        }],
        encrypted: false,
        pdf_version: "1.7".to_string(),
        creator: None,
        producer: None,
        creation_date: None,
        modification_date: None,
    })
}

fn format_bytes(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;

    match bytes {
        b if b >= MB => format!("{:.2} MB", b as f64 / MB as f64),
        b if b >= KB => format!("{:.2} KB", b as f64 / KB as f64),
        b => format!("{} B", b),
    }
}