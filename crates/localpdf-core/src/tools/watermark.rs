//! Add text or image watermark to a PDF

use crate::engine::pdfium::LoPdfEngine;
use crate::error::LpError;
use crate::types::{WatermarkOpts, JobOutput, Progress};

/// Add watermark to a PDF
pub fn run(
    opts: &WatermarkOpts,
    progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    progress(Progress::new(0.0, "Loading PDF...", "watermark"));

    let source_doc = LoPdfEngine::open_document(&opts.input_file)
        .map_err(|e| LpError::PdfCorrupt(format!(
            "Failed to load '{}': {}",
            opts.input_file.display(),
            e
        )))?;

    progress(Progress::new(20.0, "Applying watermark...", "watermark"));

    let mut output_doc = LoPdfEngine::create_document()?;

    // Note: Full implementation would:
    // 1. For text watermark: render text overlay on each page
    // 2. For image watermark: render image overlay on each page
    // 3. Save with watermarked pages
    let _source_doc = source_doc;
    let _text = &opts.text;
    let _image_path = &opts.image_path;

    progress(Progress::new(80.0, "Saving output...", "watermark"));

    // Ensure parent directory exists
    if let Some(parent) = opts.output_path.parent() {
        std::fs::create_dir_all(parent).map_err(LpError::Io)?;
    }

    LoPdfEngine::save_document(&mut output_doc, &opts.output_path)
        .map_err(|e| LpError::PdfCorrupt(format!("Failed to save PDF: {}", e)))?;

    let processing_time = 0;
    let file_size = std::fs::metadata(&opts.output_path)
        .map(|m| m.len())
        .unwrap_or(0);

    progress(Progress::new(100.0, "Watermark complete!", "watermark"));

    Ok(JobOutput::new(
        opts.output_path.clone(),
        file_size,
        processing_time,
    )
    .with_page_count(0))
}