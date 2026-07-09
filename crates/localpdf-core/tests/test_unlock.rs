mod common;

use localpdf_core::tools::unlock;
use localpdf_core::types::UnlockOpts;
use std::fs;
use std::path::PathBuf;

#[test]
fn test_unlock_basic() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_path = dummy_pdf.with_extension("unlocked.pdf");

    let opts = UnlockOpts {
        input_file: dummy_pdf,
        output_path: output_path.clone(),
        password: "password".to_string(),
        overwrite: true,
    };

    let result = unlock::run(&opts, &|_| ());
    assert!(result.is_ok(), "Unlock failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());
    assert_eq!(output.page_count, Some(1));

    let _ = fs::remove_file(output.output_path);
}

#[test]
fn test_unlock_missing_file_fails() {
    let opts = UnlockOpts {
        input_file: PathBuf::from("nonexistent.pdf"),
        output_path: PathBuf::from("output.pdf"),
        password: "password".to_string(),
        overwrite: false,
    };
    let result = unlock::run(&opts, &|_| ());
    assert!(result.is_err());
}
