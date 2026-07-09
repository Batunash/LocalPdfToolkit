mod common;

use localpdf_core::tools::split;
use localpdf_core::types::{SplitOpts, SplitStrategy, PageRange};
use std::fs;
use std::path::PathBuf;

#[test]
fn test_split_by_ranges() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_dir = dummy_pdf.with_extension("split_dir");

    let opts = SplitOpts {
        input_file: dummy_pdf,
        output_dir: output_dir.clone(),
        strategy: SplitStrategy::ByRanges,
        ranges: Some(vec![PageRange { start: 1, end: 1 }]),
        overwrite: true,
    };

    let result = split::run(&opts, &|_| ());
    assert!(result.is_ok(), "Split failed: {:?}", result.err());
    
    let outputs = result.unwrap();
    assert_eq!(outputs.len(), 1);
    assert!(outputs[0].output_path.exists());
    assert_eq!(outputs[0].page_count, Some(1));

    let _ = fs::remove_dir_all(output_dir);
}

#[test]
fn test_split_by_every() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_dir = dummy_pdf.with_extension("split_dir_every");

    let opts = SplitOpts {
        input_file: dummy_pdf,
        output_dir: output_dir.clone(),
        strategy: SplitStrategy::ByEvery(1),
        ranges: None,
        overwrite: true,
    };

    let result = split::run(&opts, &|_| ());
    assert!(result.is_ok());
    
    let outputs = result.unwrap();
    assert_eq!(outputs.len(), 1);

    let _ = fs::remove_dir_all(output_dir);
}

#[test]
fn test_split_by_size() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_dir = dummy_pdf.with_extension("split_dir_size");

    let opts = SplitOpts {
        input_file: dummy_pdf,
        output_dir: output_dir.clone(),
        strategy: SplitStrategy::BySize(10000), // 10KB
        ranges: None,
        overwrite: true,
    };

    let result = split::run(&opts, &|_| ());
    assert!(result.is_ok());
    
    let outputs = result.unwrap();
    assert_eq!(outputs.len(), 1);

    let _ = fs::remove_dir_all(output_dir);
}

#[test]
fn test_split_missing_ranges_fails() {
    let dummy_pdf = common::get_dummy_pdf();
    let opts = SplitOpts {
        input_file: dummy_pdf,
        output_dir: PathBuf::from("output"),
        strategy: SplitStrategy::ByRanges,
        ranges: None, // Missing ranges
        overwrite: false,
    };

    let result = split::run(&opts, &|_| ());
    assert!(result.is_err());
}
