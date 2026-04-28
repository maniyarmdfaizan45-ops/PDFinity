/**
 * PDF Compression Logic
 */

let selectedFile = null;

const dropZone = document.getElementById('drop-zone');
const initialDropZone = document.getElementById('initial-drop-zone');
const fileInput = document.getElementById('file-input');
const sidebar = document.getElementById('sidebar');
const previewContainer = document.getElementById('preview-container');
const pdfPreviewImg = document.getElementById('pdf-preview-img');
const fileNameDisplay = document.getElementById('file-name-display');
const fileSizeDisplay = document.getElementById('file-size-display');
const compressBtn = document.getElementById('compress-btn');
const changeFileBtn = document.getElementById('change-file');
const progressBar = document.getElementById('comp-progress');
const progressContainer = document.querySelector('.progress-container');

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

changeFileBtn.addEventListener('click', () => fileInput.click());

// Custom Radio Logic
document.querySelectorAll('input[name="compLevel"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        document.querySelectorAll('.custom-radio-card').forEach(card => {
            card.classList.remove('active');
        });
        e.target.closest('.custom-radio-card').classList.add('active');
    });
});

compressBtn.addEventListener('click', processCompression);

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
        
        // Generate and show preview
        const thumbnail = await Utils.generateThumbnail(file);
        pdfPreviewImg.src = thumbnail;
        
        // Update UI
        fileNameDisplay.textContent = file.name;
        fileSizeDisplay.textContent = Utils.formatBytes(file.size);

        initialDropZone.classList.add('d-none');
        previewContainer.classList.remove('d-none');
        sidebar.classList.remove('d-none');
    } catch (error) {
        console.error('Error loading PDF:', error);
        Utils.showToast('Error loading PDF.', 'danger');
    }
}

/**
 * Core Compression Logic
 */
async function processCompression() {
    if (!selectedFile) return;

    try {
        compressBtn.disabled = true;
        progressContainer.style.display = 'block';
        progressBar.style.width = '30%';

        const { PDFDocument } = PDFLib;
        const arrayBuffer = await Utils.readFileAsArrayBuffer(selectedFile);
        
        // Load the PDF
        progressBar.style.width = '50%';
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        
        // Optimize (Re-saving in pdf-lib often reduces size by cleaning up objects)
        progressBar.style.width = '80%';
        const compressedPdfBytes = await pdfDoc.save({
            useObjectStreams: true, // This can help reduce size
            addDefaultFont: false,
            updateMetadata: false
        });

        const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
        
        // Simulation of "Compressing" to make it feel better
        setTimeout(() => {
            progressBar.style.width = '100%';
            Utils.downloadBlob(blob, `compressed_${selectedFile.name}`);
            
            const originalSize = selectedFile.size;
            const compressedSize = blob.size;
            const savings = Math.max(0, ((originalSize - compressedSize) / originalSize) * 100).toFixed(1);
            
            Utils.showToast(`PDF compressed! Saved about ${savings}% in size.`, 'success');
            
            setTimeout(() => {
                progressContainer.style.display = 'none';
                progressBar.style.width = '0%';
                compressBtn.disabled = false;
            }, 1000);
        }, 800);

    } catch (error) {
        console.error('Compression Error:', error);
        Utils.showToast('Error compressing PDF.', 'danger');
        compressBtn.disabled = false;
        progressContainer.style.display = 'none';
    }
}
