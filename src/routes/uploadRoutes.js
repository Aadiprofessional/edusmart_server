const express = require('express');
const multer = require('multer');
const { supabaseAdmin } = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Configure multer for memory storage (we'll upload to Supabase instead of disk)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Upload single image to Supabase storage
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate unique filename
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `images/${fileName}`;

    // Upload to Supabase storage using admin client
    const { data, error } = await supabaseAdmin.storage
      .from('university-images')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: 'Failed to upload to storage', details: error.message });
    }

    // Get public URL using admin client
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('university-images')
      .getPublicUrl(filePath);

    res.json({
      success: true,
      url: publicUrl,
      filename: fileName,
      originalName: req.file.originalname,
      size: req.file.size,
      path: filePath
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Upload logo specifically (organized in logos folder)
router.post('/logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate unique filename
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `logos/${fileName}`;

    // Upload to Supabase storage using admin client
    const { data, error } = await supabaseAdmin.storage
      .from('university-images')
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return res.status(500).json({ error: 'Failed to upload to storage', details: error.message });
    }

    // Get public URL using admin client
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('university-images')
      .getPublicUrl(filePath);

    res.json({
      success: true,
      url: publicUrl,
      filename: fileName,
      originalName: req.file.originalname,
      size: req.file.size,
      path: filePath
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Upload multiple images (gallery)
router.post('/gallery', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadPromises = req.files.map(async (file) => {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const filePath = `gallery/${fileName}`;

      const { data, error } = await supabaseAdmin.storage
        .from('university-images')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('university-images')
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        filename: fileName,
        originalName: file.originalname,
        size: file.size,
        path: filePath
      };
    });

    const uploadResults = await Promise.all(uploadPromises);

    res.json({
      success: true,
      files: uploadResults
    });
  } catch (error) {
    console.error('Gallery upload error:', error);
    res.status(500).json({ error: 'Failed to upload gallery images' });
  }
});

// Delete image from Supabase storage
router.delete('/image/:path(*)', async (req, res) => {
  try {
    const filePath = req.params.path;

    const { error } = await supabaseAdmin.storage
      .from('university-images')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return res.status(500).json({ error: 'Failed to delete file' });
    }

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router; 