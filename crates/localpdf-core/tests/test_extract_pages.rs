mod common;

use localpdf_core::tools::extract_pages;
use localpdf_core::types::ExtractOpts;
use std::fs;
use std::path::PathBuf;

#[test]
fn test_extract_pages_basic() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_path = dummy_pdf.with_extension("extracted.pdf");

    let opts = ExtractOpts {
        input_file: dummy_pdf,
        output_path: output_path.clone(),
        pages_to_extract: vec![1],
        overwrite: true,
    };

    let result = extract_pages::run(&opts, &|_| ());
    assert!(result.is_ok(), "Extract pages failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());
    assert_eq!(output.page_count, Some(1));

    let _ = fs::remove_file(output.output_path);
}

#[test]
fn test_extract_pages_missing_file_fails() {
    let opts = ExtractOpts {
        input_file: PathBuf::from("nonexistent.pdf"),
        output_path: PathBuf::from("output.pdf"),
        pages_to_extract: vec![1],
        overwrite: false,
    };
    let result = extract_pages::run(&opts, &|_| ());
    assert!(result.is_err());
}
