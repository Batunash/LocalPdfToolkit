//! Stub: Crop

use crate::error::LpError;
use crate::types::{CropOpts, JobOutput, Progress};

pub fn run(_opts: &CropOpts, _progress: &dyn Fn(Progress)) -> Result<JobOutput, LpError> {
    Err(LpError::InvalidParams("Not yet implemented".to_string()))
}