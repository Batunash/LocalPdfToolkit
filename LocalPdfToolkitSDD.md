**LocalPDF**

Desktop Edition - Rust + Tauri v2

Zero External Binaries · CLI + GUI · 100% Offline

**Software Design Document - v4.0**

May 2025

**Prepared by: Batuhan**

Status: Draft | Supersedes: v3.0 (Electron + Python)

# **Revision History**

| **Version** | **Date** | **Description**                                                                                           | **Author** |
| ----------- | -------- | --------------------------------------------------------------------------------------------------------- | ---------- |
| **1.0**     | May 2025 | Initial draft - Web (React SPA + FastAPI HTTP)                                                            | Batuhan    |
| **2.0**     | May 2025 | Electron Desktop - FastAPI on localhost                                                                   | Batuhan    |
| **3.0**     | May 2025 | Pure Electron - Python JSON-RPC via stdin/stdout, no HTTP                                                 | Batuhan    |
| **4.0**     | May 2025 | Full rewrite - Rust + Tauri v2, zero external binaries, pure Rust PDF engine, CLI + GUI sharing same core | Batuhan    |

# **Table of Contents**

# **1\. Introduction**

## **1.1 Project Vision**

LocalPDF v4.0 is a completely self-contained PDF toolsuite distributed as a single installable binary. It requires zero runtime dependencies - no Python, no Node.js, no LibreOffice, no Ghostscript, no Tesseract installation. Every capability is statically compiled into the application binary.

The project delivers two first-class interfaces sharing a single Rust core library: a fully-featured command-line tool for power users and scripting, and a modern desktop GUI built with Tauri v2 and React for everyday use.

## **1.2 Why Rust + Tauri v2?**

| **Concern**           | **Electron (v3.0)**                 | **Rust + Tauri v2 (v4.0)**                    |
| --------------------- | ----------------------------------- | --------------------------------------------- |
| **Runtime size**      | ~120 MB Electron + ~80 MB Python    | ~8-15 MB Tauri shell (uses OS webview)        |
| **External binaries** | LibreOffice, Ghostscript, Tesseract | Zero - all statically linked                  |
| **Installation UX**   | User must have Python on PATH       | Download and run - nothing else               |
| **Memory (idle)**     | ~260 MB (3 processes)               | ~50-80 MB (1 process + webview)               |
| **PDF processing**    | Python GIL limits parallelism       | Rayon multi-threading, zero GIL               |
| **Startup time**      | ~6 seconds cold start               | < 1 second cold start                         |
| **CLI support**       | Not available                       | First-class CLI binary (same core)            |
| **Webview**           | Bundled Chromium (~85 MB)           | OS webview (WKWebView / WebView2 / WebKitGTK) |
| **Binary size**       | ~578 MB total install               | ~80-120 MB total install                      |
| **Cross-compile**     | Platform-specific builds only       | cargo cross-compile + GitHub Actions          |

## **1.3 Non-Goals**

- Feature parity with Adobe Acrobat's advanced editing (reflow, font embedding substitution)
- Office conversion visual fidelity matching LibreOffice - pure Rust converters produce accurate but not pixel-perfect output
- Mobile platform support (iOS, Android) - desktop only
- Cloud sync, user accounts, or any network functionality

## **1.4 Abbreviations**

| **Tauri v2**      | Rust-based desktop app framework using OS-native webview     |
| ----------------- | ------------------------------------------------------------ |
| **pdfium-render** | Rust bindings to Google's PDFium library (statically linked) |
| **lopdf**         | Pure Rust low-level PDF manipulation library                 |
| **printpdf**      | Pure Rust PDF generation library                             |
| **leptess**       | Rust bindings to Tesseract OCR (statically linked)           |
| **calamine**      | Pure Rust Excel/XLSX/XLS/ODS reader                          |
| **docx-rs**       | Pure Rust DOCX read/write library                            |
| **clap**          | Rust CLI argument parser (derive macro style)                |
| **indicatif**     | Rust terminal progress bar library                           |
| **rayon**         | Rust data-parallelism library                                |
| **IPC**           | Tauri's invoke() bridge from JS frontend to Rust backend     |
| **WKWebView**     | Apple's native webview (macOS/iOS)                           |
| **WebView2**      | Microsoft's Chromium-based webview (Windows)                 |
| **WebKitGTK**     | GTK-based webview (Linux)                                    |

# **2\. System Architecture**

## **2.1 Cargo Workspace Overview**

The project is a single Cargo workspace containing three crates. The CLI and GUI share 100% of PDF logic through the core crate - no code duplication.

localpdf/

Cargo.toml # workspace manifest

crates/

localpdf-core/ # shared Rust library (all PDF logic)

localpdf-cli/ # CLI binary (localpdf)

localpdf-app/ # Tauri desktop app (localpdf-app)

ui/ # React + Vite frontend

src/

components/ # shadcn/ui + custom components

pages/ # 25 tool pages

hooks/ # custom React hooks

store/ # Zustand state

lib/ # Tauri invoke wrappers

types/ # TypeScript type definitions

index.html

vite.config.ts

tailwind.config.ts

tauri.conf.json # Tauri v2 configuration

.github/workflows/ # CI/CD - matrix build for all platforms

## **2.2 Crate Dependency Graph**

localpdf-cli ──depends on──> localpdf-core

localpdf-app ──depends on──> localpdf-core

localpdf-core ──depends on──> \[pdfium-render, lopdf, printpdf, image, leptess, docx-rs, calamine, umya-spreadsheet, quick-xml, zip, flate2, rayon, tokio, serde, anyhow, thiserror, aes, rand, oxipng, image-compress ...\]

## **2.3 Data Flow - GUI**

User interaction in the React UI triggers a Tauri command via invoke(). The Tauri main process (Rust) routes it to localpdf-core, processes the file entirely in memory or via temp paths, and returns a structured result back to the UI.

React UI → invoke('pdf_merge', payload)

→ Tauri Command Handler (localpdf-app/src/commands/)

→ localpdf_core::tools::merge::run(opts)

→ pdfium-render / lopdf (PDF processing)

→ Result&lt;JobOutput, LpError&gt;

→ tauri::Event (progress updates)

→ invoke() resolves → React UI updates

## **2.4 Data Flow - CLI**

The CLI binary directly calls the same core functions. No IPC, no webview, no Tauri runtime.

\$ localpdf merge a.pdf b.pdf -o merged.pdf --verbose

→ clap parses args (localpdf-cli/src/main.rs)

→ localpdf_core::tools::merge::run(opts)

→ indicatif progress bar (terminal)

→ Result written to stdout / output file

## **2.5 Tauri v2 Process Model**

Tauri v2 runs as a single process with two logical contexts: the Rust backend (OS process) and the OS webview rendering the React UI. Communication is via Tauri's typed invoke() bridge - no HTTP, no IPC sockets.

| **Rust Backend**              | OS process - handles all PDF operations, file I/O, temp dir management, update checks |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| **OS Webview**                | Hosts the compiled React bundle - communicates via Tauri invoke() / emit()            |
| **tauri::Window**             | Window management, native dialogs (open/save file), system tray                       |
| **tauri::State&lt;T&gt;**     | Shared app state: active jobs, settings, temp dir path                                |
| **tauri::Event**              | Progress notifications pushed from Rust to JS during long operations                  |
| **tauri-plugin-fs**           | Secure sandboxed file system access from JS (allowlist-based)                         |
| **tauri-plugin-dialog**       | Native file open/save dialogs from JS                                                 |
| **tauri-plugin-notification** | Native desktop notifications                                                          |
| **tauri-plugin-updater**      | Auto-update from GitHub Releases                                                      |
| **tauri-plugin-shell**        | Disabled - no shell exec allowed (security)                                           |

