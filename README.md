# 📄 PDFinity - Merge & Split PDFs Online

A professional, fully functional, and private PDF manipulation tool built with HTML, CSS, Bootstrap, and JavaScript. 

**PDFinity** runs 100% in your browser. Your files are never uploaded to any server, ensuring complete privacy and security.

## 🚀 Live Demo
[Link to your GitHub Pages URL here]

## ✨ Features

### 1. PDF Merger
- Upload multiple PDF files.
- **Drag & Drop** to reorder files.
- Preview file names and sizes.
- Combine all selected files into a single document.

### 2. PDF Splitter
- Split every page of a PDF into separate files (downloaded as a ZIP).
- Extract a **custom page range** (e.g., pages 1 to 5).
- Extract **specific pages** (e.g., 1, 3, 5-10).

### 3. UI/UX & Security
- **100% Client-Side**: No backend, no data leaves your machine.
- **Dark Mode**: Seamlessly toggle between light and dark themes.
- **Modern Design**: Built with Bootstrap 5 and custom CSS for a premium feel.
- **Responsive**: Works perfectly on desktops, tablets, and mobile devices.
- **Fast Performance**: Powered by `pdf-lib` for high-speed PDF processing.

## 🛠️ Built With
- **HTML5 & CSS3** (Custom glassmorphism & animations)
- **Bootstrap 5** (Responsive layout)
- **JavaScript (ES6+)**
- **[pdf-lib](https://pdf-lib.js.org/)** (PDF manipulation)
- **[SortableJS](https://sortablejs.github.io/Sortable/)** (Drag & drop reordering)
- **[JSZip](https://stuk.github.io/jszip/)** (Zipping multiple PDFs)

## 📂 Project Structure
- `index.html` - Landing page
- `merge.html` - PDF Merger tool
- `split.html` - PDF Splitter tool
- `styles.css` - Custom styles and Dark Mode logic
- `utils.js` - Shared utility functions (Toasts, Theme, File Helpers)
- `merge.js` - Logic for PDF merging
- `split.js` - Logic for PDF splitting

## 📖 How to Use
1. **Merge**: Go to the Merge page, drag and drop your PDFs, reorder them if needed, and click "Merge and Download".
2. **Split**: Go to the Split page, upload a PDF, choose your split method (all pages, range, or specific pages), and click "Split and Download".

## 🛡️ Privacy Policy
PDFinity does not collect, store, or share any of your data. All file processing happens locally in your browser's memory using JavaScript.

---
Built by [Your Name/GitHub Username]
