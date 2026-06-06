//! Convert images to PDF

use crate::error::LpError;
use crate::types::{JobOutput, Progress};
use std::path::PathBuf;

/// Options for image to PDF conversion
#[derive(Debug, Clone)]
pub struct ImageToPdfOpts {
    pub input_files: Vec<PathBuf>,
    pub output_path: PathBuf,
    pub page_size: String, // "auto", "A4", "Letter"
    pub margin: f64,
    pub overwrite: bool,
}

/// Convert images to a single PDF
pub fn images_to_pdf(
    opts: &ImageToPdfOpts,
    _progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    // Stub implementation
    Err(LpError::InvalidParams("Images to PDF conversion not yet implemented".to_string()))
}