mod common;

use localpdf_core::convert::images_to_pdf::{images_to_pdf, ImageToPdfOpts};
use std::path::PathBuf;

#[test]
fn test_images_to_pdf_basic() {
    let output_path = PathBuf::from("tests/fixtures/out_img.pdf");

    let opts = ImageToPdfOpts {
        input_files: vec![PathBuf::from("image1.png")],
        output_path: output_path.clone(),
        page_size: "A4".to_string(),
        margin: 10.0,
        overwrite: true,
    };

    let result = images_to_pdf(&opts, &|_| ());
    assert!(result.is_ok(), "Conversion failed: {:?}", result.err());
}
