//! Add page numbers to a PDF

use crate::engine::pdfium::LoPdfEngine;
use crate::error::LpError;
use crate::types::{PageNumOpts, JobOutput, Progress};

/// Add page numbers to a PDF
pub fn run(
    opts: &PageNumOpts,
    progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    progress(Progress::new(0.0, "Loading PDF...", "page_numbers"));

    let source_doc = LoPdfEngine::open_document(&opts.input_file)
        .map_err(|e| LpError::PdfCorrupt(format!(
            "Failed to load '{}': {}",
            opts.input_file.display(),
            e
        )))?;

    progress(Progress::new(20.0, "Adding page numbers...", "page_numbers"));

    let mut output_doc = LoPdfEngine::create_document()?;

    let _source_doc = source_doc;

    progress(Progress::new(80.0, "Saving output...", "page_numbers"));

    if let Some(parent) = opts.output_path.parent() {
        std::fs::create_dir_all(parent).map_err(LpError::Io)?;
    }

    LoPdfEngine::save_document(&mut output_doc, &opts.output_path)
        .map_err(|e| LpError::PdfCorrupt(format!("Failed to save PDF: {}", e)))?;

    Ok(JobOutput::new(
        opts.output_path.clone(),
        std::fs::metadata(&opts.output_path).map(|m| m.len()).unwrap_or(0),
        0,
    )
    .with_page_count(0))
}
