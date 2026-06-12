//! Utility functions for PDF info and metadata

use crate::engine::lopdf::LoPdfHelper;
use crate::error::LpError;
use crate::types::{PdfInfo, PageSize};
use std::path::PathBuf;

/// Get PDF metadata/info
pub fn get_pdf_info(input_file: &PathBuf) -> Result<PdfInfo, LpError> {
    let file_size = std::fs::metadata(input_file)
        .map(|m| m.len())
        .unwrap_or(0);

    // Try to load the document to get actual metadata
    let info = match LoPdfHelper::load(input_file) {
        Ok(doc) => {
            let count = LoPdfHelper::get_page_objs(&doc).len() as u32;

            // Try to get PDF version from document
            let pdf_version = LoPdfHelper::get_version(&doc);

            // Get page sizes from first page if available
            let page_sizes = if count > 0 {
                let page_map = doc.get_pages();
                let page_vec: Vec<_> = page_map.into_iter().collect();

                if let Some((_, first_page_obj)) = page_vec.first() {
                    // Try to get page dimensions from the page object
                    if let Ok(page_obj_ref) = doc.get_object(*first_page_obj) {
                        if let Ok(dict) = page_obj_ref.as_dict() {
                            if let Ok(media_box) = dict.get(b"MediaBox") {
                                if let Ok(arr) = media_box.as_array() {
                                    if arr.len() >= 4 {
                                        let width = arr.get(2)
                                            .and_then(|v| v.as_i64().ok())
                                            .unwrap_or(595) as f32;
                                        let height = arr.get(3)
                                            .and_then(|v| v.as_i64().ok())
                                            .unwrap_or(842) as f32;
                                        vec![PageSize {
                                            width,
                                            height,
                                            unit: "points".to_string(),
                                        }]
                                    } else {
                                        vec![PageSize::default()]
                                    }
                                } else {
                                    vec![PageSize::default()]
                                }
                            } else {
                                vec![PageSize::default()]
                            }
                        } else {
                            vec![PageSize::default()]
                        }
                    } else {
                        vec![PageSize::default()]
                    }
                } else {
                    vec![PageSize::default()]
                }
            } else {
                vec![PageSize::default()]
            };

            PdfInfo {
                file_path: input_file.clone(),
                file_size,
                file_size_formatted: format_bytes(file_size),
                page_count: count,
                page_sizes,
                encrypted: doc.is_encrypted(),
                pdf_version,
                // Note: lopdf 0.34 دارد محدودیت‌هایی در metadata extraction
                // A full implementation requires direct trailer dictionary parsing
                creator: None,
                producer: None,
                creation_date: None,
                modification_date: None,
            }
        }
        Err(_) => {
            // If we can't open the document, return basic info
            PdfInfo {
                file_path: input_file.clone(),
                file_size,
                file_size_formatted: format_bytes(file_size),
                page_count: 0,
                page_sizes: vec![PageSize::default()],
                encrypted: false,
                pdf_version: "unknown".to_string(),
                creator: None,
                producer: None,
                creation_date: None,
                modification_date: None,
            }
        }
    };

    Ok(info)
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