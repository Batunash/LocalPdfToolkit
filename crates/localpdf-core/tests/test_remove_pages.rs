mod common;

use localpdf_core::tools::remove_pages;
use localpdf_core::types::RemoveOpts;
use std::fs;
use std::path::PathBuf;

#[test]
fn test_remove_pages_basic() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_path = dummy_pdf.with_extension("removed.pdf");

    let opts = RemoveOpts {
        input_file: dummy_pdf,
        output_path: output_path.clone(),
        pages_to_remove: vec![1],
        overwrite: true,
    };

    let result = remove_pages::run(&opts, &|_| ());
    assert!(result.is_ok(), "Remove pages failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());
    assert_eq!(output.page_count, Some(0)); // Dummy PDF has only 1 page

    let _ = fs::remove_file(output.output_path);
}

#[test]
fn test_remove_pages_missing_file_fails() {
    let opts = RemoveOpts {
        input_file: PathBuf::from("nonexistent.pdf"),
        output_path: PathBuf::from("output.pdf"),
        pages_to_remove: vec![1],
        overwrite: false,
    };
    let result = remove_pages::run(&opts, &|_| ());
    assert!(result.is_err());
}
