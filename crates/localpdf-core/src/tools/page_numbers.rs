//! Stub: Page numbers

use crate::error::LpError;
use crate::types::{PageNumOpts, JobOutput, Progress};

pub fn run(_opts: &PageNumOpts, _progress: &dyn Fn(Progress)) -> Result<JobOutput, LpError> {
    Err(LpError::InvalidParams("Not yet implemented".to_string()))
}