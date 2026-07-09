use lopdf::{dictionary, Document, Object, Stream};
use std::path::{Path, PathBuf};
use std::fs;

/// Creates a minimal valid PDF and saves it to the specified path
pub fn create_dummy_pdf<P: AsRef<Path>>(path: P) -> std::io::Result<()> {
    let mut doc = Document::with_version("1.5");
    let pages_id = doc.new_object_id();
    let font_id = doc.add_object(dictionary! {
        "Type" => "Font",
        "Subtype" => "Type1",
        "BaseFont" => "Courier",
    });
    let resources_id = doc.add_object(dictionary! {
        "Font" => dictionary! {
            "F1" => font_id,
        },
    });
    let content_id = doc.add_object(Stream::new(dictionary!{}, b"BT /F1 12 Tf 100 100 Td (Hello World) Tj ET".to_vec()));
    
    let page_id = doc.add_object(dictionary! {
        "Type" => "Page",
        "Parent" => pages_id,
        "Contents" => vec![content_id.into()],
        "MediaBox" => vec![0.into(), 0.into(), 595.into(), 842.into()],
        "Resources" => resources_id,
    });
    
    let pages = dictionary! {
        "Type" => "Pages",
        "Kids" => vec![page_id.into()],
        "Count" => 1,
    };
    
    doc.objects.insert(pages_id, Object::Dictionary(pages));
    
    let catalog_id = doc.add_object(dictionary! {
        "Type" => "Catalog",
        "Pages" => pages_id,
    });
    
    doc.trailer.set("Root", catalog_id);
    
    if let Some(parent) = path.as_ref().parent() {
        fs::create_dir_all(parent)?;
    }
    
    doc.save(path).map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;
    
    Ok(())
}

pub fn get_dummy_pdf() -> PathBuf {
    let path = PathBuf::from("tests/fixtures/dummy.pdf");
    if !path.exists() {
        create_dummy_pdf(&path).expect("Failed to create dummy PDF");
    }
    path
}
