//! Stub: Unlock

use crate::error::LpError;
use crate::types::{UnlockOpts, JobOutput, Progress};

pub fn run(_opts: &UnlockOpts, _progress: &dyn Fn(Progress)) -> Result<JobOutput, LpError> {
    Err(LpError::InvalidParams("Not yet implemented".to_string()))
}