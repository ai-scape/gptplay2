const workspace = document.getElementById('workspace');
const workspaceContainer = document.getElementById('workspaceContainer');
const renameToggle = document.getElementById('renameToggle');
const assetTemplate = document.getElementById('assetTemplate');
const assetSelect = document.getElementById('assetSelect');
const downloadButton = document.getElementById('downloadSelected');
const addTextBtn = document.getElementById('addTextBtn');
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const resetViewBtn = document.getElementById('resetView');
const zoomDisplay = document.getElementById('zoomDisplay');

const MIN_SCALE = 0.3;
const MAX_SCALE = 2.5;
const SCALE_FACTOR = 1.18;

const state = {
  assets: new Map(),
  scale: 1,
  isPanning: false,
  spacePanning: false,
  panStart: { x: 0, y: 0, left: 0, top: 0 }
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function updateZoomDisplay() {
  if (!zoomDisplay) return;
  zoomDisplay.textContent = `${Math.round(state.scale * 100)}%`;
}

function getViewportCenter() {
  return {
    x: workspaceContainer.scrollLeft + workspaceContainer.clientWidth / 2,
    y: workspaceContainer.scrollTop + workspaceContainer.clientHeight / 2
  };
}

function applyScale(nextScale, focusPoint = getViewportCenter()) {
  const previousScale = state.scale;
  const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);

  if (Math.abs(clampedScale - previousScale) < 0.0001) {
    return;
  }

  state.scale = clampedScale;
  workspace.style.transform = `scale(${state.scale})`;
  updateZoomDisplay();

  const focusWorldX = focusPoint.x / previousScale;
  const focusWorldY = focusPoint.y / previousScale;

  const newScrollLeft = focusWorldX * state.scale - workspaceContainer.clientWidth / 2;
  const newScrollTop = focusWorldY * state.scale - workspaceContainer.clientHeight / 2;

  const maxScrollLeft = Math.max(0, workspace.offsetWidth * state.scale - workspaceContainer.clientWidth);
  const maxScrollTop = Math.max(0, workspace.offsetHeight * state.scale - workspaceContainer.clientHeight);

  workspaceContainer.scrollLeft = clamp(newScrollLeft, 0, maxScrollLeft);
  workspaceContainer.scrollTop = clamp(newScrollTop, 0, maxScrollTop);
}

function centerWorkspace() {
  const totalWidth = workspace.offsetWidth * state.scale;
  const totalHeight = workspace.offsetHeight * state.scale;
  const centerLeft = Math.max(0, (totalWidth - workspaceContainer.clientWidth) / 2);
  const centerTop = Math.max(0, (totalHeight - workspaceContainer.clientHeight) / 2);

  workspaceContainer.scrollLeft = centerLeft;
  workspaceContainer.scrollTop = centerTop;
}

function getWorkspacePoint(event) {
  const rect = workspace.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) / state.scale,
    y: (event.clientY - rect.top) / state.scale
  };
}

function getContainerPoint(event) {
  const rect = workspaceContainer.getBoundingClientRect();
  return {
    x: workspaceContainer.scrollLeft + (event.clientX - rect.left),
    y: workspaceContainer.scrollTop + (event.clientY - rect.top)
  };
}

function makeDraggable(element) {
  let offsetX = 0;
  let offsetY = 0;

  function onPointerMove(event) {
    const { x, y } = getWorkspacePoint(event);
    element.style.left = `${x - offsetX}px`;
    element.style.top = `${y - offsetY}px`;
  }

  function onPointerUp() {
    element.classList.remove('dragging');
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointercancel', onPointerUp);
  }

  element.addEventListener('pointerdown', event => {
    if (event.button !== 0 || state.spacePanning) return;
    if (event.target.closest('.asset-actions') || event.target.classList.contains('resize-handle')) {
      return;
    }

    const { x, y } = getWorkspacePoint(event);
    const currentLeft = parseFloat(element.style.left || '0');
    const currentTop = parseFloat(element.style.top || '0');

    offsetX = x - currentLeft;
    offsetY = y - currentTop;

    element.classList.add('dragging');
    event.preventDefault();

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  });
}

