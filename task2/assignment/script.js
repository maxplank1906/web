// Photo editor: single dynamic filter slider + rotate/flip panel
const canvas = document.getElementById('canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// Filter buttons
const btnBrightness = document.getElementById('btn-brightness');
const btnSaturation = document.getElementById('btn-saturation');
const btnInvert = document.getElementById('invert');
const btnGrayscale = document.getElementById('grayscale');
const btnSepia = document.getElementById('sepia');
const btnBlur = document.getElementById('blur');

// Shared filter slider + display
const filterControl = document.getElementById('filterControl');
const filterRange = document.getElementById('filterRange');
const filterValue = document.getElementById('filterValue');

// Rotation + flips
const rotateRange = document.getElementById('rotateRange');
const rotateValue = document.getElementById('rotateValue');
const rotateLeft = document.getElementById('rotateLeft');
const rotateRight = document.getElementById('rotateRight');
const flipH = document.getElementById('flipH');
const flipV = document.getElementById('flipV');

// History and other controls
const uploadInput = document.getElementById('upload');
const undoBtn = document.getElementById('undo');
const redoBtn = document.getElementById('redo');
const historyList = document.getElementById('historyList');
const resetBtn = document.getElementById('reset');
const saveBtn = document.getElementById('save');

// State
let originalImage = null;
const filters = {
    // use zero-based deltas: 0 = neutral, range -100..100
    brightness: 0,
    saturation: 0,
    invert: 0,
    grayscale: 0,
    sepia: 0,
    blur: 0
};
let rotation = 0;
let flipHorizontal = 1;
let flipVertical = 1;

let activeFilter = null; // one of the keys in filters or null

// History
let history = [];
let currentIndex = -1;

function drawImage() {
    if (!originalImage || !ctx || !canvas) return;

    // Use natural size to avoid 0 width/height issues
    const imgW = originalImage.naturalWidth || originalImage.width || 0;
    const imgH = originalImage.naturalHeight || originalImage.height || 0;
    if (!imgW || !imgH) {
        console.warn('Image has no natural size yet');
        return;
    }

    const normRot = ((rotation % 360) + 360) % 360;

    // Compute display size so the image occupies the same on-screen rectangle
    // regardless of rotation. Fit within the canvas parent area while
    // preserving aspect ratio and avoid upscaling.
    const parent = canvas.parentElement || document.body;
    const maxW = Math.max(100, parent.clientWidth - 20);
    const maxH = Math.max(100, parent.clientHeight - 20);

    // Compute the rotation-aware scale factor so that the rotated bounding box
    // (bbox) fits inside parent width/height. We solve for s where
    // bboxW = s*(imgW*|cos| + imgH*|sin|) <= maxW
    // bboxH = s*(imgW*|sin| + imgH*|cos|) <= maxH
    const theta = (rotation * Math.PI) / 180;
    const absCos = Math.abs(Math.cos(theta));
    const absSin = Math.abs(Math.sin(theta));

    const denomW = imgW * absCos + imgH * absSin;
    const denomH = imgW * absSin + imgH * absCos;

    // avoid divide by zero
    const sW = denomW > 0 ? maxW / denomW : 1;
    const sH = denomH > 0 ? maxH / denomH : 1;
    const s = Math.min(1, sW, sH);

    const displayW = Math.max(1, Math.round(imgW * s));
    const displayH = Math.max(1, Math.round(imgH * s));

    // bbox dimensions using the scaled display size
    const bboxW = Math.round(displayW * absCos + displayH * absSin);
    const bboxH = Math.round(displayW * absSin + displayH * absCos);

    canvas.width = bboxW;
    canvas.height = bboxH;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    // apply only flip here; drawImage will scale the source to canvas size
    ctx.scale(flipHorizontal, flipVertical);

    // Map filter deltas (-100..100) into CSS values
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const bVal = clamp(100 + Number(filters.brightness), 0, 200); // brightness % (100 = neutral)
    const sVal = clamp(100 + Number(filters.saturation), 0, 200); // saturate %
    const gVal = clamp(Number(filters.grayscale), -100, 100);
    const iVal = clamp(Number(filters.invert), -100, 100);
    const seVal = clamp(Number(filters.sepia), -100, 100);
    const blurPct = clamp(Number(filters.blur), -100, 100);

    // For grayscale/invert/sepia: negative values don't have a direct CSS inverse,
    // so treat negative as 0 (no effect) and positive as percentage.
    const grayscalePct = Math.max(0, gVal) + '%';
    const invertPct = Math.max(0, iVal) + '%';
    const sepiaPct = Math.max(0, seVal) + '%';
    // Map blur -100..100 to 0..5px using absolute magnitude
    const blurPx = (Math.abs(blurPct) / 100) * 5;

    ctx.filter = [
        `brightness(${bVal}%)`,
        `saturate(${sVal}%)`,
        `grayscale(${grayscalePct})`,
        `invert(${invertPct})`,
        `sepia(${sepiaPct})`,
        `blur(${blurPx}px)`
    ].join(' ');

    // Draw image stretched to canvas (canvas already sized to fit)
    // Draw image centered using displayW/displayH (these are rotated inside bbox)
    ctx.drawImage(originalImage, -displayW / 2, -displayH / 2, displayW, displayH);

    // draw rotating border inside canvas so it rotates with the image
    try {
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        ctx.strokeRect(-displayW / 2, -displayH / 2, displayW, displayH);
    } catch (e) {
        // ignore drawing errors
    }

    ctx.restore();
}

function updateUndoRedoButtons() {
    if (!undoBtn || !redoBtn) return;
    undoBtn.disabled = currentIndex <= 0;
    redoBtn.disabled = currentIndex >= history.length - 1;
}

function updateHistoryPanel() {
    if (!historyList) return;
    historyList.innerHTML = '';
    history.forEach((st, i) => {
        const d = document.createElement('div');
        d.textContent = st.action || `State ${i + 1}`;
        d.style.cursor = 'pointer';
        d.style.padding = '6px';
        if (i === currentIndex) d.style.background = '#ddd';
        d.addEventListener('click', () => {
            currentIndex = i;
            applyState(history[i]);
            updateUndoRedoButtons();
            updateHistoryPanel();
        });
        historyList.appendChild(d);
    });
}

function saveState(actionName = 'State') {
    if (!originalImage) return;
    if (currentIndex < history.length - 1) history = history.slice(0, currentIndex + 1);
    const snapshot = {
        filters: JSON.parse(JSON.stringify(filters)),
        rotation,
        flipHorizontal,
        flipVertical,
        action: actionName
    };
    history.push(snapshot);
    currentIndex = history.length - 1;
    updateHistoryPanel();
    updateUndoRedoButtons();
}

function applyState(st) {
    if (!st) return;
    Object.assign(filters, st.filters);
    rotation = Number(st.rotation);
    flipHorizontal = Number(st.flipHorizontal);
    flipVertical = Number(st.flipVertical);
    // update UI
    if (activeFilter && filterRange) filterRange.value = filters[activeFilter];
    if (rotateRange) rotateRange.value = rotation;
    if (rotateValue) rotateValue.textContent = rotation + '°';
    drawImage();
}

// Active filter button handling
const filterButtons = {
    brightness: btnBrightness,
    saturation: btnSaturation,
    invert: btnInvert,
    grayscale: btnGrayscale,
    sepia: btnSepia,
    blur: btnBlur
};

function setActiveFilter(key) {
    // toggle active
    activeFilter = key;
    // highlight active button, remove others
    Object.keys(filterButtons).forEach(k => {
        const btn = filterButtons[k];
        if (!btn) return;
        if (k === key) btn.classList.add('active'); else btn.classList.remove('active');
    });
    // show slider and set its value
    if (filterControl && filterRange && filterValue) {
        filterControl.style.display = 'flex';
        // ensure slider reflects delta range -100..100
        filterRange.min = -100;
        filterRange.max = 100;
        filterRange.step = 2;
        filterRange.value = filters[key];
        // show delta with sign
        filterValue.textContent = (filters[key] >= 0 ? '+' : '') + filters[key] + '%';
        filterControl.setAttribute('aria-hidden', 'false');
    }
}

// Unset active filter (hide slider)
function clearActiveFilter() {
    activeFilter = null;
    Object.keys(filterButtons).forEach(k => { const b = filterButtons[k]; if (b) b.classList.remove('active'); });
    if (filterControl) { filterControl.style.display = 'none'; filterControl.setAttribute('aria-hidden', 'true'); }
}

// attach filter button listeners
Object.keys(filterButtons).forEach(key => {
    const btn = filterButtons[key];
    if (!btn) return;
    btn.addEventListener('click', () => setActiveFilter(key));
});

// filter slider updates live and saves state
if (filterRange) {
    // live preview while dragging
    filterRange.addEventListener('input', function () {
        if (!activeFilter) return;
        const val = Number(this.value);
        filters[activeFilter] = val;
        if (filterValue) filterValue.textContent = (val >= 0 ? '+' : '') + val + '%';
        drawImage();
    });
    // save once when user releases the slider (change event)
    filterRange.addEventListener('change', function () {
        if (!activeFilter) return;
        const val = Number(this.value);
        saveState(`${capitalize(activeFilter)} ${val}%`);
    });
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// Upload
if (uploadInput) {
    uploadInput.addEventListener('change', function () {
        const file = this.files && this.files[0];
        if (!file) return;
        const r = new FileReader();
        r.onload = function (e) {
            const img = new Image();
                img.onload = function () {
                    originalImage = img;
                    // reset to zero-deltas so image appears original
                    Object.keys(filters).forEach(k => { filters[k] = 0; });
                    rotation = 0; flipHorizontal = 1; flipVertical = 1;
                    clearActiveFilter();
                    if (filterValue) filterValue.textContent = '0%';
                    drawImage();
                    history = []; currentIndex = -1; saveState('Original Image');
            };
            img.src = e.target.result;
        };
        r.readAsDataURL(file);
    });
}

// Rotation controls
if (rotateRange) {
    // live preview
    rotateRange.addEventListener('input', function () {
        rotation = Number(this.value);
        if (rotateValue) rotateValue.textContent = rotation + '°';
        drawImage();
    });
    // save on release
    rotateRange.addEventListener('change', function () {
        saveState(`Rotate ${rotation}°`);
    });
}
if (rotateLeft) rotateLeft.addEventListener('click', function () { rotation -= 90; if (rotateRange) rotateRange.value = rotation; if (rotateValue) rotateValue.textContent = rotation + '°'; drawImage(); saveState('Rotate Left 90°'); });
if (rotateRight) rotateRight.addEventListener('click', function () { rotation += 90; if (rotateRange) rotateRange.value = rotation; if (rotateValue) rotateValue.textContent = rotation + '°'; drawImage(); saveState('Rotate Right 90°'); });

// Flip
if (flipH) flipH.addEventListener('click', function () { flipHorizontal *= -1; drawImage(); saveState('Flip Horizontal'); });
if (flipV) flipV.addEventListener('click', function () { flipVertical *= -1; drawImage(); saveState('Flip Vertical'); });

// Reset
if (resetBtn) resetBtn.addEventListener('click', function () {
    if (!originalImage) return;
    // If we have the original upload state saved in history[0], restore it
    if (history.length > 0 && history[0] && history[0].action === 'Original Image') {
        applyState(history[0]);
    } else {
        Object.keys(filters).forEach(k => { filters[k] = 0; });
        rotation = 0; flipHorizontal = 1; flipVertical = 1;
        clearActiveFilter();
        if (rotateRange) rotateRange.value = 0;
        if (rotateValue) rotateValue.textContent = '0°';
        drawImage();
    }
    // Record reset action
    saveState('Reset');
});

// Save
if (saveBtn) saveBtn.addEventListener('click', function () { if (!originalImage || !canvas) return; const a = document.createElement('a'); a.download = 'edited-image.png'; a.href = canvas.toDataURL(); a.click(); });

// Undo / Redo
if (undoBtn) undoBtn.addEventListener('click', function () { if (currentIndex > 0) { currentIndex--; applyState(history[currentIndex]); updateUndoRedoButtons(); updateHistoryPanel(); } });
if (redoBtn) redoBtn.addEventListener('click', function () { if (currentIndex < history.length - 1) { currentIndex++; applyState(history[currentIndex]); updateUndoRedoButtons(); updateHistoryPanel(); } });

// init UI
clearActiveFilter();
updateUndoRedoButtons();
updateHistoryPanel();

// expose for debugging
window._photoEditor = { filters, getState: () => ({ filters, rotation, flipHorizontal, flipVertical }) };
