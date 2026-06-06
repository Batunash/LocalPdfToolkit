//! Stub: OCR

use crate::error::LpError;
use crate::types::{OcrOpts, JobOutput, Progress};

pub fn run(_opts: &OcrOpts, _progress: &dyn Fn(Progress)) -> Result<JobOutput, LpError> {
    Err(LpError::InvalidParams("Not yet implemented".to_string()))
}