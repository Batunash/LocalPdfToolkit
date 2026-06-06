//! Stub: Convert

use crate::error::LpError;
use crate::types::{ConvertOpts, JobOutput, Progress};

pub fn run(_opts: &ConvertOpts, _progress: &dyn Fn(Progress)) -> Result<JobOutput, LpError> {
    Err(LpError::InvalidParams("Not yet implemented".to_string()))
}