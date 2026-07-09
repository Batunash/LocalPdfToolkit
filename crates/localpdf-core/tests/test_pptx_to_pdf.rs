mod common;

use localpdf_core::convert::pptx_to_pdf::{pptx_to_pdf, PptxToPdfOpts};
use std::fs::{self, File};
use std::io::Write;
use std::path::PathBuf;
use zip::ZipWriter;

#[test]
fn test_pptx_to_pdf_basic() {
    let dummy_pptx = PathBuf::from("tests/fixtures/dummy_basic.pptx");
    
    // Create a dummy valid zip file
    if let Some(parent) = dummy_pptx.parent() {
        let _ = fs::create_dir_all(parent);
    }
    let file = File::create(&dummy_pptx).unwrap();
    let mut zip = ZipWriter::new(file);
    let options = zip::write::SimpleFileOptions::default().compression_method(zip::CompressionMethod::Stored);
    zip.start_file("ppt/slides/slide1.xml", options).unwrap();
    zip.write_all(b"<slide></slide>").unwrap();
    zip.finish().unwrap();

    let output_path = dummy_pptx.with_extension("pdf");

    let opts = PptxToPdfOpts {
        input_file: dummy_pptx.clone(),
        output_path: output_path.clone(),
        slide_size: localpdf_core::convert::pptx_to_pdf::SlideSize::Automatic,
        overwrite: true,
    };

    let result = pptx_to_pdf(&opts, &|_| ());
    assert!(result.is_ok(), "Conversion failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());

    let _ = fs::remove_file(output.output_path);
    let _ = fs::remove_file(dummy_pptx);
}

#[test]
fn test_pptx_to_pdf_missing_file() {
    let opts = PptxToPdfOpts {
        input_file: PathBuf::from("nonexistent.pptx"),
        output_path: PathBuf::from("out.pdf"),
        slide_size: localpdf_core::convert::pptx_to_pdf::SlideSize::Automatic,
        overwrite: true,
    };

    let result = pptx_to_pdf(&opts, &|_| ());
    assert!(result.is_err());
}