# **3\. localpdf-core - The Rust PDF Library**

## **3.1 Module Structure**

localpdf-core/src/

lib.rs # public API surface

error.rs # LpError enum (thiserror)

types.rs # JobOpts, JobOutput, Progress structs

engine/

mod.rs

pdfium.rs # PDFium engine wrapper

lopdf.rs # lopdf low-level helpers

image.rs # image crate helpers

tools/

mod.rs

merge.rs # merge::run(opts, progress_cb)

split.rs

remove_pages.rs

extract_pages.rs

organize.rs

compress.rs

rotate.rs

watermark.rs

page_numbers.rs

crop.rs

ocr.rs # leptess wrapper

protect.rs # AES-256 via pikepdf-rs / lopdf + aes crate

unlock.rs

repair.rs

convert/

mod.rs

pdf_to_images.rs # PDF pages → JPG/PNG (pdfium render)

pdf_to_docx.rs # text + image extraction → docx-rs

pdf_to_xlsx.rs # table extraction → umya-spreadsheet

pdf_to_pptx.rs # page images → PPTX slides

pdf_to_html.rs # text layer extraction → HTML

docx_to_pdf.rs # docx-rs parse → printpdf render

xlsx_to_pdf.rs # calamine parse → printpdf table render

pptx_to_pdf.rs # slide XML parse → printpdf render

images_to_pdf.rs # image crate → printpdf embed

html_to_pdf.rs # basic HTML → PDF (custom renderer)

utils/

tempdir.rs # TempDir RAII guard

paths.rs # safe path helpers

progress.rs # Progress type + callback trait

## **3.2 Core Public API**

Every tool exposes a single run() function with consistent signature:

pub fn run(

opts: &MergeOpts,

progress: &dyn Fn(Progress),

) -> Result&lt;JobOutput, LpError&gt;

JobOutput contains the output file bytes (or path) and metadata. This design allows both CLI and GUI to consume the same function - the CLI prints progress to the terminal, the GUI emits Tauri events.

## **3.3 Error Handling**

LpError is a thiserror enum covering all failure modes:

| **Variant**                    | **Trigger**                              | **HTTP equivalent (v2.0)** |
| ------------------------------ | ---------------------------------------- | -------------------------- |
| **LpError::PdfCorrupt**        | Input PDF fails PDFium validation        | \-32000                    |
| **LpError::FileNotFound**      | Input path does not exist                | \-32001                    |
| **LpError::WrongPassword**     | Encrypted PDF - wrong password supplied  | \-32002                    |
| **LpError::DiskFull**          | Insufficient disk space for output       | \-32003                    |
| **LpError::Timeout**           | Operation exceeded configured time limit | \-32004                    |
| **LpError::ConversionFailed**  | Office format conversion failed          | \-32005                    |
| **LpError::OcrFailed**         | Tesseract returned no result             | \-32006                    |
| **LpError::InvalidParams**     | Caller passed invalid options struct     | \-32602                    |
| **LpError::Io(io::Error)**     | Filesystem I/O error                     | 500                        |
| **LpError::Image(ImageError)** | image crate decode/encode failure        | 500                        |

# **4\. PDF Processing Engine (No External Binaries)**

## **4.1 Library Selection Rationale**

Every library listed below is either pure Rust (compiled into the binary) or statically linked (C library compiled and embedded at build time). The user installs zero additional software.

## **4.2 Primary PDF Engine - pdfium-render**

pdfium-render provides Rust bindings to Google's PDFium library - the same PDF engine used in Chromium. With the static feature flag, PDFium is compiled and linked into the binary at build time.

| **Cargo feature**    | 'static' - downloads and statically links PDFium for the target platform                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Used for**         | Page rendering (rasterize to image), PDF save with compression settings, page extraction, rotation, metadata read/write, password check |
| **Compression**      | PdfDocumentRenderSettings with DPI + JPEG quality control replaces Ghostscript                                                          |
| **Platform support** | Windows x64, macOS x64/arm64 (universal), Linux x64/arm64                                                                               |
| **License**          | BSD 3-Clause (PDFium) + MIT (pdfium-render bindings)                                                                                    |

## **4.3 Low-Level PDF - lopdf**

lopdf is a pure Rust library for direct PDF object manipulation. Used where pdfium-render does not expose low-level access.

| **Used for**  | Merge (direct cross-reference rebuild), page number injection, watermark as content stream, AES-256 encryption/decryption (PDF protect/unlock), repair (cross-reference table reconstruction) |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pure Rust** | Yes - zero C dependencies                                                                                                                                                                     |
| **License**   | MIT                                                                                                                                                                                           |

## **4.4 PDF Generation - printpdf**

printpdf is a pure Rust library for creating new PDF documents from scratch. Used for all Office-to-PDF conversions.

| **Used for**  | DOCX→PDF render, XLSX→PDF table layout, PPTX→PDF slide layout, HTML→PDF basic render, Images→PDF embed |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| **Pure Rust** | Yes - zero C dependencies                                                                              |
| **Fonts**     | rusttype / fontdb for font metrics and text layout                                                     |
| **License**   | MIT                                                                                                    |

## **4.5 OCR - leptess (Static Tesseract)**

leptess provides Rust bindings to Tesseract OCR and Leptonica. The static feature compiles both C libraries into the binary. Language data (.traineddata) files for TR and EN are bundled in the app resources at build time.

| **Cargo feature**     | 'static' - statically links Tesseract + Leptonica                    |
| --------------------- | -------------------------------------------------------------------- |
| **Bundled languages** | English (eng.traineddata, ~10 MB) + Turkish (tur.traineddata, ~5 MB) |
| **Extra languages**   | User can place additional .traineddata files in the app data dir     |
| **Build requirement** | LLVM + clang required during build (not at runtime)                  |
| **License**           | Apache 2.0 (Tesseract) + Apache 2.0 (Leptonica)                      |

## **4.6 Image Processing - image crate**

The image crate is a pure Rust image codec supporting JPEG, PNG, WebP, TIFF, BMP, GIF encode/decode. Used for PDF page rasterization output, image compression within PDFs, and Images-to-PDF embedding.

| **Used for**    | PDF→JPG, PDF→PNG output encoding; embedded image recompression in Compress tool; Images→PDF source decoding |
| --------------- | ----------------------------------------------------------------------------------------------------------- |
| **Compression** | JPEG quality 1-100, PNG compression level 1-9 (oxipng for optimal)                                          |
| **Pure Rust**   | Yes for most codecs; WebP uses libwebp (static)                                                             |
| **License**     | MIT / Apache 2.0                                                                                            |

## **4.7 Compression Strategy (Ghostscript Replacement)**

Ghostscript is completely replaced by a two-pass compression pipeline in pure Rust:

**Pass 1 - Image Stream Recompression**

- Extract embedded image XObjects from the PDF using lopdf
- Decode each image stream with the image crate
- Re-encode at target quality (JPEG 60/75/90 depending on level) with the image crate
- Recompress PNG streams with oxipng (pure Rust, zopfli-based optimizer)
- Replace the original stream bytes in the lopdf document object

**Pass 2 - Stream Compression**

- All non-image content streams re-compressed with flate2 (zlib, Rust binding to miniz_oxide)
- Redundant resource entries and duplicate font objects deduplicated
- Output saved via pdfium-render with LinearizePDF option for faster web/preview loading

**Compression Levels**

