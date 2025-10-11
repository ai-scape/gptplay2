const workspace = document.getElementById('workspace');
const workspaceContainer = document.getElementById('workspaceContainer');
const renameToggle = document.getElementById('renameToggle');
const assetTemplate = document.getElementById('assetTemplate');
const assetSelect = document.getElementById('assetSelect');
const downloadButton = document.getElementById('downloadSelected');
const addTextBtn = document.getElementById('addTextBtn');

const state = {
  assets: new Map()
};

function makeDraggable(element) {
  let offsetX = 0;
  let offsetY = 0;

  function onPointerMove(event) {
    const workspaceRect = workspace.getBoundingClientRect();
    const x = event.clientX - workspaceRect.left - offsetX;
    const y = event.clientY - workspaceRect.top - offsetY;
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  }

  function onPointerUp() {
    element.classList.remove('dragging');
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
  }

  element.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    const rect = element.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    element.classList.add('dragging');
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  });
}

function createAssetElement(asset, position = { x: 80, y: 80 }) {
  const template = assetTemplate.content.firstElementChild.cloneNode(true);
  template.dataset.assetId = asset.id;
  template.style.left = `${position.x}px`;
  template.style.top = `${position.y}px`;
  template.querySelector('.asset-title').textContent = asset.displayName;

  const body = template.querySelector('.asset-body');
  body.innerHTML = '';

  if (asset.mimeType.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = asset.url;
    img.alt = asset.displayName;
    body.appendChild(img);
  } else if (asset.mimeType.startsWith('video/')) {
    const video = document.createElement('video');
    video.src = asset.url;
    video.controls = true;
    body.appendChild(video);
  } else {
    const link = document.createElement('a');
    link.href = asset.url;
    link.textContent = 'Preview asset';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    body.appendChild(link);
  }

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

function addAssetToSelector(asset) {
  if (assetSelect.querySelector(`option[value="${asset.id}"]`)) {
    return;
  }
  const option = document.createElement('option');
  option.value = asset.id;
  option.textContent = asset.displayName;
  assetSelect.appendChild(option);
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
      addAssetToSelector(asset);
    });
  } catch (error) {
    console.error('Failed to fetch existing assets', error);
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
      const answer = window.prompt(`Rename \"${file.name}\"`, suggested);
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
      addAssetToSelector(asset);
    });
  } catch (error) {
    console.error('Upload failed', error);
  }
}

function handleDrop(event) {
  event.preventDefault();
  const files = Array.from(event.dataTransfer.files || []);
  if (!files.length) return;
  const workspaceRect = workspace.getBoundingClientRect();
  const basePosition = {
    x: event.clientX - workspaceRect.left,
    y: event.clientY - workspaceRect.top
  };
  uploadFiles(files, basePosition);
}

['dragenter', 'dragover'].forEach(eventName => {
  workspaceContainer.addEventListener(eventName, event => {
    event.preventDefault();
  });
});

workspaceContainer.addEventListener('drop', handleDrop);

function addTextBlock() {
  const text = window.prompt('Enter text for the canvas');
  if (!text) return;
  const template = assetTemplate.content.firstElementChild.cloneNode(true);
  template.classList.add('text-only');
  template.style.left = '160px';
  template.style.top = '160px';
  template.querySelector('.asset-title').textContent = 'Text Note';
  const body = template.querySelector('.asset-body');
  body.textContent = text;
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

loadExistingAssets();
