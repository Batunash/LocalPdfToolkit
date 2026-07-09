mod common;

use localpdf_core::tools::crop;
use localpdf_core::types::{CropOpts, CropMargins, CropUnit};
use std::fs;
use std::path::PathBuf;

#[test]
fn test_crop_points() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_path = dummy_pdf.with_extension("cropped_pts.pdf");

    let opts = CropOpts {
        input_file: dummy_pdf,
        output_path: output_path.clone(),
        margins: CropMargins { top: 10.0, bottom: 10.0, left: 10.0, right: 10.0 },
        unit: CropUnit::Points,
        overwrite: true,
    };

    let result = crop::run(&opts, &|_| ());
    assert!(result.is_ok(), "Crop points failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());
    assert_eq!(output.page_count, Some(1));

    let _ = fs::remove_file(output.output_path);
}

#[test]
fn test_crop_percentage() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_path = dummy_pdf.with_extension("cropped_pct.pdf");

    let opts = CropOpts {
        input_file: dummy_pdf,
        output_path: output_path.clone(),
        margins: CropMargins { top: 10.0, bottom: 10.0, left: 10.0, right: 10.0 },
        unit: CropUnit::Percentage,
        overwrite: true,
    };

    let result = crop::run(&opts, &|_| ());
    assert!(result.is_ok(), "Crop percentage failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());

    let _ = fs::remove_file(output.output_path);
}

#[test]
fn test_crop_missing_file_fails() {
    let opts = CropOpts {
        input_file: PathBuf::from("nonexistent.pdf"),
        output_path: PathBuf::from("output.pdf"),
        margins: CropMargins { top: 10.0, bottom: 10.0, left: 10.0, right: 10.0 },
        unit: CropUnit::Points,
        overwrite: false,
    };
    let result = crop::run(&opts, &|_| ());
    assert!(result.is_err());
}
