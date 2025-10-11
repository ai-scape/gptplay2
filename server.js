const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const archiver = require('archiver');

const app = express();
const PORT = process.env.PORT || 3000;

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DATA_FILE = path.join(__dirname, 'assets.json');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function loadAssets() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Failed to parse assets file. Starting with an empty list.', error);
  }
  return [];
}

function saveAssets(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let assets = loadAssets();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const id = uuidv4();
    const ext = path.extname(file.originalname) || '';
    const storedName = `${id}${ext}`;
    file._id = id;
    file._storedName = storedName;
    file._extension = ext;
    cb(null, storedName);
  }
});

const upload = multer({ storage });

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.json());

app.get('/api/assets', (_req, res) => {
  res.json({ assets });
});

app.patch('/api/assets/:id', (req, res) => {
  const { id } = req.params;
  const renameValue = (req.body.displayName || '').trim();

  if (!renameValue) {
    return res.status(400).json({ error: 'A new display name is required.' });
  }

  const asset = assets.find(item => item.id === id);

  if (!asset) {
    return res.status(404).json({ error: 'Asset not found.' });
  }

  const renameHasExtension = path.extname(renameValue);
  const originalExtension = path.extname(asset.originalName) || path.extname(asset.storedName) || '';
  const updatedName = renameHasExtension ? renameValue : `${renameValue}${originalExtension}`;

  asset.displayName = updatedName;
  saveAssets(assets);

  res.json({ asset });
});

app.delete('/api/assets/:id', (req, res) => {
  const { id } = req.params;
  const index = assets.findIndex(item => item.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Asset not found.' });
  }

  const [asset] = assets.splice(index, 1);
  saveAssets(assets);

  const filePath = path.join(UPLOAD_DIR, asset.storedName);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error(`Failed to remove stored file for asset ${asset.id}`, error);
  }

  res.json({ asset });
});

app.post('/api/upload', upload.array('files'), (req, res) => {
  let renames = req.body.renames || [];
  if (!Array.isArray(renames)) {
    renames = [renames];
  }

  const uploadedAssets = req.files.map((file, index) => {
    const renameValue = (renames[index] || '').trim();
    let displayName = file.originalname;

    if (renameValue) {
      const renameHasExtension = path.extname(renameValue);
      displayName = renameHasExtension ? renameValue : `${renameValue}${file._extension}`;
    }

    const asset = {
      id: file._id,
      storedName: file._storedName,
      originalName: file.originalname,
      displayName,
      mimeType: file.mimetype,
      url: `/uploads/${file._storedName}`,
      uploadedAt: new Date().toISOString()
    };
    assets.push(asset);
    return asset;
  });

  saveAssets(assets);

  res.json({ assets: uploadedAssets });
});

app.get('/api/download', (req, res) => {
  const ids = (req.query.ids || '').split(',').filter(Boolean);
  if (ids.length === 0) {
    return res.status(400).json({ error: 'No asset ids provided.' });
  }

  const selectedAssets = assets.filter(asset => ids.includes(asset.id));

  if (selectedAssets.length === 0) {
    return res.status(404).json({ error: 'Assets not found.' });
  }

  if (selectedAssets.length === 1) {
    const asset = selectedAssets[0];
    const filePath = path.join(UPLOAD_DIR, asset.storedName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File no longer exists on the server.' });
    }
    return res.download(filePath, asset.displayName);
  }

  const archive = archiver('zip', { zlib: { level: 9 } });
  const zipName = `assets-${Date.now()}.zip`;

  res.attachment(zipName);
  archive.pipe(res);

  selectedAssets.forEach(asset => {
    const filePath = path.join(UPLOAD_DIR, asset.storedName);
    if (fs.existsSync(filePath)) {
      archive.file(filePath, { name: asset.displayName });
    }
  });

  archive.finalize().catch(error => {
    console.error('Error creating archive', error);
    if (!res.headersSent) {
      res.status(500).end();
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