function attachResizer(element, handle) {
  if (!handle) return;
  handle.addEventListener('pointerdown', event => {
    event.stopPropagation();
    event.preventDefault();

    const rect = element.getBoundingClientRect();
    const startWidth = rect.width / state.scale;
    const startHeight = rect.height / state.scale;
    const startX = event.clientX;
    const startY = event.clientY;

    function onPointerMove(moveEvent) {
      const deltaX = (moveEvent.clientX - startX) / state.scale;
      const deltaY = (moveEvent.clientY - startY) / state.scale;
      const nextWidth = Math.max(200, startWidth + deltaX);
      const nextHeight = Math.max(160, startHeight + deltaY);

      element.style.width = `${nextWidth}px`;
      element.style.height = `${nextHeight}px`;
    }

    function onPointerUp() {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('pointercancel', onPointerUp);
    }

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointercancel', onPointerUp);
  });
}

function splitExtension(filename) {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot <= 0) {
    return { base: filename, extension: '' };
  }
  return {
    base: filename.slice(0, lastDot),
    extension: filename.slice(lastDot)
  };
}

function updateAssetOption(asset) {
  if (!assetSelect) return;
  let option = assetSelect.querySelector(`option[value="${asset.id}"]`);
  if (!option) {
    option = document.createElement('option');
    option.value = asset.id;
    assetSelect.appendChild(option);
  }
  option.textContent = asset.displayName;
}

function removeAssetOption(assetId) {
  const option = assetSelect.querySelector(`option[value="${assetId}"]`);
  if (option) {
    option.remove();
  }
}

function renderAssetMedia(body, asset) {
  body.innerHTML = '';

  const type = (asset.mimeType || '').toLowerCase();

  if (type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = asset.url;
    img.alt = asset.displayName;
    body.appendChild(img);
    return;
  }

  if (type.startsWith('video/')) {
    const video = document.createElement('video');
    video.src = asset.url;
    video.controls = true;
    video.title = asset.displayName;
    body.appendChild(video);
    return;
  }

  const link = document.createElement('a');
  link.href = asset.url;
  link.textContent = asset.displayName;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  body.appendChild(link);
}

function createAssetElement(asset, position = { x: 80, y: 80 }) {
  const template = assetTemplate.content.firstElementChild.cloneNode(true);
  template.dataset.assetId = asset.id;
  template.style.left = `${position.x}px`;
  template.style.top = `${position.y}px`;
  template.querySelector('.asset-title').textContent = asset.displayName;

  const body = template.querySelector('.asset-body');
  renderAssetMedia(body, asset);

  const renameBtn = template.querySelector('.rename-btn');
  if (renameBtn) {
    renameBtn.addEventListener('click', () => handleManualRename(asset.id, template));
  }

  const deleteBtn = template.querySelector('.delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => handleRemoveAsset(asset.id, template));
  }

  const resizeHandle = template.querySelector('.resize-handle');
  attachResizer(template, resizeHandle);
  makeDraggable(template);

  workspace.appendChild(template);
  return template;
}

function scatterPosition(index) {
  const colWidth = 360;
  const rowHeight = 280;
  const cols = Math.floor(workspace.offsetWidth / colWidth) || 5;
  const col = index % cols;
  const row = Math.floor(index / cols);
  return {
    x: 120 + col * colWidth,
    y: 120 + row * rowHeight
  };
}

async function loadExistingAssets() {
  try {
    const response = await fetch('/api/assets');
    const payload = await response.json();
    if (!Array.isArray(payload.assets)) return;

    payload.assets.forEach((asset, index) => {
      state.assets.set(asset.id, asset);
      const position = scatterPosition(index);
      createAssetElement(asset, position);
      updateAssetOption(asset);
    });
  } catch (error) {
    console.error('Failed to fetch existing assets', error);
  } finally {
    centerWorkspace();
  }
}

