//! PDF conversion utilities

pub mod pdf_to_images;
pub mod images_to_pdf;

pub use pdf_to_images::*;
pub use images_to_pdf::*;

use crate::error::LpError;
use crate::types::{ConvertOpts, JobOutput, Progress};

/// Run format conversion
pub fn run_convert(
    opts: &ConvertOpts,
    _progress: &dyn Fn(Progress),
) -> Result<JobOutput, LpError> {
    // Stub - will be implemented based on target format
    Err(LpError::InvalidParams("Conversion not yet implemented".to_string()))
}