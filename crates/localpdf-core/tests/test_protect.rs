mod common;

use localpdf_core::tools::protect;
use localpdf_core::types::ProtectOpts;
use std::fs;
use std::path::PathBuf;

#[test]
fn test_protect_basic() {
    let dummy_pdf = common::get_dummy_pdf();
    let output_path = dummy_pdf.with_extension("protected.pdf");

    let opts = ProtectOpts {
        input_file: dummy_pdf,
        output_path: output_path.clone(),
        user_password: "password".to_string(),
        owner_password: Some("owner".to_string()),
        permissions: Default::default(),
        overwrite: true,
    };

    let result = protect::run(&opts, &|_| ());
    assert!(result.is_ok(), "Protect failed: {:?}", result.err());

    let output = result.unwrap();
    assert!(output.output_path.exists());
    assert_eq!(output.page_count, Some(1));

    let _ = fs::remove_file(output.output_path);
}

#[test]
fn test_protect_missing_file_fails() {
    let opts = ProtectOpts {
        input_file: PathBuf::from("nonexistent.pdf"),
        output_path: PathBuf::from("output.pdf"),
        user_password: "password".to_string(),
        owner_password: None,
        permissions: Default::default(),
        overwrite: false,
    };
    let result = protect::run(&opts, &|_| ());
    assert!(result.is_err());
}
