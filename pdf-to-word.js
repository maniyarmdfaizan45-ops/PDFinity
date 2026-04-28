/**
 * PDF to Word Conversion Logic
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
const convertBtn = document.getElementById('convert-btn');
const changeFileBtn = document.getElementById('change-file');
const progressBar = document.getElementById('conv-progress');
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

convertBtn.addEventListener('click', processConversion);

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
        const thumbnail = await Utils.generateThumbnail(file);
        pdfPreviewImg.src = thumbnail;
        
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
 * Core Conversion Logic
 */
async function processConversion() {
    if (!selectedFile) return;

    try {
        convertBtn.disabled = true;
        progressContainer.style.display = 'block';
        progressBar.style.width = '10%';

        const arrayBuffer = await Utils.readFileAsArrayBuffer(selectedFile);
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const totalPages = pdf.numPages;
        
        let fullText = '';
        
        for (let i = 1; i <= totalPages; i++) {
            const progress = 10 + Math.floor((i / totalPages) * 80);
            progressBar.style.width = `${progress}%`;
            
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += `<p>${pageText}</p><br>`;
        }

        // Create a simple HTML-based .doc content
        const htmlContent = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Export HTML to Doc</title></head>
            <body>${fullText}</body>
            </html>
        `;

        const blob = new Blob(['\ufeff', htmlContent], {
            type: 'application/msword'
        });

        progressBar.style.width = '100%';
        Utils.downloadBlob(blob, `${selectedFile.name.replace('.pdf', '')}.doc`);
        Utils.showToast('PDF converted to Word successfully!', 'success');

        setTimeout(() => {
            progressContainer.style.display = 'none';
            progressBar.style.width = '0%';
            convertBtn.disabled = false;
        }, 1000);

    } catch (error) {
        console.error('Conversion Error:', error);
        Utils.showToast('Error converting PDF.', 'danger');
        convertBtn.disabled = false;
        progressContainer.style.display = 'none';
    }
}