async function uploadFiles(files, basePosition) {
  if (!files.length) return;
  const formData = new FormData();
  const renames = [];
  const usedFiles = [];

  for (const file of files) {
    let renameValue = '';
    if (renameToggle.checked) {
      const suggested = file.name.replace(/\.[^/.]+$/, '');
      const answer = window.prompt(`Rename "${file.name}"`, suggested);
      if (answer === null) {
        continue;
      }
      renameValue = answer.trim();
    }
    usedFiles.push(file);
    renames.push(renameValue);
  }

  if (!usedFiles.length) return;

  usedFiles.forEach(file => formData.append('files', file));
  renames.forEach(rename => formData.append('renames', rename));

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    const payload = await response.json();
    if (!Array.isArray(payload.assets)) return;

    payload.assets.forEach((asset, index) => {
      state.assets.set(asset.id, asset);
      const position = {
        x: basePosition.x + index * 30,
        y: basePosition.y + index * 30
      };
      createAssetElement(asset, position);
      updateAssetOption(asset);
    });
  } catch (error) {
    console.error('Upload failed', error);
  }
}

function handleDrop(event) {
  event.preventDefault();
  const files = Array.from(event.dataTransfer.files || []);
  if (!files.length) return;
  const point = getWorkspacePoint(event);
  uploadFiles(files, point);
}

['dragenter', 'dragover'].forEach(eventName => {
  workspaceContainer.addEventListener(eventName, event => {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  });
});

workspaceContainer.addEventListener('drop', handleDrop);