| **Level**    | **Image JPEG Q** | **PNG**        | **Stream**  | **Expected reduction** |
| ------------ | ---------------- | -------------- | ----------- | ---------------------- |
| **Maximum**  | 50               | oxipng --opt 6 | deflate max | 50-70%                 |
| **High**     | 65               | oxipng --opt 4 | deflate 9   | 35-55%                 |
| **Balanced** | 80               | oxipng --opt 2 | deflate 6   | 20-40%                 |
| **Low**      | 90               | oxipng --opt 1 | deflate 3   | 10-25%                 |

# **5\. Office Format Conversions (Pure Rust, No LibreOffice)**

## **5.1 Design Philosophy**

LibreOffice is replaced by purpose-built pure Rust parsers for each format. Conversion fidelity is accurate for structured content (text, tables, images) and may differ from LibreOffice for advanced formatting features (complex styles, macros, embedded OLE objects). This trade-off is explicitly chosen to eliminate all external binary dependencies.

## **5.2 DOCX → PDF (docx-rs + printpdf)**

**Pipeline**

- docx-rs opens and parses the DOCX ZIP archive
- Paragraph and run styles (font, size, bold, italic, color) extracted
- Table structures parsed (rows, cells, spans)
- Embedded images extracted from media/ directory
- printpdf document created with matching page size (A4/Letter from DOCX settings)
- Text laid out with fontdb + rusttype for glyph metrics
- Tables rendered as bordered rectangles + cell text
- Images embedded with image crate decode + printpdf XObject
- Page breaks honored (explicit and implicit via text overflow)

**Limitations**

- Complex list styles (nested numbered lists) rendered as simplified bullets
- Word Art, SmartArt, charts not rendered (placeholder box shown)
- Track changes / comments not rendered in output PDF
- Complex table cell merges render correctly; diagonal borders not supported

## **5.3 XLSX → PDF (calamine + printpdf)**

**Pipeline**

- calamine reads XLSX (also XLS, ODS) - pure Rust, no COM/OLE
- Each sheet parsed: cell values, types (number, text, date, formula result), styles
- Sheets paginated - columns auto-fit to A4/Letter width with font size scaling
- printpdf renders each sheet as a table with alternating row shading
- Sheet tabs → separate pages in output PDF with sheet name header

**Limitations**

- Charts and sparklines not rendered
- Cell formulas shown as calculated values (calamine evaluates simple formulas)
- Conditional formatting not applied to rendered output

## **5.4 PPTX → PDF (quick-xml + zip + printpdf)**

**Pipeline**

- PPTX file opened as ZIP archive
- ppt/slides/slide\*.xml files parsed with quick-xml
- Each slide's shapes, text boxes, images and background extracted
- Slide dimensions from ppt/presentation.xml (default 10 x 7.5 in)
- printpdf renders each slide as a full-page PDF page
- Text boxes positioned absolutely per slide coordinates
- Images extracted from ppt/media/ and embedded

**Limitations**

- Animations and transitions not represented
- Complex shape fills (gradient, pattern) rendered as solid color
- SmartArt rendered as plain text extraction

## **5.5 PDF → DOCX (pdfium-render + lopdf + docx-rs)**

**Pipeline**

- pdfium-render extracts structured text with position data per page
- Text blocks grouped into paragraphs by Y-coordinate proximity
- Embedded images extracted via lopdf XObject enumeration
- docx-rs document constructed: paragraphs, runs, inline images
- Output saved as .docx

**Notes**

- Scanned PDFs (no text layer) automatically trigger OCR via leptess before extraction
- Table detection uses column alignment heuristics - accuracy depends on PDF structure

## **5.6 PDF → XLSX (pdfium-render + umya-spreadsheet)**

**Pipeline**

- Text with coordinates extracted from each PDF page
- Column detection via X-position clustering (k-means with k=auto)
- Row detection via Y-position grouping
- Cell values assigned to grid positions
- umya-spreadsheet creates XLSX with detected table data

**Notes**

- Best results on PDFs that originally contained native tables
- Scanned PDFs use OCR text before table detection

## **5.7 PDF → PPTX (pdfium-render + quick-xml + zip)**

- Each PDF page rasterized to high-res PNG (150 dpi) via pdfium-render
- Each PNG embedded as a full-slide image in a PPTX ZIP archive
- PPTX XML skeleton created programmatically with quick-xml
- Output preserves page aspect ratio as slide dimensions
- Note: This is image-based conversion - text is not selectable in output

## **5.8 Images → PDF (image + printpdf)**

- Supports JPEG, PNG, WebP, TIFF, BMP, GIF input
- Each image decoded with the image crate, embedded as XObject in printpdf
- Page size options: match image, A4, Letter, or custom
- Margin, orientation, and multi-image-per-page grid layout supported
- Auto-rotation based on EXIF orientation tag

## **5.9 HTML → PDF (custom renderer + printpdf)**

- Basic HTML parsed with html5ever (pure Rust)
- CSS property subset: font, color, background, padding, margin, border
- Block and inline layout model implemented in Rust
- Images (img src) decoded and embedded
- Links preserved as PDF annotations
- Complex CSS (flexbox, grid, animations) not supported - best for simple documents

# **6\. CLI Design (localpdf-cli)**

## **6.1 Philosophy**

The CLI is a first-class product, not an afterthought. It is designed for power users, automation scripts, CI/CD pipelines, and batch processing. The UX is inspired by modern CLIs like fd, bat, and ripgrep - rich output by default, machine-readable output with --json.

## **6.2 Binary Name and Entry Point**

localpdf \[COMMAND\] \[OPTIONS\] \[FILES...\]

The binary is named localpdf (or localpdf.exe on Windows). It is separate from the GUI app (localpdf-app). Both ship in the installer; localpdf is added to PATH.

## **6.3 Command Structure**

| **Command**      | **Alias** | **Description**                                 |
| ---------------- | --------- | ----------------------------------------------- |
| **merge**        | m         | Merge multiple PDFs into one                    |
| **split**        | sp        | Split a PDF by pages, ranges, or size           |
| **remove**       | rm        | Remove specific pages from a PDF                |
| **extract**      | ex        | Extract specific pages into a new PDF           |
| **organize**     | org       | Reorder and/or rotate pages                     |
| **compress**     | c         | Reduce PDF file size                            |
| **rotate**       | rot       | Rotate pages                                    |
| **watermark**    | wm        | Add text or image watermark                     |
| **page-numbers** | pn        | Add page numbers                                |
| **crop**         | \-        | Crop page margins                               |
| **ocr**          | \-        | Apply OCR to scanned PDFs                       |
| **protect**      | enc       | Encrypt PDF with AES-256 password               |
| **unlock**       | dec       | Remove password from PDF                        |
| **repair**       | \-        | Attempt to repair a corrupt PDF                 |
| **convert**      | cv        | Convert between PDF and other formats           |
| **info**         | \-        | Display PDF metadata and page info              |
| **completions**  | \-        | Generate shell completions (bash/zsh/fish/pwsh) |

## **6.4 Global Flags**

| **Flag**         | **Short** | **Default** | **Description**                       |
| ---------------- | --------- | ----------- | ------------------------------------- |
| **\--output**    | \-o       | (derived)   | Output file or directory path         |
| **\--verbose**   | \-v       | false       | Print detailed progress               |
| **\--quiet**     | \-q       | false       | Suppress all output (exit code only)  |
| **\--json**      | \-J       | false       | Output result as JSON (for scripting) |
| **\--no-color**  | \-        | false       | Disable ANSI color output             |
| **\--threads**   | \-T       | CPU count   | Rayon thread pool size for batch ops  |
| **\--timeout**   | \-        | 300s        | Max seconds per operation             |
| **\--overwrite** | \-        | false       | Overwrite output if it already exists |

