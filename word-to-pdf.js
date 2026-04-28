/**
 * Word to PDF Conversion Logic
 */

let selectedFile = null;
let extractedHtml = '';

const dropZone = document.getElementById('drop-zone');
const initialDropZone = document.getElementById('initial-drop-zone');
const fileInput = document.getElementById('file-input');
const sidebar = document.getElementById('sidebar');
const previewContainer = document.getElementById('preview-container');
const docPreview = document.getElementById('doc-preview');
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
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'docx' && ext !== 'doc') {
        Utils.showToast('Please upload a valid Word file (DOCX).', 'danger');
        return;
    }

    try {
        selectedFile = file;
        
        // Use Mammoth to extract HTML for preview
        const arrayBuffer = await Utils.readFileAsArrayBuffer(file);
        const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
        extractedHtml = result.value;
        docPreview.innerHTML = extractedHtml || '<p class="text-muted">No text content found.</p>';
        
        fileNameDisplay.textContent = file.name;
        fileSizeDisplay.textContent = Utils.formatBytes(file.size);

        initialDropZone.classList.add('d-none');
        previewContainer.classList.remove('d-none');
        sidebar.classList.remove('d-none');
    } catch (error) {
        console.error('Error loading Word file:', error);
        Utils.showToast('Error loading Word file. Only DOCX is fully supported.', 'danger');
    }
}

/**
 * Core Conversion Logic
 */
async function processConversion() {
    if (!selectedFile || !extractedHtml) return;

    try {
        convertBtn.disabled = true;
        progressContainer.style.display = 'block';
        progressBar.style.width = '30%';

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'pt',
            format: 'a4'
        });

        progressBar.style.width = '60%';

        // Use jsPDF's html method to render the extracted HTML
        // Note: This is basic and might not preserve all complex layouts
        await doc.html(docPreview, {
            callback: function (doc) {
                progressBar.style.width = '100%';
                doc.save(`${selectedFile.name.replace(/\.[^/.]+$/, "")}.pdf`);
                Utils.showToast('Word converted to PDF successfully!', 'success');
                
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                    progressBar.style.width = '0%';
                    convertBtn.disabled = false;
                }, 1000);
            },
            x: 40,
            y: 40,
            width: 520, // A4 width minus margins
            windowWidth: 800 // Virtual window width for layout
        });

    } catch (error) {
        console.error('Conversion Error:', error);
        Utils.showToast('Error converting document.', 'danger');
        convertBtn.disabled = false;
        progressContainer.style.display = 'none';
    }
}
