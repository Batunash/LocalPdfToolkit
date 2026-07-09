mod common;

use localpdf_core::tools::compress;
use localpdf_core::types::{CompressOpts, CompressionLevel};
use std::fs;

#[test]
fn test_compress_basic() {
    let dummy_pdf = common::get_dummy_pdf();


    let output_path = dummy_pdf.with_extension("compressed.pdf");

    let opts = CompressOpts {
        input_file: dummy_pdf,
        output_path: output_path.clone(),
        level: CompressionLevel::Balanced,
        overwrite: true,
    };

    let result = compress::run(&opts, &|p| {
        println!("Progress: {} - {}", p.percent, p.message);
    });

    assert!(result.is_ok(), "Compress failed: {:?}", result.err());
    let output = result.unwrap();
    assert!(output.output_path.exists());
    
    // cleanup
    let _ = fs::remove_file(output.output_path);
}
