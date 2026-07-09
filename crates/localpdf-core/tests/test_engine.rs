mod common;

use localpdf_core::engine::lopdf::LoPdfHelper;
use localpdf_core::engine::pdfium::{LoPdfEngine, CompressSettings};
use localpdf_core::engine::image::ImageHelper;
use localpdf_core::types::EncryptionPermissions;
use image::{DynamicImage, RgbImage, RgbaImage, Rgba};
use std::path::PathBuf;
use std::fs;

#[test]
fn test_lopdf_helper() {
    let dummy_pdf = common::get_dummy_pdf();
    let mut doc = LoPdfHelper::load(&dummy_pdf).unwrap();
    
    assert_eq!(LoPdfHelper::get_version(&doc), "1.5");
    assert!(!LoPdfHelper::is_encrypted(&doc));
    
    let objs = LoPdfHelper::get_page_objs(&doc);
    assert_eq!(objs.len(), 1);
    
    LoPdfHelper::compress_streams(&mut doc);
    LoPdfHelper::deduplicate_fonts(&mut doc);
    assert!(LoPdfHelper::rebuild_xref(&mut doc).is_ok());
    
    let out_path = dummy_pdf.with_extension("lopdf_out.pdf");
    assert!(LoPdfHelper::save(&mut doc, &out_path).is_ok());
    
    let bytes = LoPdfHelper::save_to_memory(&mut doc).unwrap();
    assert!(!bytes.is_empty());
    
    let mem_doc = LoPdfHelper::load_from_memory(&bytes).unwrap();
    assert_eq!(LoPdfHelper::get_version(&mem_doc), "1.5");
    
    assert!(LoPdfHelper::decrypt(&mut doc, b"pass").is_err());
    assert!(LoPdfHelper::encrypt(&mut doc, b"pass", None, EncryptionPermissions::default()).is_err());
    
    fs::remove_file(out_path).unwrap();
}

#[test]
fn test_pdfium_engine_wrapper() {
    let dummy_pdf = common::get_dummy_pdf();
    let mut doc = LoPdfEngine::open_document(&dummy_pdf).unwrap();
    
    assert_eq!(LoPdfEngine::page_count(&doc), 1);
    assert!(!LoPdfEngine::is_encrypted(&doc));
    
    let objs = LoPdfEngine::get_page_object_ids(&doc);
    assert_eq!(objs.len(), 1);
    
    LoPdfEngine::compress_streams(&mut doc);
    assert!(LoPdfEngine::rebuild_xref(&mut doc).is_ok());
    
    let out_path = dummy_pdf.with_extension("pdfium_out.pdf");
    assert!(LoPdfEngine::save_document(&mut doc, &out_path).is_ok());
    
    let bytes = LoPdfEngine::save_to_buffer(&mut doc).unwrap();
    assert!(!bytes.is_empty());
    
    let _mem_doc = LoPdfEngine::open_document_from_bytes(&bytes).unwrap();
    
    let mut new_doc = LoPdfEngine::create_document().unwrap();
    assert_eq!(LoPdfEngine::page_count(&new_doc), 0);
    
    assert!(LoPdfEngine::decrypt(&dummy_pdf, "pass").is_ok());
    assert!(LoPdfEngine::encrypt(&mut doc, b"pass", None).is_err());
    
    assert_eq!(LoPdfEngine::get_page_size(((1, 0), b"")), (595.0, 842.0));
    
    let settings = CompressSettings::default();
    assert_eq!(settings.jpeg_quality, 80);
    
    fs::remove_file(out_path).unwrap();
}

#[test]
fn test_image_helper() {
    let mut img = RgbaImage::new(10, 10);
    img.put_pixel(5, 5, Rgba([255, 0, 0, 255]));
    let dynamic = DynamicImage::ImageRgba8(img);
    
    let temp_jpg = PathBuf::from("temp.jpg");
    assert!(ImageHelper::encode_jpeg(&dynamic, &temp_jpg, 80).is_ok());
    
    let decoded = ImageHelper::decode(&temp_jpg).unwrap();
    assert_eq!(ImageHelper::dimensions(&decoded), (10, 10));
    
    let temp_png = PathBuf::from("temp.png");
    assert!(ImageHelper::encode_png(&dynamic, &temp_png).is_ok());
    
    let bytes = ImageHelper::encode_to_bytes(&dynamic, image::ImageFormat::Png).unwrap();
    assert!(!bytes.is_empty());
    
    let decoded_mem = ImageHelper::decode_bytes(&bytes).unwrap();
    assert_eq!(ImageHelper::dimensions(&decoded_mem), (10, 10));
    
    let resized = ImageHelper::resize_filter(&dynamic, 5, 5);
    assert_eq!(ImageHelper::dimensions(&resized), (5, 5));
    
    let _rgba = ImageHelper::to_rgba8(&dynamic);
    let _rgb = ImageHelper::to_rgb8(&dynamic);
    
    fs::remove_file(temp_jpg).unwrap();
    fs::remove_file(temp_png).unwrap();
}
