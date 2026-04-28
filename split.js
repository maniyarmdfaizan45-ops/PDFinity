/**
 * PDF Splitter Logic - Premium Version
 */

let selectedFile = null;
let pageCount = 0;

const dropZone = document.getElementById('drop-zone');
const initialDropZone = document.getElementById('initial-drop-zone');
const fileInput = document.getElementById('file-input');
const sidebar = document.getElementById('sidebar');
const previewContainer = document.getElementById('preview-container');
const pdfPreviewImg = document.getElementById('pdf-preview-img');
const totalPagesBadge = document.getElementById('total-pages-badge');
const fileNameDisplay = document.getElementById('file-name-display');
const fileSizeDisplay = document.getElementById('file-size-display');
const splitBtn = document.getElementById('split-btn');
const changeFileBtn = document.getElementById('change-file');
const progressBar = document.getElementById('split-progress');
const progressContainer = document.querySelector('.progress-container');

// Input Groups
const rangeInputGroup = document.getElementById('range-input-group');
const extractInputGroup = document.getElementById('extract-input-group');

// Event Listeners
dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

changeFileBtn.addEventListener('click', () => {
    fileInput.click();
});

// Custom Radio Logic
document.querySelectorAll('input[name="splitMethod"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        // Update active class on cards
        document.querySelectorAll('.custom-radio-card').forEach(card => {
            card.classList.remove('active');
        });
        e.target.closest('.custom-radio-card').classList.add('active');

        // Toggle input groups
        rangeInputGroup.classList.add('d-none');
        extractInputGroup.classList.add('d-none');
        
        if (e.target.value === 'range') {
            rangeInputGroup.classList.remove('d-none');
        } else if (e.target.value === 'extract') {
            extractInputGroup.classList.remove('d-none');
        }
    });
});

splitBtn.addEventListener('click', processSplit);

/**
 * Handle selected file
 */
async function handleFile(file) {
    if (file.type !== 'application/pdf') {
        Utils.showToast('Please upload a valid PDF file.', 'danger');
        return;
    }

    try {
        selectedFile = file;
        const arrayBuffer = await Utils.readFileAsArrayBuffer(file);
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        pageCount = pdfDoc.getPageCount();

        // Generate and show preview
        const thumbnail = await Utils.generateThumbnail(file);
        pdfPreviewImg.src = thumbnail;
        
        // Update UI
        fileNameDisplay.textContent = file.name;
        fileSizeDisplay.textContent = Utils.formatBytes(file.size);
        totalPagesBadge.textContent = `${pageCount} Pages`;
        
        // Update range inputs
        document.getElementById('range-start').value = 1;
        document.getElementById('range-end').value = pageCount;
        document.getElementById('range-start').max = pageCount;
        document.getElementById('range-end').max = pageCount;

        initialDropZone.classList.add('d-none');
        previewContainer.classList.remove('d-none');
        sidebar.classList.remove('d-none');
    } catch (error) {
        console.error('Error loading PDF:', error);
        Utils.showToast('Error loading PDF. It might be password protected.', 'danger');
    }
}

/**
 * Core Split Logic
 */
async function processSplit() {
    if (!selectedFile) return;

    const method = document.querySelector('input[name="splitMethod"]:checked').value;
    const { PDFDocument } = PDFLib;
    const originalPdfBytes = await Utils.readFileAsArrayBuffer(selectedFile);
    
    try {
        splitBtn.disabled = true;
        progressContainer.style.display = 'block';
        progressBar.style.width = '10%';

        if (method === 'all') {
            await splitAllPages(originalPdfBytes);
        } else if (method === 'range') {
            await splitByRange(originalPdfBytes);
        } else if (method === 'extract') {
            await extractPages(originalPdfBytes);
        }

        progressBar.style.width = '100%';
        setTimeout(() => {
            progressContainer.style.display = 'none';
            progressBar.style.width = '0%';
            splitBtn.disabled = false;
        }, 1000);

    } catch (error) {
        console.error('Split Error:', error);
        Utils.showToast('Error splitting PDF: ' + error.message, 'danger');
        splitBtn.disabled = false;
        progressContainer.style.display = 'none';
    }
}

/**
 * Split every page into its own PDF
 */
async function splitAllPages(bytes) {
    const { PDFDocument } = PDFLib;
    const zip = new JSZip();
    const pdfDoc = await PDFDocument.load(bytes);
    const count = pdfDoc.getPageCount();

    for (let i = 0; i < count; i++) {
        const subDoc = await PDFDocument.create();
        const [copiedPage] = await subDoc.copyPages(pdfDoc, [i]);
        subDoc.addPage(copiedPage);
        const subBytes = await subDoc.save();
        zip.file(`page_${i + 1}.pdf`, subBytes);
        
        progressBar.style.width = `${10 + Math.floor((i / count) * 80)}%`;
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    Utils.downloadBlob(zipBlob, `${selectedFile.name.replace('.pdf', '')}_split.zip`);
    Utils.showToast('PDF split into separate pages (ZIP download).', 'success');
}

/**
 * Split by range (Start to End)
 */
async function splitByRange(bytes) {
    const start = parseInt(document.getElementById('range-start').value);
    const end = parseInt(document.getElementById('range-end').value);

    if (isNaN(start) || isNaN(end) || start < 1 || end > pageCount || start > end) {
        throw new Error('Invalid page range.');
    }

    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.load(bytes);
    const subDoc = await PDFDocument.create();
    
    const indices = [];
    for (let i = start - 1; i < end; i++) indices.push(i);
    
    const copiedPages = await subDoc.copyPages(pdfDoc, indices);
    copiedPages.forEach(page => subDoc.addPage(page));
    
    const subBytes = await subDoc.save();
    const blob = new Blob([subBytes], { type: 'application/pdf' });
    Utils.downloadBlob(blob, `${selectedFile.name.replace('.pdf', '')}_range_${start}-${end}.pdf`);
    Utils.showToast('Pages extracted successfully!', 'success');
}

/**
 * Extract specific pages (1, 3, 5-7)
 */
async function extractPages(bytes) {
    const input = document.getElementById('extract-pages').value;
    const indices = parsePageInput(input);

    if (indices.length === 0) {
        throw new Error('Please enter valid page numbers.');
    }

    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.load(bytes);
    const subDoc = await PDFDocument.create();
    
    const copiedPages = await subDoc.copyPages(pdfDoc, indices);
    copiedPages.forEach(page => subDoc.addPage(page));
    
    const subBytes = await subDoc.save();
    const blob = new Blob([subBytes], { type: 'application/pdf' });
    Utils.downloadBlob(blob, `${selectedFile.name.replace('.pdf', '')}_extracted.pdf`);
    Utils.showToast('Selected pages extracted successfully!', 'success');
}

/**
 * Helper to parse page string like "1, 3, 5-7"
 */
function parsePageInput(str) {
    const pages = new Set();
    const parts = str.split(',').map(p => p.trim());
    
    parts.forEach(part => {
        if (part.includes('-')) {
            const [start, end] = part.split('-').map(p => parseInt(p.trim()));
            if (!isNaN(start) && !isNaN(end)) {
                for (let i = start; i <= end; i++) {
                    if (i >= 1 && i <= pageCount) pages.add(i - 1);
                }
            }
        } else {
            const page = parseInt(part);
            if (!isNaN(page) && page >= 1 && page <= pageCount) {
                pages.add(page - 1);
            }
        }
    });
    
    return Array.from(pages).sort((a, b) => a - b);
}
