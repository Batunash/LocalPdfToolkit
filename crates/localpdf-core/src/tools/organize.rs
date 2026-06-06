//! Reorder and/or rotate pages in a PDF

use crate::engine::pdfium::get_pdfium;
use crate::error::LpError;
use crate::types::{OrganizeOpts, JobOutput, Progress};
use std::collections::HashMap;
use std::time::Instant;

/// Reorder and/or rotate pages in a PDF
pub fn run(
    opts: &OrganizeOpts,
    progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    let start = Instant::now();
    let pdfium = get_pdfium();

    progress(Progress::new(0.0, "Loading PDF...", "organize"));

    let source_doc = pdfium.load_pdf_from_file(&opts.input_file, None)
        .map_err(|e| LpError::PdfCorrupt(format!(
            "Failed to load '{}': {}",
            opts.input_file.display(),
            e
        )))?;

    let page_count = source_doc.pages().count();
    let source_pages = source_doc.pages();

    progress(Progress::new(20.0, &format!("Organizing {} pages", page_count), "organize"));

    let mut new_doc = pdfium.create_pdf(None, None, None)
        .expect("Failed to create PDF document");

    // Build the page order
    let order: Vec<usize> = if let Some(ref page_order) = opts.page_order {
        // Convert 1-indexed to 0-indexed
        page_order
            .iter()
            .filter_map(|&p| if p >= 1 { Some((p - 1) as usize) } else { None })
            .collect()
    } else {
        // Keep original order
        (0..page_count).collect()
    };

    // Apply reordering and/or rotation
    for (new_idx, &old_idx) in order.iter().enumerate() {
        progress(Progress::new(
            20.0 + (new_idx as f32 / order.len() as f32) * 60.0,
            &format!("Processing page {}", new_idx + 1),
            "organize",
        ));

        if old_idx < page_count {
            let page = source_pages.get(old_idx);
            let new_page = new_doc.pages().add().set_contents(page.contents());

            // Apply rotation if specified
            if let Some(ref rotations) = opts.page_rotations {
                if let Some(&rotation) = rotations.get(&(old_idx as u32 + 1)) {
                    set_page_rotation(&new_page, rotation)?;
                }
            }
        }
    }

    progress(Progress::new(90.0, "Saving output...", "organize"));

    // Ensure parent directory exists
    if let Some(parent) = opts.output_path.parent() {
        std::fs::create_dir_all(parent).map_err(LpError::Io)?;
    }

    new_doc.save(&opts.output_path)
        .map_err(|e| LpError::PdfCorrupt(format!("Failed to save PDF: {}", e)))?;

    let processing_time = start.elapsed().as_millis() as u64;
    let file_size = std::fs::metadata(&opts.output_path)
        .map(|m| m.len())
        .unwrap_or(0);

    progress(Progress::new(100.0, "Pages organized!", "organize"));

    Ok(JobOutput::new(
        opts.output_path.clone(),
        file_size,
        processing_time,
    )
    .with_page_count(new_doc.pages().count() as u32))
}

fn set_page_rotation(
    _page: &pdfium_render::prelude::PdfPage,
    rotation: u32,
) -> Result<(), LpError> {
    // Rotation needs to be set via page modifications
    // This is a placeholder - actual implementation depends on pdfium-render API
    // The page.rotation setter should be used here
    match rotation {
        0 | 90 | 180 | 270 => Ok(()),
        _ => Err(LpError::InvalidParams(
            format!("Invalid rotation angle: {}. Must be 0, 90, 180, or 270", rotation)
        )),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_invalid_file_fails() {
        let opts = OrganizeOpts {
            input_file: PathBuf::from("nonexistent.pdf"),
            output_path: PathBuf::from("output.pdf"),
            page_order: None,
            page_rotations: None,
            overwrite: false,
        };
        let result = run(&opts, &|_| ());
        assert!(result.is_err());
    }
}