# LocalPDF

LocalPDF is an offline-first desktop application for managing, editing, and converting PDF files. It processes everything entirely on your local machine, ensuring your sensitive documents never leave your computer.

Built with Rust and Tauri, LocalPDF is designed to be lightweight, fast, and secure.

## Features

- **Offline Processing:** No cloud uploads, no account required. 
- **Merge & Split:** Combine multiple PDFs into one, or split a large document by page ranges.
- **Edit & Modify:** Rotate pages, crop margins, and add page numbers.
- **Watermarks:** Add custom text or image watermarks to your documents.
- **Security:** Encrypt PDFs with AES-256 passwords or unlock existing ones.
- **Compression:** Reduce file sizes locally with multiple compression profiles.
- **OCR:** Make scanned PDFs searchable using local machine learning models.
- **Multi-lingual:** Available in English, Turkish, Spanish, German, and French.

## Download

Pre-compiled binaries for Windows, macOS, and Linux are available on the [Releases](https://github.com/okullubatuhan/localpdf/releases) page.

## Command Line Interface

LocalPDF includes a fully functional CLI for automation and scripting.

```bash
# Merge documents
localpdf merge file1.pdf file2.pdf -o merged.pdf

# Compress a document
localpdf compress document.pdf -o small.pdf --level high

# Protect with a password
localpdf protect statement.pdf -o secure.pdf --password "secret"

# OCR a scanned document
localpdf ocr scan.pdf -o searchable.pdf --lang eng+tur
```

## Development

LocalPDF is built with a Rust core and a React/Tauri frontend.

### Requirements
- Rust 1.70+
- Node.js 18+

### Setup

```bash
git clone https://github.com/okullubatuhan/localpdf.git
cd localpdf

# Install frontend dependencies
cd ui
npm install
cd ..

# Run the development server
cargo tauri dev

# Build the release binary
cargo tauri build
```

## License

MIT