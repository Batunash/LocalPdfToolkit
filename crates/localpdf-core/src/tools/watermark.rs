//! Stub: Watermark

use crate::error::LpError;
use crate::types::{WatermarkOpts, JobOutput, Progress};

pub fn run(_opts: &WatermarkOpts, _progress: &dyn Fn(Progress)) -> Result<JobOutput, LpError> {
    Err(LpError::InvalidParams("Not yet implemented".to_string()))
}