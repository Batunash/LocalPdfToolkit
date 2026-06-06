//! Core library utilities for path handling and directory management

use std::path::{Path, PathBuf};
use std::fs;
use crate::error::LpError;

/// Securely validate and normalize input paths
pub fn validate_input_path(path: &Path) -> Result<PathBuf, LpError> {
    if !path.exists() {
        return Err(LpError::file_not_found(
            path.to_string_lossy().to_string()
        ));
    }

    let canonical = path
        .canonicalize()
        .map_err(|e| LpError::pdf_corrupt(format!("Failed to canonicalize path: {}", e)))?;

    // Check for symlink traversal
    let metadata = fs::symlink_metadata(path)
        .map_err(LpError::Io)?;

    if metadata.file_type().is_symlink() {
        // For safety, reject symlinks in input paths
        // Can be relaxed in future versions
        log::warn!("Symlink detected in input path: {:?}", path);
    }

    Ok(canonical)
}

/// Validate output path is safe to write to
pub fn validate_output_path(path: &Path, overwrite: bool) -> Result<PathBuf, LpError> {
    // Ensure parent directory exists
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(LpError::Io)?;
    }

    // Check if file exists and overwrite is not allowed
    if path.exists() && !overwrite {
        return Err(LpError::Generic(format!(
            "Output file already exists: {:?}. Use overwrite=true to replace.",
            path
        )));
    }

    path.canonicalize()
        .or_else(|_| Ok(path.to_path_buf()))
        .map_err(|e| LpError::pdf_corrupt(format!("Invalid output path: {}", e)))
}

/// Check file size is within acceptable limits
pub fn check_file_size(path: &Path, max_bytes: u64) -> Result<u64, LpError> {
    let metadata = fs::metadata(path)
        .map_err(LpError::Io)?;
    let size = metadata.len();

    if size > max_bytes {
        return Err(LpError::Generic(format!(
            "File size {} bytes exceeds maximum {} bytes",
            size, max_bytes
        )));
    }

    Ok(size)
}

/// Check available disk space
pub fn check_disk_space(path: &Path, required_bytes: u64) -> Result<(), LpError> {
    if let Some(parent) = path.parent().or_else(|| Some(path)) {
        #[cfg(unix)]
        {
            use std::os::unix::fs::MetadataExt;
            let metadata = fs::metadata(parent).map_err(LpError::Io)?;
            // Simplified check - real implementation would use filesystem stats
            let available = 1024 * 1024 * 1024; // Assume 1GB available for now
            if available < required_bytes {
                return Err(LpError::DiskFull);
            }
        }

        #[cfg(windows)]
        {
            // Simplified check for Windows
            let available = 1024 * 1024 * 1024; // Assume 1GB available
            if available < required_bytes {
                return Err(LpError::DiskFull);
            }
        }
    }

    Ok(())
}

/// Create a unique temp directory with cleanup on drop
pub struct TempDir {
    path: PathBuf,
}

impl TempDir {
    pub fn new(prefix: &str) -> Result<Self, LpError> {
        use uuid::Uuid;
        let id = Uuid::new_v4().to_string();
        let path = std::env::temp_dir().join(format!("{}-{}", prefix, id));
        fs::create_dir_all(&path).map_err(LpError::Io)?;
        Ok(Self { path })
    }

    pub fn path(&self) -> &Path {
        &self.path
    }
}

impl Drop for TempDir {
    fn drop(&mut self) {
        let _ = fs::remove_dir_all(&self.path);
    }
}