//! Stub: Protect

use crate::error::LpError;
use crate::types::{ProtectOpts, JobOutput, Progress};

pub fn run(_opts: &ProtectOpts, _progress: &dyn Fn(Progress)) -> Result<JobOutput, LpError> {
    Err(LpError::InvalidParams("Not yet implemented".to_string()))
}