//! Convert PDF to images (JPG, PNG)

use crate::error::LpError;
use crate::types::{JobOutput, Progress};
use std::path::PathBuf;

/// Options for PDF to image conversion
#[derive(Debug, Clone)]
pub struct PdfToImageOpts {
    pub input_file: PathBuf,
    pub output_dir: PathBuf,
    pub dpi: u32,
    pub format: String, // "jpg" or "png"
    pub overwrite: bool,
}

/// Convert PDF pages to images
pub fn pdf_to_images(
    opts: &PdfToImageOpts,
    _progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    // Stub implementation
    Err(LpError::InvalidParams("PDF to image conversion not yet implemented".to_string()))
}