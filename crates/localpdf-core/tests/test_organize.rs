mod common;

use localpdf_core::tools::organize;
use localpdf_core::types::OrganizeOpts;
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;

#[test]
fn test_organize_basic() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_path = dummy_pdf.with_extension("organized.pdf");

    let mut rotations = HashMap::new();
    rotations.insert(1, 90);

    let opts = OrganizeOpts {
        input_file: dummy_pdf,
        output_path: output_path.clone(),
        page_order: Some(vec![1]),
        page_rotations: Some(rotations),
        overwrite: true,
    };

    let result = organize::run(&opts, &|_| ());
    assert!(result.is_ok(), "Organize failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());
    assert_eq!(output.page_count, Some(1));

    let _ = fs::remove_file(output.output_path);
}

#[test]
fn test_organize_no_order() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_path = dummy_pdf.with_extension("organized_no_order.pdf");

    let opts = OrganizeOpts {
        input_file: dummy_pdf,
        output_path: output_path.clone(),
        page_order: None,
        page_rotations: None,
        overwrite: true,
    };

    let result = organize::run(&opts, &|_| ());
    assert!(result.is_ok());

    let output = result.unwrap();
    assert!(output.output_path.exists());

    let _ = fs::remove_file(output.output_path);
}

#[test]
fn test_organize_missing_file_fails() {
    let opts = OrganizeOpts {
        input_file: PathBuf::from("nonexistent.pdf"),
        output_path: PathBuf::from("output.pdf"),
        page_order: None,
        page_rotations: None,
        overwrite: false,
    };
    let result = organize::run(&opts, &|_| ());
    assert!(result.is_err());
}