## **6.5 Command Examples**

**Merge**

localpdf merge report.pdf appendix.pdf -o final.pdf

localpdf merge \*.pdf -o combined.pdf --verbose

**Split**

localpdf split big.pdf --ranges 1-5,6-10,11- -o ./parts/

localpdf split big.pdf --every 10 -o ./chunks/

localpdf split big.pdf --size 5MB -o ./parts/

**Compress**

localpdf compress report.pdf -o small.pdf --level balanced

localpdf compress \*.pdf --level high --overwrite # batch

**Convert**

localpdf convert invoice.pdf --to docx -o invoice.docx

localpdf convert scan.pdf --to png --dpi 300 -o ./images/

localpdf convert \*.jpg --to pdf -o photos.pdf

localpdf convert report.docx --to pdf -o report.pdf

**OCR**

localpdf ocr scan.pdf --lang eng+tur -o searchable.pdf

**Batch with JSON output**

localpdf compress \*.pdf --level max --json | jq '.\[\].size_reduction_pct'

**Info**

localpdf info document.pdf

localpdf info document.pdf --json

## **6.6 Terminal UX Details**

**Progress Display (indicatif)**

- Single file: animated spinner with elapsed time and operation name
- Batch: multi-bar with per-file progress + overall ETA
- OCR: page-level progress bar (1/12 pages... 42%)
- Automatically hidden when stdout is not a TTY (piped output)

**Result Summary**

- On success: green checkmark, output path, file size, processing time
- On error: red X, error message, suggested fix if known
- Batch summary: N succeeded, M failed, total time

**Color Scheme**

- Success indicators: green (owo-colors)
- Warnings: yellow
- Errors: red
- Paths: cyan
- Sizes / numbers: blue
- \--no-color strips all ANSI codes (CI-safe)

## **6.7 Shell Completions**

localpdf completions bash >> ~/.bash_completion.d/localpdf

localpdf completions zsh > ~/.zsh/completions/\_localpdf

localpdf completions fish > ~/.config/fish/completions/localpdf.fish

localpdf completions powershell > localpdf.ps1

clap_complete crate generates completions at runtime. Installer scripts run this automatically on supported shells.

# **7\. Tauri App Architecture (localpdf-app)**

## **7.1 Tauri Commands**

Every PDF operation is exposed as a Tauri command. The JS frontend calls invoke('command_name', payload) and receives a Result&lt;JobOutput, String&gt;.

| **Command**           | **Payload Type** | **Return Type**      | **Description**                    |
| --------------------- | ---------------- | -------------------- | ---------------------------------- |
| **pdf_merge**         | MergeOpts        | JobOutput            | Merge PDFs                         |
| **pdf_split**         | SplitOpts        | Vec&lt;JobOutput&gt; | Split PDF                          |
| **pdf_remove_pages**  | RemoveOpts       | JobOutput            | Remove pages                       |
| **pdf_extract_pages** | ExtractOpts      | JobOutput            | Extract pages                      |
| **pdf_organize**      | OrganizeOpts     | JobOutput            | Reorder/rotate pages               |
| **pdf_compress**      | CompressOpts     | JobOutput            | Compress                           |
| **pdf_rotate**        | RotateOpts       | JobOutput            | Rotate pages                       |
| **pdf_watermark**     | WatermarkOpts    | JobOutput            | Add watermark                      |
| **pdf_page_numbers**  | PageNumOpts      | JobOutput            | Add page numbers                   |
| **pdf_crop**          | CropOpts         | JobOutput            | Crop margins                       |
| **pdf_ocr**           | OcrOpts          | JobOutput            | Apply OCR                          |
| **pdf_protect**       | ProtectOpts      | JobOutput            | Encrypt PDF                        |
| **pdf_unlock**        | UnlockOpts       | JobOutput            | Decrypt PDF                        |
| **pdf_repair**        | RepairOpts       | JobOutput            | Repair PDF                         |
| **convert_any**       | ConvertOpts      | JobOutput            | Any format conversion              |
| **pdf_info**          | PathOpts         | PdfInfo              | Get PDF metadata                   |
| **pdf_thumbnail**     | ThumbnailOpts    | Vec&lt;u8&gt;        | Render page thumbnail as PNG bytes |
| **get_temp_dir**      | -                | String               | Current temp dir path              |
| **clean_temp**        | -                | ()                   | Delete all temp files              |
| **app_version**       | -                | String               | App version string                 |

## **7.2 Progress Events**

Long operations emit Tauri events from the Rust backend. The JS frontend listens with listen('progress', handler).

// Rust side (localpdf-app/src/commands/mod.rs)

app.emit("progress", ProgressPayload {

job_id: job_id.to_string(),

percent: 42,

message: "Processing page 5 of 12...".into(),

stage: "ocr".into(),

});

// JS side (ui/src/hooks/useJob.ts)

const unlisten = await listen&lt;ProgressPayload&gt;('progress', (event) => {

setProgress(event.payload.percent);

setMessage(event.payload.message);

});

## **7.3 App State**

Tauri's managed state (tauri::State&lt;Mutex<AppState&gt;>) holds:

| **active_jobs** | HashMap&lt;JobId, JobHandle&gt; - cancellation handles for running operations |
| --------------- | ----------------------------------------------------------------------------- |
| **temp_dir**    | PathBuf - app-scoped temp directory, cleaned on exit                          |
| **settings**    | AppSettings - persisted to app data dir via serde_json                        |
| **ocr_lang**    | String - active Tesseract language (default: 'eng')                           |

## **7.4 File Handling in Tauri v2**

**Input**

- tauri-plugin-dialog opens native file pickers - returns Vec&lt;PathBuf&gt; to Rust
- DnD: tauri-plugin-drag-drop intercepts drop events - passes file paths to Rust command
- Files are never passed through the JS layer as bytes - only paths are transferred

**Output**

- Rust writes output to temp_dir/{job_id}/
- On success, JS receives the output path and calls dialog.save() for user-chosen destination
- fs::copy() in Rust copies temp output to final destination
- Native notification sent via tauri-plugin-notification

# **8\. Frontend Design (React + shadcn/ui)**

## **8.1 Technology Stack**

| **React 18 + TypeScript** | UI framework with strict TypeScript                         |
| ------------------------- | ----------------------------------------------------------- |
| **Vite 5**                | Build tool - fast HMR in dev, optimized bundle for prod     |
| **Tailwind CSS v4**       | Utility-first CSS - v4's new Rust-based engine (oxide)      |
| **shadcn/ui**             | Unstyled accessible component library built on Radix UI     |
| **Framer Motion**         | Declarative animation library for React                     |
| **Zustand**               | Lightweight global state (tool state, settings, active job) |
| **TanStack Query v5**     | Async state management for Tauri commands                   |
| **react-dropzone**        | File drag-and-drop zone component                           |
| **@radix-ui/react-\***    | Accessible primitive components (via shadcn/ui)             |
| **lucide-react**          | Icon set (consistent with shadcn/ui)                        |
| **react-pdf (PDF.js)**    | PDF page preview in the browser context                     |
| **react-router-dom v6**   | SPA routing - one route per tool                            |
| **cmdk**                  | Command palette (Cmd+K tool search)                         |
| **sonner**                | Toast notification library (shadcn/ui compatible)           |
| **@tanstack/react-table** | Headless table (for file lists, metadata display)           |
| **clsx + tailwind-merge** | Conditional class management                                |

