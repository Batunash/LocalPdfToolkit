//! Merge multiple PDFs into one

use crate::engine::pdfium::get_pdfium;
use crate::error::LpError;
use crate::types::{MergeOpts, JobOutput, Progress};
use std::path::PathBuf;
use std::time::Instant;

/// Merge multiple PDF files into a single PDF
pub fn run(
    opts: &MergeOpts,
    progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    let start = Instant::now();
    let pdfium = get_pdfium();

    if opts.input_files.is_empty() {
        return Err(LpError::InvalidParams("At least one input file required".to_string()));
    }

    progress(Progress::new(0.0, "Initializing merge...", "merge"));

    // Create new document
    let mut merged_doc = pdfium.create_new_pdf()
        .expect("Failed to create PDF document");

    for (idx, input_path) in opts.input_files.iter().enumerate() {
        let progress_pct = (idx as f32 / opts.input_files.len() as f32) * 100.0;
        progress(Progress::new(
            progress_pct,
            &format!("Processing {} of {}: {:?}", idx + 1, opts.input_files.len(), input_path.display()),
            "merge",
        ));

        // Open source document
        let source_doc = pdfium.load_pdf_from_file(input_path, None)
            .map_err(|e| LpError::PdfCorrupt(format!(
                "Failed to load '{}': {}",
                input_path.display(),
                e
            )))?;

        // Copy all pages from source to merged
        let source_pages = source_doc.pages();
        for page in source_pages.iter() {
            merged_doc.pages().add().set_contents(page.contents());
        }
    }

    progress(Progress::new(95.0, "Saving merged PDF...", "merge"));

    // Ensure parent directory exists
    if let Some(parent) = opts.output_path.parent() {
        std::fs::create_dir_all(parent).map_err(LpError::Io)?;
    }

    // Save merged document
    merged_doc
        .save_to_file(&opts.output_path)
        .map_err(|e| LpError::PdfCorrupt(format!("Failed to save merged PDF: {}", e)))?;

    let processing_time = start.elapsed().as_millis() as u64;
    let file_size = std::fs::metadata(&opts.output_path)
        .map(|m| m.len())
        .unwrap_or(0);

    progress(Progress::new(100.0, "Merge complete!", "merge"));

    Ok(JobOutput::new(
        opts.output_path.clone(),
        file_size,
        processing_time,
    )
    .with_page_count(merged_doc.pages().count() as u32))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_empty_input_fails() {
        let opts = MergeOpts {
            input_files: vec![],
            output_path: PathBuf::from("output.pdf"),
            overwrite: false,
        };
        let result = run(&opts, &|_| ());
        assert!(result.is_err());
    }
}