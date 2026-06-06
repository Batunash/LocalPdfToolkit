//! Stub: Rotate pages

use crate::error::LpError;
use crate::types::{RotateOpts, JobOutput, Progress};

pub fn run(_opts: &RotateOpts, _progress: &dyn Fn(Progress)) -> Result<JobOutput, LpError> {
    Err(LpError::InvalidParams("Not yet implemented".to_string()))
}