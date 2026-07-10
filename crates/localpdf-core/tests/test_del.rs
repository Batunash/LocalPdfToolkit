use lopdf::Document; #[test] fn test_del() { let mut doc = Document::with_version("1.7"); doc.delete_pages(&[1]); }
