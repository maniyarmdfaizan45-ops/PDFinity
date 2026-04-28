/**
 * PDF Merger Logic - Premium Version
 */

let selectedFiles = [];
const dropZone = document.getElementById('drop-zone');
const initialDropZone = document.getElementById('initial-drop-zone');
const fileInput = document.getElementById('file-input');
const fileGrid = document.getElementById('file-grid');
const fileGridContainer = document.getElementById('file-grid-container');
const sidebar = document.getElementById('sidebar');
const mergeBtn = document.getElementById('merge-btn');
const clearAllBtn = document.getElementById('clear-all');
const progressBar = document.getElementById('merge-progress');
const progressContainer = document.querySelector('.progress-container');
const fileCountBadge = document.getElementById('file-count-badge');

// Initialize SortableJS
const sortable = new Sortable(fileGrid, {
    animation: 250,
    ghostClass: 'opacity-50',
    filter: '.add-more-card', // Don't allow dragging the "Add More" card
    onEnd: () => {
        const newOrder = Array.from(fileGrid.querySelectorAll('.file-card')).map(card => card.dataset.id);
        const reorderedFiles = newOrder.map(id => selectedFiles.find(f => f.id === id));
        selectedFiles = reorderedFiles;
    }
});

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
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

clearAllBtn.addEventListener('click', () => {
    selectedFiles = [];
    renderFileGrid();
    initialDropZone.classList.remove('d-none');
    fileGridContainer.classList.add('d-none');
    sidebar.classList.add('d-none');
});

mergeBtn.addEventListener('click', mergePDFs);

/**
 * Handle selected files
 */
async function handleFiles(files) {
    const pdfFiles = Array.from(files).filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0 && files.length > 0) {
        Utils.showToast('Please upload only PDF files.', 'danger');
        return;
    }

    // Show loading state if needed
    for (const file of pdfFiles) {
        const fileId = Math.random().toString(36).substring(2, 9);
        const thumbnail = await Utils.generateThumbnail(file);
        selectedFiles.push({
            id: fileId,
            file: file,
            thumbnail: thumbnail
        });
    }

    renderFileGrid();
    
    if (selectedFiles.length > 0) {
        initialDropZone.classList.add('d-none');
        fileGridContainer.classList.remove('d-none');
        sidebar.classList.remove('d-none');
    }
}

/**
 * Render the grid of selected files
 */
function renderFileGrid() {
    fileGrid.innerHTML = '';
    
    selectedFiles.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'file-card';
        card.dataset.id = item.id;
        card.innerHTML = `
            <button class="remove-file-btn" onclick="removeFile('${item.id}')">
                <i class="fas fa-times"></i>
            </button>
            <img src="${item.thumbnail}" class="file-thumbnail" alt="Page 1 Preview">
            <div class="fw-bold text-truncate mb-1 px-2" title="${item.file.name}">${item.file.name}</div>
            <div class="badge bg-light text-dark rounded-pill border">${index + 1}</div>
        `;
        fileGrid.appendChild(card);
    });

    // Add "Add More" card
    const addCard = document.createElement('div');
    addCard.className = 'file-card add-more-card';
    addCard.innerHTML = `
        <i class="fas fa-plus fa-3x text-primary mb-3"></i>
        <div class="fw-bold">Add More</div>
    `;
    addCard.onclick = () => fileInput.click();
    fileGrid.appendChild(addCard);

    // Update sidebar badge
    fileCountBadge.innerHTML = `<span class="badge-premium">${selectedFiles.length} Files Selected</span>`;
}

/**
 * Remove a file from the list
 */
window.removeFile = function(id) {
    selectedFiles = selectedFiles.filter(item => item.id !== id);
    renderFileGrid();
    if (selectedFiles.length === 0) {
        initialDropZone.classList.remove('d-none');
        fileGridContainer.classList.add('d-none');
        sidebar.classList.add('d-none');
    }
};

/**
 * Core Merge Logic
 */
async function mergePDFs() {
    if (selectedFiles.length < 2) {
        Utils.showToast('Please select at least 2 PDF files to merge.', 'warning');
        return;
    }

    try {
        mergeBtn.disabled = true;
        progressContainer.style.display = 'block';
        progressBar.style.width = '10%';
        
        const { PDFDocument } = PDFLib;
        const mergedPdf = await PDFDocument.create();
        
        for (let i = 0; i < selectedFiles.length; i++) {
            const progress = 10 + Math.floor(((i + 1) / selectedFiles.length) * 80);
            progressBar.style.width = `${progress}%`;

            const pdfBytes = await Utils.readFileAsArrayBuffer(selectedFiles[i].file);
            const pdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        progressBar.style.width = '95%';
        const mergedPdfBytes = await mergedPdf.save();
        const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
        
        Utils.downloadBlob(blob, 'merged_document.pdf');
        Utils.showToast('PDFs merged successfully!', 'success');
        
        progressBar.style.width = '100%';
        setTimeout(() => {
            progressContainer.style.display = 'none';
            progressBar.style.width = '0%';
            mergeBtn.disabled = false;
        }, 1000);

    } catch (error) {
        console.error('Merge Error:', error);
        Utils.showToast('Error merging PDFs. The file might be corrupted or encrypted.', 'danger');
        mergeBtn.disabled = false;
        progressContainer.style.display = 'none';
    }
}
