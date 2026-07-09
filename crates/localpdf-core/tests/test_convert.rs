mod common;

use localpdf_core::tools::convert;
use localpdf_core::types::{ConvertOpts, TargetFormat, ConversionOptions};
use std::fs;
use std::path::PathBuf;

#[test]
fn test_convert_to_pdf() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_path = dummy_pdf.with_extension("converted.pdf");

    let opts = ConvertOpts {
        input_file: dummy_pdf,
        output_path: output_path.clone(),
        target_format: TargetFormat::Pdf,
        options: ConversionOptions::default(),
        overwrite: true,
    };

    let result = convert::run(&opts, &|_| ());
    assert!(result.is_ok(), "Convert to PDF failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());
    assert_eq!(output.page_count, Some(1));

    let _ = fs::remove_file(output.output_path);
}

#[test]
fn test_convert_to_unimplemented() {
    let dummy_pdf = common::get_dummy_pdf();
    
    // Jpg
    let opts = ConvertOpts {
        input_file: dummy_pdf.clone(),
        output_path: PathBuf::from("out.jpg"),
        target_format: TargetFormat::Jpg,
        options: ConversionOptions::default(),
        overwrite: true,
    };
    assert!(convert::run(&opts, &|_| ()).is_err());

    // Png
    let opts_png = ConvertOpts {
        input_file: dummy_pdf.clone(),
        output_path: PathBuf::from("out.png"),
        target_format: TargetFormat::Png,
        options: ConversionOptions::default(),
        overwrite: true,
    };
    assert!(convert::run(&opts_png, &|_| ()).is_err());

    // Docx
    let opts_docx = ConvertOpts {
        input_file: dummy_pdf.clone(),
        output_path: PathBuf::from("out.docx"),
        target_format: TargetFormat::Docx,
        options: ConversionOptions::default(),
        overwrite: true,
    };
    assert!(convert::run(&opts_docx, &|_| ()).is_err());
    
    // Html
    let opts_html = ConvertOpts {
        input_file: dummy_pdf.clone(),
        output_path: PathBuf::from("out.html"),
        target_format: TargetFormat::Html,
        options: ConversionOptions::default(),
        overwrite: true,
    };
    assert!(convert::run(&opts_html, &|_| ()).is_err());
}

#[test]
fn test_convert_missing_file_fails() {
    let opts = ConvertOpts {
        input_file: PathBuf::from("nonexistent.pdf"),
        output_path: PathBuf::from("output.pdf"),
        target_format: TargetFormat::Pdf,
        options: ConversionOptions::default(),
        overwrite: false,
    };
    let result = convert::run(&opts, &|_| ());
    assert!(result.is_err());
}