## **8.2 Design System**

**Color Tokens (Tailwind v4 CSS variables)**

| **Token**                | **Light** | **Dark** | **Usage**                      |
| ------------------------ | --------- | -------- | ------------------------------ |
| **\--color-background**  | #FFFFFF   | #09090B  | App background                 |
| **\--color-foreground**  | #09090B   | #FAFAFA  | Primary text                   |
| **\--color-card**        | #FFFFFF   | #18181B  | Tool cards, panels             |
| **\--color-primary**     | #7C3AED   | #8B5CF6  | Primary actions, active states |
| **\--color-primary-fg**  | #FFFFFF   | #FFFFFF  | Text on primary                |
| **\--color-muted**       | #F4F4F5   | #27272A  | Subtle backgrounds             |
| **\--color-muted-fg**    | #71717A   | #A1A1AA  | Placeholder, secondary text    |
| **\--color-border**      | #E4E4E7   | #27272A  | Borders, dividers              |
| **\--color-success**     | #16A34A   | #22C55E  | Success states                 |
| **\--color-destructive** | #DC2626   | #EF4444  | Error states, delete actions   |
| **\--radius**            | 0.625rem  | 0.625rem | Border radius base             |

**Typography**

- Font: Geist Sans (variable, self-hosted - no Google Fonts call)
- Monospace: Geist Mono (for file paths, JSON output)
- Scale: Tailwind v4 defaults - text-sm (14px) for labels, text-base (16px) for body

## **8.3 Application Layout**

The app uses a persistent sidebar layout - sidebar stays visible across tool navigation.

**Sidebar**

- Logo + app version at top
- Tool categories as collapsible groups (Organize, Convert, Edit, Security, Utility)
- Each tool as a sidebar item with icon and label
- Active tool highlighted with primary color left border
- Bottom: Settings icon, theme toggle (light/dark), CLI helper link
- Cmd+K (or Ctrl+K) opens a command palette for fuzzy tool search

**Main Content Area**

- Breadcrumb header: Home > Category > Tool Name
- Tool title, one-line description, and a 'How it works' expandable tooltip
- File drop zone (full-width, dashed border, animated on hover/drag)
- Options panel (tool-specific settings)
- Action button (large, primary color)
- Job status area (progress bar + message when processing)
- Result card (file info, download/save button, preview toggle)

## **8.4 Key UI Components**

| **Component**                   | **Description**                                                                | **Animation**                                     |
| ------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| **&lt;DropZone&gt;**            | Full-width file drop area with DnD support and file picker fallback            | Scale + border-color on drag-over (Framer Motion) |
| **&lt;FileCard&gt;**            | Displays uploaded file: name, size, page count (PDF), thumbnail, remove button | Fade-in slide-up on mount                         |
| **&lt;FileList&gt;**            | Sortable list of files for multi-file tools (merge, organize)                  | Drag reorder with @dnd-kit, animated swap         |
| **&lt;PageGrid&gt;**            | Thumbnail grid of PDF pages for organize/remove/extract tools                  | Stagger fade-in for thumbnails                    |
| **&lt;PageThumb&gt;**           | Single PDF page thumbnail (rendered via pdf_thumbnail command)                 | Lazy-loaded, blur placeholder                     |
| **&lt;ProgressCard&gt;**        | Processing status: animated progress bar, stage label, cancel button           | Smooth width transition                           |
| **&lt;ResultCard&gt;**          | Success state: file info, size delta badge, save button, preview               | Spring bounce on appear                           |
| **&lt;CompressLevelSlider&gt;** | Custom slider for compression level with before/after size preview             | Smooth thumb drag                                 |
| **&lt;WatermarkPreview&gt;**    | Live preview of watermark position/opacity on PDF page                         | Debounced re-render                               |
| **&lt;CommandPalette&gt;**      | Cmd+K modal for tool search, recent files, quick actions                       | Fade + scale dialog                               |
| **&lt;SettingsDrawer&gt;**      | Slide-in drawer for app-level settings                                         | Framer Motion slide from right                    |
| **&lt;ThumbCarousel&gt;**       | Horizontal scrollable page preview for split/extract result                    | Spring scroll snap                                |

## **8.5 Motion Principles (Framer Motion)**

- Enter animations: fade + translateY(8px) → 0, duration 150ms, ease-out
- Exit animations: fade, duration 100ms
- Page transitions: cross-fade between tool routes, duration 200ms
- Progress bar: spring physics, stiffness 200, damping 30
- Success state: scale 1.02 → 1.0 spring bounce on result card appearance
- Reduced motion: all animations respect prefers-reduced-motion media query
- Stagger: file cards and page thumbnails stagger by 50ms per item

## **8.6 Tauri Invoke Layer (ui/src/lib/tauri.ts)**

All Tauri command calls are centralized in a typed wrapper module. The JS never calls invoke() directly - it uses the typed functions:

export async function mergePdfs(opts: MergeOpts): Promise&lt;JobOutput&gt; {

return await invoke&lt;JobOutput&gt;('pdf_merge', { opts });

}

TanStack Query v5 wraps these functions as mutations. This handles loading state, error state, and retry logic automatically - no manual useState for async ops.

# **9\. Tool Modules**

All 25 tools are implemented in localpdf-core and exposed via both CLI and Tauri commands. The table below maps each tool to its core module, Tauri command, and CLI subcommand.

| **Tool**             | **Category** | **Core Module**        | **Tauri Command** | **CLI Subcommand** |
| -------------------- | ------------ | ---------------------- | ----------------- | ------------------ |
| **Merge PDF**        | Organize     | tools::merge           | pdf_merge         | merge              |
| **Split PDF**        | Organize     | tools::split           | pdf_split         | split              |
| **Remove Pages**     | Organize     | tools::remove_pages    | pdf_remove_pages  | remove             |
| **Extract Pages**    | Organize     | tools::extract_pages   | pdf_extract_pages | extract            |
| **Organize Pages**   | Organize     | tools::organize        | pdf_organize      | organize           |
| **Compress PDF**     | Optimize     | tools::compress        | pdf_compress      | compress           |
| **Rotate PDF**       | Edit         | tools::rotate          | pdf_rotate        | rotate             |
| **Add Watermark**    | Edit         | tools::watermark       | pdf_watermark     | watermark          |
| **Add Page Numbers** | Edit         | tools::page_numbers    | pdf_page_numbers  | page-numbers       |
| **Crop PDF**         | Edit         | tools::crop            | pdf_crop          | crop               |
| **OCR PDF**          | Edit         | tools::ocr             | pdf_ocr           | ocr                |
| **Protect PDF**      | Security     | tools::protect         | pdf_protect       | protect            |
| **Unlock PDF**       | Security     | tools::unlock          | pdf_unlock        | unlock             |
| **Repair PDF**       | Utility      | tools::repair          | pdf_repair        | repair             |
| **PDF → Word**       | Convert      | convert::pdf_to_docx   | convert_any       | convert --to docx  |
| **PDF → Excel**      | Convert      | convert::pdf_to_xlsx   | convert_any       | convert --to xlsx  |
| **PDF → PowerPoint** | Convert      | convert::pdf_to_pptx   | convert_any       | convert --to pptx  |
| **PDF → JPG**        | Convert      | convert::pdf_to_images | convert_any       | convert --to jpg   |
| **PDF → PNG**        | Convert      | convert::pdf_to_images | convert_any       | convert --to png   |
| **PDF → HTML**       | Convert      | convert::pdf_to_html   | convert_any       | convert --to html  |
| **Word → PDF**       | Convert      | convert::docx_to_pdf   | convert_any       | convert --to pdf   |
| **Excel → PDF**      | Convert      | convert::xlsx_to_pdf   | convert_any       | convert --to pdf   |
| **PowerPoint → PDF** | Convert      | convert::pptx_to_pdf   | convert_any       | convert --to pdf   |
| **Images → PDF**     | Convert      | convert::images_to_pdf | convert_any       | convert --to pdf   |
| **HTML → PDF**       | Convert      | convert::html_to_pdf   | convert_any       | convert --to pdf   |