async function handleManualRename(assetId, element) {
  const asset = state.assets.get(assetId);
  if (!asset) return;

  const { base } = splitExtension(asset.displayName);
  const answer = window.prompt('Rename asset', base);
  if (answer === null) {
    return;
  }

  const trimmed = answer.trim();
  if (!trimmed) {
    alert('Name cannot be empty.');
    return;
  }

  try {
    const response = await fetch(`/api/assets/${assetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: trimmed })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Rename failed');
    }

    const payload = await response.json();
    const updatedAsset = payload.asset;
    state.assets.set(assetId, updatedAsset);

    element.querySelector('.asset-title').textContent = updatedAsset.displayName;
    const media = element.querySelector('.asset-body img');
    if (media) {
      media.alt = updatedAsset.displayName;
    }
    const video = element.querySelector('.asset-body video');
    if (video) {
      video.title = updatedAsset.displayName;
    }
    const link = element.querySelector('.asset-body a');
    if (link) {
      link.textContent = updatedAsset.displayName;
    }

    updateAssetOption(updatedAsset);
  } catch (error) {
    console.error(error);
    alert(error.message || 'Could not rename asset.');
  }
}

async function handleRemoveAsset(assetId, element) {
  const asset = state.assets.get(assetId);
  if (!asset) return;

  const confirmDelete = window.confirm(`Remove "${asset.displayName}" from the board? The file will also be removed from the server.`);
  if (!confirmDelete) {
    return;
  }

  try {
    const response = await fetch(`/api/assets/${assetId}`, { method: 'DELETE' });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Delete failed');
    }

    state.assets.delete(assetId);
    element.remove();
    removeAssetOption(assetId);
  } catch (error) {
    console.error(error);
    alert(error.message || 'Could not remove asset.');
  }
}

function addTextBlock() {
  const text = window.prompt('Enter text for the canvas');
  if (!text) return;

  const template = assetTemplate.content.firstElementChild.cloneNode(true);
  template.classList.add('text-only');

  const viewportCenter = getViewportCenter();
  template.style.left = `${viewportCenter.x / state.scale - 120}px`;
  template.style.top = `${viewportCenter.y / state.scale - 60}px`;

  template.querySelector('.asset-title').textContent = 'Text Note';
  const body = template.querySelector('.asset-body');
  body.textContent = text;

  const actions = template.querySelector('.asset-actions');
  if (actions) {
    const renameBtn = actions.querySelector('.rename-btn');
    if (renameBtn) {
      renameBtn.remove();
    }
    const deleteBtn = actions.querySelector('.delete-btn');
    if (deleteBtn) {
      deleteBtn.setAttribute('aria-label', 'Remove note');
      deleteBtn.addEventListener('click', () => template.remove());
    }
  }

  const resizeHandle = template.querySelector('.resize-handle');
  attachResizer(template, resizeHandle);
  makeDraggable(template);
  workspace.appendChild(template);
}

addTextBtn.addEventListener('click', addTextBlock);

downloadButton.addEventListener('click', () => {
  const selected = Array.from(assetSelect.selectedOptions).map(option => option.value);
  if (!selected.length) {
    alert('Select at least one asset to download.');
    return;
  }
  const url = `/api/download?ids=${encodeURIComponent(selected.join(','))}`;
  window.open(url, '_blank');
});

function handleWheel(event) {
  if (!event.ctrlKey && !event.metaKey) {
    return;
  }
  event.preventDefault();
  const factor = event.deltaY > 0 ? 1 / SCALE_FACTOR : SCALE_FACTOR;
  const focusPoint = getContainerPoint(event);
  applyScale(state.scale * factor, focusPoint);
}

workspaceContainer.addEventListener('wheel', handleWheel, { passive: false });

function startPan(event) {
  state.isPanning = true;
  state.panStart = {
    x: event.clientX,
    y: event.clientY,
    left: workspaceContainer.scrollLeft,
    top: workspaceContainer.scrollTop
  };
  workspaceContainer.classList.add('is-panning');
  try {
    workspaceContainer.setPointerCapture(event.pointerId);
  } catch (error) {
    // Pointer events capture may not be supported in all browsers.
  }
}

function stopPan(event) {
  state.isPanning = false;
  workspaceContainer.classList.remove('is-panning');
  try {
    workspaceContainer.releasePointerCapture(event.pointerId);
  } catch (error) {
    // ignore if capture was not set
  }
}

workspaceContainer.addEventListener('pointerdown', event => {
  const targetIsAsset = Boolean(event.target.closest('.asset'));
  const wantsPan = event.button === 1 || state.spacePanning || (!targetIsAsset && event.button === 0);
  if (!wantsPan) {
    return;
  }
  event.preventDefault();
  startPan(event);
});

workspaceContainer.addEventListener('pointermove', event => {
  if (!state.isPanning) return;
  const deltaX = event.clientX - state.panStart.x;
  const deltaY = event.clientY - state.panStart.y;
  workspaceContainer.scrollLeft = state.panStart.left - deltaX;
  workspaceContainer.scrollTop = state.panStart.top - deltaY;
});

workspaceContainer.addEventListener('pointerup', event => {
  if (state.isPanning) {
    stopPan(event);
  }
});

workspaceContainer.addEventListener('pointercancel', event => {
  if (state.isPanning) {
    stopPan(event);
  }
});

function setSpacePanning(enabled) {
  state.spacePanning = enabled;
  workspaceContainer.classList.toggle('space-panning', enabled);
  document.body.classList.toggle('space-panning', enabled);
}

document.addEventListener('keydown', event => {
  if (event.code === 'Space' && !event.repeat) {
    if (/^(input|textarea|select)$/i.test(event.target.tagName)) {
      return;
    }
    event.preventDefault();
    setSpacePanning(true);
  }
});

document.addEventListener('keyup', event => {
  if (event.code === 'Space') {
    setSpacePanning(false);
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    setSpacePanning(false);
  }
});

zoomInBtn.addEventListener('click', () => {
  const focusPoint = getViewportCenter();
  applyScale(state.scale * SCALE_FACTOR, focusPoint);
});

zoomOutBtn.addEventListener('click', () => {
  const focusPoint = getViewportCenter();
  applyScale(state.scale / SCALE_FACTOR, focusPoint);
});

resetViewBtn.addEventListener('click', () => {
  if (state.scale !== 1) {
    workspace.style.transform = 'scale(1)';
    state.scale = 1;
    updateZoomDisplay();
  }
  centerWorkspace();
});

window.addEventListener('resize', () => {
  centerWorkspace();
});

workspace.style.transformOrigin = '0 0';
workspace.style.transform = 'scale(1)';
updateZoomDisplay();

loadExistingAssets();
