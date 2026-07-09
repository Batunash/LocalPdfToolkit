mod common;

use localpdf_core::utils::info::{get_pdf_info};
use localpdf_core::utils::paths::{validate_input_path, validate_output_path, check_file_size, check_disk_space, TempDir};
use localpdf_core::utils::progress::{ProgressTracker, NoOpProgress, ProgressCallback};
use localpdf_core::types::Progress;
use std::path::PathBuf;
use std::fs;

#[test]
fn test_get_pdf_info() {
    let dummy_pdf = common::get_dummy_pdf();
    let info = get_pdf_info(&dummy_pdf).expect("Failed to get pdf info");
    
    assert_eq!(info.page_count, 1);
    assert!(!info.encrypted);
    assert_eq!(info.pdf_version, "1.5");
    assert_eq!(info.page_sizes.len(), 1);
}

#[test]
fn test_get_pdf_info_invalid() {
    let dummy_pdf = PathBuf::from("nonexistent_for_info.pdf");
    let info = get_pdf_info(&dummy_pdf).expect("Should fallback gracefully");
    assert_eq!(info.page_count, 0);
}

#[test]
fn test_paths_validation() {
    let dummy_pdf = common::get_dummy_pdf();
    let valid_input = validate_input_path(&dummy_pdf);
    assert!(valid_input.is_ok());

    let invalid_input = validate_input_path(&PathBuf::from("does_not_exist.pdf"));
    assert!(invalid_input.is_err());

    let out_path = dummy_pdf.with_extension("out.pdf");
    let valid_output = validate_output_path(&out_path, true);
    assert!(valid_output.is_ok());
    
    // Create a file to test overwrite logic
    fs::write(&out_path, "test").unwrap();
    let no_overwrite = validate_output_path(&out_path, false);
    assert!(no_overwrite.is_err());

    fs::remove_file(out_path).unwrap();
}

#[test]
fn test_paths_size_and_disk() {
    let dummy_pdf = common::get_dummy_pdf();
    let size = check_file_size(&dummy_pdf, 1024 * 1024 * 100);
    assert!(size.is_ok());

    let size_exceeded = check_file_size(&dummy_pdf, 1);
    assert!(size_exceeded.is_err());

    let disk = check_disk_space(&dummy_pdf, 1024);
    assert!(disk.is_ok());
    
    let disk_exceeded = check_disk_space(&dummy_pdf, u64::MAX);
    assert!(disk_exceeded.is_err());
}

#[test]
fn test_temp_dir() {
    let temp = TempDir::new("prefix").unwrap();
    let path = temp.path().to_path_buf();
    assert!(path.exists());
    drop(temp);
    assert!(!path.exists());
}

struct TestCallback;
impl ProgressCallback for TestCallback {
    fn on_progress(&self, _progress: Progress) {}
}

#[test]
fn test_progress() {
    let tracker = ProgressTracker::default();
    tracker.add_callback(NoOpProgress);
    tracker.add_callback(TestCallback);
    
    tracker.update(50.0, "stage", "message");
    
    assert_eq!(tracker.current_percent(), 50.0);
    assert_eq!(tracker.current_stage(), "stage");
    assert_eq!(tracker.current_message(), "message");
}
