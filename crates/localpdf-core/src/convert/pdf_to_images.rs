//! Convert PDF to images (JPG, PNG)

use crate::engine::pdfium::LoPdfEngine;
use crate::error::LpError;
use crate::types::{JobOutput, Progress};
use std::path::PathBuf;

/// Options for PDF to image conversion
#[derive(Debug, Clone)]
pub struct PdfToImageOpts {
    pub input_file: PathBuf,
    pub output_dir: PathBuf,
    pub dpi: u32,
    pub format: String,
    pub overwrite: bool,
}

/// Convert PDF pages to images
pub fn pdf_to_images(
    opts: &PdfToImageOpts,
    _progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    // Note: Full implementation requires PDFium for rendering
    let _ = LoPdfEngine::open_document(&opts.input_file)?;

    Ok(JobOutput::new(
        opts.output_dir.clone(),
        0,
        0,
    ))
}