# **10\. Security**

## **10.1 Zero Network Attack Surface**

LocalPDF v4.0 makes zero network connections during normal operation. No ports are opened. No HTTP server exists. DNS is never queried for PDF processing. The only network activity is the optional auto-update check (user-initiated or on startup, can be disabled in settings).

## **10.2 Tauri v2 Security Model**

| **Control**                              | **Setting**                                    | **Effect**                                   |
| ---------------------------------------- | ---------------------------------------------- | -------------------------------------------- |
| **CSP**                                  | default-src 'self'; script-src 'self'          | Prevents XSS from injecting external scripts |
| **allowlist (fs)**                       | Scoped to temp dir and user-chosen paths only  | JS cannot read arbitrary filesystem paths    |
| **allowlist (shell)**                    | Disabled                                       | No shell command execution from JS           |
| **allowlist (http)**                     | Disabled                                       | No outbound HTTP from JS context             |
| **dangerousDisableAssetCspModification** | false                                          | CSP cannot be weakened at runtime            |
| **updater endpoint**                     | HTTPS GitHub Releases only, verified signature | Update packages are signature-verified       |

## **10.3 PDF Encryption**

PDF protect uses AES-256-CBC encryption implemented via the aes and cbc Rust crates (pure Rust, no OpenSSL dependency). Key derivation uses PBKDF2-SHA256 with 100,000 iterations via the pbkdf2 crate.

## **10.4 File System Safety (Rust Side)**

- All input paths normalized with std::fs::canonicalize() before use
- Output paths validated to be inside the app temp directory
- symlink_metadata() used to detect and reject symbolic link traversal attempts
- File size check before processing - LpError::FileTooLarge returned for files > 500 MB

# **11\. Performance**

## **11.1 Startup Time**

| **Cold start (first launch)** | < 1 second (Tauri + OS webview - no Chromium bundle) |
| ----------------------------- | ---------------------------------------------------- |
| **Warm start**                | < 500ms                                              |
| **First PDF operation**       | < 200ms additional (PDFium already loaded)           |

## **11.2 Operation Performance Targets**

| **Operation**          | **Input**           | **Target** | **Parallelism**         |
| ---------------------- | ------------------- | ---------- | ----------------------- |
| **Merge**              | 10x 5 MB PDFs       | < 2s       | rayon page-level        |
| **Split (100 pages)**  | 50 MB PDF           | < 1.5s     | rayon page-level        |
| **Compress**           | 20 MB PDF, balanced | < 6s       | rayon per image stream  |
| **Rotate (50 pages)**  | 25 MB PDF           | < 800ms    | rayon page-level        |
| **PDF → JPG (300dpi)** | 10-page PDF         | < 3s       | rayon per page          |
| **PDF → DOCX**         | 10-page text PDF    | < 4s       | single-threaded         |
| **DOCX → PDF**         | 20-page document    | < 3s       | single-threaded         |
| **OCR**                | 10-page scan        | < 25s      | leptess per page, rayon |
| **Watermark**          | 100-page PDF        | < 3s       | rayon per page          |

## **11.3 Memory**

| **Tauri main process (idle)**  | < 30 MB                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| **OS webview (React UI idle)** | < 80 MB                                                     |
| **Total idle**                 | < 110 MB                                                    |
| **Peak during large compress** | < 500 MB (image buffers in memory)                          |
| **Streaming strategy**         | PDFs processed page-by-page where possible to cap RAM usage |

# **12\. Packaging and Distribution**

## **12.1 Build System**

Tauri CLI (cargo tauri build) handles the full build pipeline. GitHub Actions matrix builds for all platforms simultaneously.

| **Step**                       | **Tool**                                 | **Output**                                                |
| ------------------------------ | ---------------------------------------- | --------------------------------------------------------- |
| **1\. Compile Rust workspace** | cargo build --release                    | localpdf-core.rlib + localpdf-cli + localpdf-app binaries |
| **2\. Bundle frontend**        | vite build                               | ui/dist/ - optimized React bundle                         |
| **3\. Package Tauri app**      | cargo tauri build                        | Platform installer                                        |
| **4\. Sign installer**         | platform code signing tools (CI secrets) | Signed installer                                          |
| **5\. Upload to releases**     | GitHub Actions                           | GitHub Releases assets                                    |

## **12.2 Platform Installers**

| **Platform**            | **Format**      | **Installer UX**                                                    | **CLI on PATH?**                      |
| ----------------------- | --------------- | ------------------------------------------------------------------- | ------------------------------------- |
| **Windows 10/11 x64**   | NSIS .exe + MSI | Standard setup wizard, Start Menu shortcut, Desktop icon            | Yes - added to user PATH by installer |
| **macOS 12+ Universal** | DMG + pkg       | Drag to Applications; pkg optionally installs CLI to /usr/local/bin | Optional (installer asks)             |
| **Ubuntu 22.04+ x64**   | AppImage + .deb | AppImage: chmod+x and run; .deb: dpkg-install; desktop entry added  | Yes - /usr/local/bin via .deb         |
| **Fedora 38+ x64**      | .rpm            | rpm -i; desktop entry added                                         | Yes - /usr/local/bin                  |

## **12.3 Installer Contents**

| **localpdf-app binary**     | The Tauri desktop app - OS webview not bundled                          |
| --------------------------- | ----------------------------------------------------------------------- |
| **localpdf (CLI binary)**   | Standalone CLI tool                                                     |
| **Tesseract language data** | eng.traineddata + tur.traineddata (~15 MB total, bundled in resources/) |
| **App icon + metadata**     | Platform-appropriate icon sizes and desktop entry                       |
| **No Python runtime**       | REMOVED                                                                 |
| **No Node.js runtime**      | REMOVED                                                                 |
| **No LibreOffice**          | REMOVED                                                                 |
| **No Ghostscript**          | REMOVED                                                                 |

## **12.4 Estimated Install Size**

| **localpdf-app binary (stripped)** | ~25-35 MB (includes PDFium, Tesseract static) |
| ---------------------------------- | --------------------------------------------- |
| **localpdf CLI binary (stripped)** | ~20-30 MB                                     |
| **Tesseract language data**        | ~15 MB                                        |
| **Total on-disk after install**    | ~60-80 MB                                     |
| **Installer download size**        | ~35-50 MB (NSIS / DMG compressed)             |
| **vs. v3.0 total install**         | ~578 MB → ~70 MB (~88% smaller)               |

## **12.5 Auto-Update**

| **Plugin**        | tauri-plugin-updater                                                         |
| ----------------- | ---------------------------------------------------------------------------- |
| **Update source** | GitHub Releases - platform-specific installer asset                          |
| **Check trigger** | On app startup (optional, configurable in settings) + Settings menu          |
| **User flow**     | Banner appears → 'Update Now' → download + verify signature → restart prompt |
| **Signature**     | Ed25519 signature on update artifacts (Tauri built-in)                       |
| **CLI update**    | localpdf --self-update (downloads latest CLI binary from GitHub Releases)    |

