# LocalPDF Toolkit

A fast, privacy-focused desktop PDF toolkit built with Rust + Tauri. All processing happens locally on your machine - no file uploads ever.

## Features

### Organize
- **Merge** - Combine multiple PDFs into one
- **Split** - Extract pages or split by ranges
- **Remove Pages** - Delete specific pages
- **Extract Pages** - Save selected pages to new PDF
- **Organize Pages** - Reorder and rotate pages
- **Compress** - Reduce PDF file size

### Edit
- **Rotate** - Rotate pages 90°, 180°, 270°
- **Watermark** - Add text or image watermarks
- **Page Numbers** - Add custom page numbering
- **Crop** - Crop page margins

### Security
- **Protect** - Encrypt PDF with password (AES-256)
- **Unlock** - Remove password protection

### OCR
- **Scan to Text** - Make scanned PDFs searchable (English, Turkish)

### Repair
- **Fix Corrupt PDFs** - Rebuild damaged PDF structures

### Convert
- **PDF to Images** - Export pages as JPG/PNG
- **Images to PDF** - Combine images into PDF
- **Office Formats** - DOCX, XLSX, PPTX ↔ PDF (coming soon)

## Installation

### Prerequisites

- Rust 1.70+ (https://rustup.rs/)
- Node.js 18+ (https://nodejs.org/)
- For OCR feature: vcpkg (Windows) or brew/apt (macOS/Linux)

### Build from Source

```bash
# Clone the repository
git clone https://github.com/okullubatuhan/localpdf.git
cd localpdf

# Install dependencies
cd ui
npm install
cd ..

# Build the application
cargo tauri build

# Or run in development mode
cargo tauri dev
```

### CLI Usage

```bash
# Merge PDFs
localpdf merge file1.pdf file2.pdf file3.pdf -o merged.pdf

# Split PDF (every 10 pages)
localpdf split document.pdf -o output_dir --mode every --n 10

# Compress PDF
localpdf compress large.pdf -o small.pdf --level high

# Add password protection
localpdf protect secure.pdf -o encrypted.pdf --password "secret123"

# Make scanned PDF searchable
localpdf ocr scanned.pdf -o searchable.pdf --lang eng+tur

# Get PDF info
localpdf info document.pdf
```

## Project Structure

```
localpdf/
├── crates/
│   ├── localpdf-core/     # Core PDF processing library
│   ├── localpdf-cli/      # Command-line interface
│   └── localpdf-app/      # Tauri desktop GUI
├── ui/                    # React + Vite frontend
├── Cargo.toml            # Workspace manifest
└── tauri.conf.json       # Tauri configuration
```

## Tech Stack

- **Core**: Rust with pdfium-render, lopdf, printpdf
- **CLI**: clap, indicatif, owo-colors
- **GUI**: Tauri v2, React 18, TypeScript, TailwindCSS v4
- **State**: Zustand, TanStack Query
- **UI Components**: shadcn/ui, framer-motion

## Development

### Running Tests

```bash
cargo test --workspace
```

### Checking Code

```bash
cargo check --workspace
cargo clippy --workspace
```

### Building for Release

```bash
# Windows
cargo tauri build --target x86_64-pc-windows-msvc

# macOS
cargo tauri build --target x86_64-apple-darwin

# Linux
cargo tauri build --target x86_64-unknown-linux-gnu
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines first.

## Acknowledgments

- [pdfium-render](https://github.com/bilalekhenoud/pdfium-render) - PDF rendering
- [lopdf](https://github.com/J-F-Liu/lopdf) - PDF manipulation
- [Tauri](https://tauri.app/) - Desktop framework
- [rust-pdfium-render](https://crates.io/crates/pdfium-render) - Static PDFium bindings