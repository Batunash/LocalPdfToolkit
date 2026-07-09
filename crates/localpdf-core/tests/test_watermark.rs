mod common;

use localpdf_core::tools::watermark;
use localpdf_core::types::{WatermarkOpts, WatermarkType, WatermarkPosition};
use std::fs;
use std::path::PathBuf;

#[test]
fn test_watermark_text() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_path = dummy_pdf.with_extension("watermarked.pdf");

    let opts = WatermarkOpts {
        input_file: dummy_pdf,
        output_path: output_path.clone(),
        watermark_type: WatermarkType::Text,
        text: Some("WATERMARK".to_string()),
        image_path: None,
        position: WatermarkPosition::Center,
        opacity: 0.5,
        font_size: Some(48.0),
        font_color: Some("#FF0000".to_string()),
        overwrite: true,
    };

    let result = watermark::run(&opts, &|_| ());
    assert!(result.is_ok(), "Watermark failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());
    assert_eq!(output.page_count, Some(1));

    let _ = fs::remove_file(output.output_path);
}

#[test]
fn test_watermark_missing_file_fails() {
    let opts = WatermarkOpts {
        input_file: PathBuf::from("nonexistent.pdf"),
        output_path: PathBuf::from("output.pdf"),
        watermark_type: WatermarkType::Text,
        text: Some("WATERMARK".to_string()),
        image_path: None,
        position: WatermarkPosition::Center,
        opacity: 0.5,
        font_size: Some(48.0),
        font_color: Some("#FF0000".to_string()),
        overwrite: false,
    };
    let result = watermark::run(&opts, &|_| ());
    assert!(result.is_err());
}