# **13\. Testing Strategy**

## **13.1 localpdf-core Unit Tests**

- Standard Rust #\[test\] and #\[cfg(test)\] modules in each tool module
- Fixture PDFs in crates/localpdf-core/tests/fixtures/ - covers normal, corrupt, encrypted, scanned, large inputs
- Each tool tested for: happy path, error paths, edge cases (empty PDF, 1-page PDF, 1000-page PDF, right-to-left text for OCR)
- Compression: verify output is smaller than input for all levels
- Encryption: verify encrypted PDF cannot be opened without password; decryption with correct password succeeds
- Coverage target: 85%+ line coverage (cargo-llvm-cov)

## **13.2 CLI Integration Tests**

- assert_cmd crate: spawn localpdf binary in tests, check exit codes, stdout/stderr
- All 25 subcommands tested with at least one valid invocation and one error invocation
- JSON output (--json flag): output parsed and validated against expected schema
- Batch processing: multiple files, verify all outputs created

## **13.3 Tauri Command Tests**

- Tauri provides a test harness (tauri::test::mock_app()) for command unit tests
- Each command tested: valid input produces JobOutput, invalid input returns LpError
- Progress event emission verified with a mock event listener

## **13.4 Frontend Tests**

- Vitest + React Testing Library for component unit tests
- Tauri invoke() mocked via vi.mock('@tauri-apps/api/core')
- Key flows tested: file drop, options change, job start, progress update, result save
- Framer Motion animations skipped in tests (jest-framer-motion mock)

## **13.5 End-to-End Tests**

- WebdriverIO + tauri-driver: launches real Tauri app, drives real UI interactions
- Full flow: file open dialog simulated → process → save dialog simulated → output verified
- Platform matrix on GitHub Actions: ubuntu-latest, windows-latest, macos-latest
- OCR E2E test uses a known scan fixture and verifies extracted text contains expected keywords

# **14\. Development Environment**

## **14.1 Prerequisites**

| **Tool**           | **Version**                                 | **Purpose**                          |
| ------------------ | ------------------------------------------- | ------------------------------------ |
| **Rust toolchain** | stable (1.78+) via rustup                   | Compile all crates                   |
| **Node.js**        | v20 LTS+                                    | Build React frontend (dev + prod)    |
| **Tauri CLI**      | v2 (cargo install tauri-cli --version '^2') | Dev server + build                   |
| **LLVM / clang**   | v16+ (platform package manager)             | Required to build leptess static     |
| **cargo-llvm-cov** | latest                                      | Code coverage (optional)             |
| **cargo-cross**    | latest                                      | Cross-compilation (optional, for CI) |
| **System webview** | Pre-installed on all supported OS versions  | Runtime (not bundled)                |

**macOS additional**

- Xcode Command Line Tools: xcode-select --install
- Universal binary: rustup target add aarch64-apple-darwin x86_64-apple-darwin

**Windows additional**

- Visual Studio Build Tools with C++ workload
- WebView2 Runtime (pre-installed on Windows 10 1803+ and Windows 11)

**Linux additional**

- sudo apt install libwebkit2gtk-4.1-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
- For leptess static: sudo apt install libleptonica-dev libtesseract-dev

## **14.2 Running in Development**

- git clone ... && cd localpdf
- npm install (installs Vite + frontend deps)
- cargo tauri dev (starts Vite HMR + Rust backend with hot-recompile)

cargo tauri dev watches both the Rust source and the Vite dev server. Rust changes trigger recompile and app restart; frontend changes hot-reload in the webview.

## **14.3 CLI Development**

cargo run -p localpdf-cli -- merge a.pdf b.pdf -o out.pdf

cargo run -p localpdf-cli -- compress big.pdf --level max --verbose

cargo test -p localpdf-core # run core unit tests

## **14.4 Build Scripts**

| **cargo tauri dev**                | Dev mode - Vite HMR + Rust hot-recompile          |
| ---------------------------------- | ------------------------------------------------- |
| **cargo tauri build**              | Production build - all platforms                  |
| **cargo tauri build --target ...** | Target-specific build (e.g. aarch64-apple-darwin) |
| **cargo build -p localpdf-cli**    | Build CLI only                                    |
| **cargo test --workspace**         | Run all tests                                     |
| **cargo llvm-cov --workspace**     | Coverage report                                   |
| **npm run type-check**             | TypeScript type check (no emit)                   |
| **npm run lint**                   | ESLint + Prettier                                 |
| **npm run build**                  | Vite production build only                        |

# **15\. Development Roadmap**

## **Phase 1 - Core Infrastructure**

- Cargo workspace setup + localpdf-core skeleton
- pdfium-render + lopdf integration with static PDFium
- Merge, Split, Remove Pages, Extract Pages, Organize - all using pdfium-render
- Compress pipeline (image recompression + stream deflate)
- Basic CLI with clap: merge, split, compress, rotate, info
- Tauri app skeleton: sidebar layout, DropZone, ProgressCard, ResultCard
- Automated GitHub Actions build for Windows + macOS + Linux

## **Phase 2 - Full Tool Set**

- Rotate, Watermark, Page Numbers, Crop - lopdf content stream manipulation
- Protect / Unlock - AES-256 via aes + pbkdf2 crates
- Repair - lopdf cross-reference rebuild
- OCR - leptess static with bundled eng + tur data
- PDF → JPG/PNG via pdfium-render rasterization
- Images → PDF via printpdf + image crate
- All 25 CLI subcommands complete with --json and progress bars
- Complete shadcn/ui frontend for all 25 tools

## **Phase 3 - Office Conversions**

- DOCX → PDF (docx-rs + printpdf)
- XLSX → PDF (calamine + printpdf)
- PPTX → PDF (quick-xml + zip + printpdf)
- PDF → DOCX (pdfium text extraction + docx-rs)
- PDF → XLSX (table detection + umya-spreadsheet)
- PDF → PPTX (page rasterization + PPTX ZIP)
- HTML → PDF (html5ever + printpdf)

## **Phase 4 - Polish and Advanced Features**

- Command palette (Cmd+K) with fuzzy tool search and recent files
- Settings panel: default output dir, compression defaults, OCR language, theme
- PDF preview panel: page navigation, zoom, text layer toggle
- Batch mode in GUI: apply same operation to multiple files from a folder
- localpdf --self-update CLI auto-update
- Shell completions auto-install in installer

# **16\. Open Issues**

| **Issue**                                    | **Risk** | **Candidate Resolution**                                                                            |
| -------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| **PDFium static binary size**                | Medium   | PDFium alone adds ~15 MB to binary - acceptable; consider lazy-loading for future                   |
| **leptess LLVM build requirement**           | Medium   | CI matrix must install LLVM; document for contributors; user is not affected                        |
| **DOCX → PDF layout fidelity**               | High     | Complex Word docs may render differently - add a 'conversion note' in the UI warning users          |
| **PPTX → PDF text positioning**              | High     | Absolute positioning from slide XML may drift - test extensively with diverse PPTX samples          |
| **calamine formula evaluation**              | Medium   | Only simple formulas evaluated; complex ones show raw formula string - document limitation          |
| **html5ever CSS subset**                     | Medium   | Only basic CSS supported - label tool as 'simple HTML' in UI                                        |
| **leptess language data bundle size**        | Low      | eng+tur = ~15 MB; additional language packs available as optional downloads                         |
| **WebKitGTK version on older Linux distros** | Medium   | Tauri v2 requires libwebkit2gtk-4.1; Ubuntu 20.04 needs manual upgrade - document                   |
| **Windows WebView2 on LTSC editions**        | Low      | WebView2 pre-installed on Win 10 1803+; LTSC users may need manual install - add to installer check |
| **Parallel OCR memory usage**                | Medium   | leptess per-page rayon parallelism may spike RAM on 100+ page docs - implement page-batch strategy  |

