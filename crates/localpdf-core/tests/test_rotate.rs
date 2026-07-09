mod common;

use localpdf_core::tools::rotate;
use localpdf_core::types::{RotateOpts, RotationAngle};
use std::fs;
use std::path::PathBuf;

#[test]
fn test_rotate_basic_all_pages() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_path = dummy_pdf.with_extension("rotated.pdf");

    let opts = RotateOpts {
        input_file: dummy_pdf,
        output_path: output_path.clone(),
        pages: None,
        rotation: RotationAngle::Deg90,
        overwrite: true,
    };

    let result = rotate::run(&opts, &|_| ());
    assert!(result.is_ok(), "Rotate failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());
    assert_eq!(output.page_count, Some(1));

    let _ = fs::remove_file(output.output_path);
}

#[test]
fn test_rotate_specific_pages() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_path = dummy_pdf.with_extension("rotated_spec.pdf");

    let opts = RotateOpts {
        input_file: dummy_pdf,
        output_path: output_path.clone(),
        pages: Some(vec![1]),
        rotation: RotationAngle::Deg180,
        overwrite: true,
    };

    let result = rotate::run(&opts, &|_| ());
    assert!(result.is_ok(), "Rotate specific failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());
    assert_eq!(output.page_count, Some(1));

    let _ = fs::remove_file(output.output_path);
}

#[test]
fn test_rotate_missing_file_fails() {
    let opts = RotateOpts {
        input_file: PathBuf::from("nonexistent.pdf"),
        output_path: PathBuf::from("output.pdf"),
        pages: None,
        rotation: RotationAngle::Deg270,
        overwrite: false,
    };
    let result = rotate::run(&opts, &|_| ());
    assert!(result.is_err());
}
