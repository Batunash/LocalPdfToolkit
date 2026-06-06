//! Remove specific pages from a PDF

use crate::engine::pdfium::get_pdfium;
use crate::error::LpError;
use crate::types::{RemoveOpts, JobOutput, Progress};
use std::time::Instant;

/// Remove specified pages from a PDF
pub fn run(
    opts: &RemoveOpts,
    progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    let start = Instant::now();
    let pdfium = get_pdfium();

    progress(Progress::new(0.0, "Loading PDF...", "remove_pages"));

    let source_doc = pdfium.load_pdf_from_file(&opts.input_file, None)
        .map_err(|e| LpError::PdfCorrupt(format!(
            "Failed to load '{}': {}",
            opts.input_file.display(),
            e
        )))?;

    let page_count = source_doc.pages().count();
    let pages_to_remove: std::collections::HashSet<usize> = opts.pages_to_remove
        .iter()
        .filter_map(|&p| if p >= 1 { Some((p - 1) as usize) } else { None })
        .collect();

    progress(Progress::new(20.0, &format!("Removing {} pages from {}", pages_to_remove.len(), page_count), "remove_pages"));

    let mut new_doc = pdfium.create_pdf(None, None, None)
        .expect("Failed to create PDF document");

    let source_pages = source_doc.pages();

    for (idx, page) in source_pages.iter().enumerate() {
        if !pages_to_remove.contains(&idx) {
            new_doc.pages().add().set_contents(page.contents());
        }
    }

    progress(Progress::new(80.0, "Saving output...", "remove_pages"));

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

    progress(Progress::new(100.0, "Pages removed!", "remove_pages"));

    Ok(JobOutput::new(
        opts.output_path.clone(),
        file_size,
        processing_time,
    )
    .with_page_count(new_doc.pages().count() as u32))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_invalid_file_fails() {
        let opts = RemoveOpts {
            input_file: PathBuf::from("nonexistent.pdf"),
            output_path: PathBuf::from("output.pdf"),
            pages_to_remove: vec![1],
            overwrite: false,
        };
        let result = run(&opts, &|_| ());
        assert!(result.is_err());
    }
}