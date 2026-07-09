mod common;

use localpdf_core::tools::merge;
use localpdf_core::types::MergeOpts;
use std::fs;
use std::path::PathBuf;

#[test]
fn test_merge_basic() {
    let dummy_pdf1 = common::get_dummy_pdf();
    let dummy_pdf2 = dummy_pdf1.with_extension("copy.pdf");
    fs::copy(&dummy_pdf1, &dummy_pdf2).unwrap();

    let output_path = dummy_pdf1.with_extension("merged.pdf");

    let opts = MergeOpts {
        input_files: vec![dummy_pdf1.clone(), dummy_pdf2.clone()],
        output_path: output_path.clone(),
        overwrite: true,
    };

    let result = merge::run(&opts, &|_| ());
    assert!(result.is_ok(), "Merge failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());
    assert_eq!(output.page_count, Some(2));

    let _ = fs::remove_file(output.output_path);
    let _ = fs::remove_file(dummy_pdf2);
}

#[test]
fn test_merge_missing_file_fails() {
    let dummy_pdf1 = common::get_dummy_pdf();
    let opts = MergeOpts {
        input_files: vec![dummy_pdf1, PathBuf::from("nonexistent_pdf_file.pdf")],
        output_path: PathBuf::from("output.pdf"),
        overwrite: false,
    };
    let result = merge::run(&opts, &|_| ());
    assert!(result.is_err());
}
