//! Stub: Repair

use crate::error::LpError;
use crate::types::{RepairOpts, JobOutput, Progress};

pub fn run(_opts: &RepairOpts, _progress: &dyn Fn(Progress)) -> Result<JobOutput, LpError> {
    Err(LpError::InvalidParams("Not yet implemented".to_string()))
}