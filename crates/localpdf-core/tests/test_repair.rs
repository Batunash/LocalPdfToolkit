mod common;

use localpdf_core::tools::repair;
use localpdf_core::types::RepairOpts;
use std::fs;
use std::path::PathBuf;

#[test]
fn test_repair_basic() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_path = dummy_pdf.with_extension("repaired.pdf");

    let opts = RepairOpts {
        input_file: dummy_pdf,
        output_path: output_path.clone(),
        overwrite: true,
    };

    let result = repair::run(&opts, &|_| ());
    assert!(result.is_ok(), "Repair failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());
    assert_eq!(output.page_count, Some(1));

    let _ = fs::remove_file(output.output_path);
}

#[test]
fn test_repair_missing_file_fails() {
    let opts = RepairOpts {
        input_file: PathBuf::from("nonexistent.pdf"),
        output_path: PathBuf::from("output.pdf"),
        overwrite: false,
    };
    let result = repair::run(&opts, &|_| ());
    assert!(result.is_err());
}