# **Appendix A: Full Dependency List**

## **A.1 Rust Crates (localpdf-core)**

| **Crate**            | **Version** | **Type**  | **Purpose**                                 |
| -------------------- | ----------- | --------- | ------------------------------------------- |
| **pdfium-render**    | ^0.8        | Static C  | PDFium bindings - render, save, page ops    |
| **lopdf**            | ^0.34       | Pure Rust | Low-level PDF object manipulation           |
| **printpdf**         | ^0.7        | Pure Rust | PDF generation from scratch                 |
| **image**            | ^0.25       | Pure Rust | Image decode/encode (JPEG, PNG, WebP, TIFF) |
| **oxipng**           | ^9          | Pure Rust | PNG stream optimization                     |
| **leptess**          | ^0.14       | Static C  | Tesseract OCR + Leptonica                   |
| **docx-rs**          | ^0.4        | Pure Rust | DOCX read/write                             |
| **calamine**         | ^0.26       | Pure Rust | Excel XLSX/XLS/ODS read                     |
| **umya-spreadsheet** | ^2          | Pure Rust | XLSX write                                  |
| **quick-xml**        | ^0.36       | Pure Rust | XML parse (PPTX/DOCX/XLSX internals)        |
| **zip**              | ^2          | Pure Rust | ZIP archive (Office formats)                |
| **html5ever**        | ^0.27       | Pure Rust | HTML parsing                                |
| **flate2**           | ^1          | Pure Rust | zlib/deflate compression streams            |
| **rayon**            | ^1          | Pure Rust | Data parallelism                            |
| **tokio**            | ^1          | Pure Rust | Async runtime (Tauri integration)           |
| **serde**            | ^1          | Pure Rust | Serialization framework                     |
| **serde_json**       | ^1          | Pure Rust | JSON serialization                          |
| **anyhow**           | ^1          | Pure Rust | Error context chaining                      |
| **thiserror**        | ^1          | Pure Rust | Error enum derive macro                     |
| **aes**              | ^0.8        | Pure Rust | AES-256-CBC for PDF encryption              |
| **cbc**              | ^0.1        | Pure Rust | CBC mode for AES                            |
| **pbkdf2**           | ^0.12       | Pure Rust | Key derivation for PDF passwords            |
| **rand**             | ^0.8        | Pure Rust | CSPRNG for salt generation                  |
| **fontdb**           | ^0.22       | Pure Rust | Font database for text layout               |
| **rusttype**         | ^0.9        | Pure Rust | Font metrics and glyph layout               |
| **tempfile**         | ^3          | Pure Rust | Secure temp file / dir creation             |
| **uuid**             | ^1          | Pure Rust | UUID v4 for job IDs                         |
| **walkdir**          | ^2          | Pure Rust | Recursive directory traversal               |
| **bytesize**         | ^1          | Pure Rust | Human-readable file size formatting         |

## **A.2 Rust Crates (localpdf-cli only)**

| **Crate**         | **Version** | **Purpose**                               |
| ----------------- | ----------- | ----------------------------------------- |
| **clap**          | ^4          | CLI argument parsing with derive macros   |
| **indicatif**     | ^0.17       | Progress bars and spinners                |
| **owo-colors**    | ^4          | ANSI color output                         |
| **comfy-table**   | ^7          | Terminal table rendering for info command |
| **clap_complete** | ^4          | Shell completion generation               |
| **human-panic**   | ^2          | User-friendly panic messages              |

## **A.3 Rust Crates (localpdf-app / Tauri only)**

| **Crate / Plugin**            | **Version** | **Purpose**                                  |
| ----------------------------- | ----------- | -------------------------------------------- |
| **tauri**                     | ^2          | Desktop app framework                        |
| **tauri-build**               | ^2          | Build script                                 |
| **tauri-plugin-dialog**       | ^2          | Native file open/save dialogs                |
| **tauri-plugin-fs**           | ^2          | Sandboxed file system access                 |
| **tauri-plugin-notification** | ^2          | Native desktop notifications                 |
| **tauri-plugin-updater**      | ^2          | Auto-update from GitHub Releases             |
| **tauri-plugin-drag-drop**    | ^2          | DnD file path interception                   |
| **serde**                     | ^1          | Serialize/deserialize Tauri command payloads |
| **tokio**                     | ^1          | Async runtime for Tauri commands             |

## **A.4 npm / Frontend Dependencies**

| **Package**                         | **Version** | **Purpose**                             |
| ----------------------------------- | ----------- | --------------------------------------- |
| **react + react-dom**               | ^18         | UI framework                            |
| **react-router-dom**                | ^6          | SPA routing                             |
| **@tauri-apps/api**                 | ^2          | Tauri invoke / listen / dialog wrappers |
| **@tauri-apps/plugin-dialog**       | ^2          | Dialog JS bindings                      |
| **@tauri-apps/plugin-fs**           | ^2          | File system JS bindings                 |
| **@tauri-apps/plugin-notification** | ^2          | Notification JS bindings                |
| **tailwindcss**                     | ^4          | Utility-first CSS (v4 oxide engine)     |
| **shadcn/ui (components)**          | latest      | Radix UI-based accessible components    |
| **@radix-ui/react-\***              | ^1          | Accessible primitive components         |
| **framer-motion**                   | ^11         | Animation library                       |
| **zustand**                         | ^4          | Global state management                 |
| **@tanstack/react-query**           | ^5          | Async state for Tauri commands          |
| **react-dropzone**                  | ^14         | File DnD zone                           |
| **react-pdf**                       | ^9          | PDF.js preview in webview               |
| **cmdk**                            | ^1          | Command palette (Cmd+K)                 |
| **sonner**                          | ^1          | Toast notifications                     |
| **@tanstack/react-table**           | ^8          | Headless table for file lists           |
| **lucide-react**                    | ^0.400      | Icon set                                |
| **clsx**                            | ^2          | Conditional class names                 |
| **tailwind-merge**                  | ^2          | Tailwind class deduplication            |
| **vite**                            | ^5          | Build tool                              |
| **typescript**                      | ^5          | Type safety                             |
| **vitest**                          | ^1          | Unit test runner                        |
| **@testing-library/react**          | ^16         | React component testing                 |
| **webdriverio**                     | ^9          | E2E testing driver                      |

## **A.5 End-User System Requirements**

| **Platform** | **Minimum**                                       | **Notes**                                                                   |
| ------------ | ------------------------------------------------- | --------------------------------------------------------------------------- |
| **Windows**  | Windows 10 version 1803 (build 17134) - 64-bit    | WebView2 pre-installed; earlier Windows 10 needs WebView2 Runtime installer |
| **macOS**    | macOS 12 Monterey - Intel or Apple Silicon        | Universal binary runs natively on both architectures                        |
| **Linux**    | Ubuntu 22.04+ / Fedora 38+ with libwebkit2gtk-4.1 | Older distros may need libwebkit2gtk-4.1 manual install                     |
| **RAM**      | 2 GB minimum, 4 GB recommended                    | OCR on 100+ page documents benefits from 8 GB+                              |
| **Disk**     | 200 MB installation + temp space                  | Temp space = up to 3x largest input file size                               |
| **CPU**      | x86-64 (SSE2+) or ARM64                           | Rayon uses all available cores automatically                                |