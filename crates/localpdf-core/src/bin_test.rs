use lopdf::Document; fn main() { let mut doc = Document::with_version("1.7"); doc.delete_pages(&[1]); }
