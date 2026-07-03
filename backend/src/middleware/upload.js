const crypto = require('crypto');
const multer = require('multer');
const { put } = require('@vercel/blob');

// Files are buffered in memory, then handed to Vercel Blob — no local disk
// writes, since serverless hosts (Vercel) don't offer a persistent
// filesystem. Works the same way on persistent-process hosts too.
const imageFilter = (_req, file, cb) => {
  if (!/^image\//.test(file.mimetype)) return cb(new Error('Only image uploads are allowed'));
  cb(null, true);
};

const documentFilter = (_req, file, cb) => {
  const allowed = ['image/', 'application/pdf'];
  if (!allowed.some((prefix) => file.mimetype.startsWith(prefix))) {
    return cb(new Error('Only images and PDFs are allowed'));
  }
  cb(null, true);
};

const uploadPhoto = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: { fileSize: 4 * 1024 * 1024 },
});

const uploadDocument = multer({
  storage: multer.memoryStorage(),
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

/**
 * Uploads a multer in-memory file to Vercel Blob, namespaced by org and
 * subfolder (so one org's files aren't grouped alongside another's), and
 * returns its public URL.
 */
async function uploadToBlob(req, file, subdir) {
  const orgId = req.organizationId || 'unassigned';
  const ext = file.originalname.includes('.') ? `.${file.originalname.split('.').pop().slice(0, 10)}` : '';
  const key = `${subdir}/${orgId}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  const blob = await put(key, file.buffer, { access: 'public', contentType: file.mimetype });
  return blob.url;
}

module.exports = { uploadPhoto, uploadDocument, uploadToBlob };
