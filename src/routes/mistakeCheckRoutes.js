import express from 'express';
import multer from 'multer';
import { 
  submitMistakeCheck,
  getMistakeCheckHistory,
  updateMistakeCheck,
  deleteMistakeCheck,
  getMistakeCheckById
} from '../controllers/mistakeCheckController.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for mistake check files
  },
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, and text files for mistake checking
    if (file.mimetype.startsWith('image/') || 
        file.mimetype === 'application/pdf' || 
        file.mimetype.startsWith('text/') ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only image, PDF, text, and document files are allowed!'), false);
    }
  }
});

// Helper function to convert controller responses to Express format
const handleControllerResponse = (res, result) => {
  res.status(result.status).json(result.data);
};

// Submit mistake check with file upload and analysis data
router.post('/submit', upload.single('file'), async (req, res) => {
  try {
    console.log('🔍 Express route: Mistake check submission request received');
    
    // For Express routes, we need to handle multipart form data differently
    // The controller expects a Request object, so we'll create a compatible one
    const mockRequest = {
      headers: new Map(Object.entries(req.headers)),
      async formData() {
        const formData = new FormData();
        
        // Add all body fields
        for (const [key, value] of Object.entries(req.body)) {
          formData.append(key, value);
        }
        
        // Add file if present
        if (req.file) {
          const file = new File([req.file.buffer], req.file.originalname, {
            type: req.file.mimetype
          });
          formData.append('file', file);
        }
        
        return formData;
      },
      async json() {
        return req.body;
      }
    };

    const result = await submitMistakeCheck(mockRequest);
    handleControllerResponse(res, result);
  } catch (error) {
    console.error('❌ Express route error:', error);
    res.status(500).json({ 
      error: 'Failed to submit mistake check', 
      details: error.message 
    });
  }
});

// Get mistake check history for a user
router.get('/history/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const result = await getMistakeCheckHistory(uid, req.query);
    handleControllerResponse(res, result);
  } catch (error) {
    console.error('❌ Express route error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch mistake check history', 
      details: error.message 
    });
  }
});

// Update mistake check data (for streaming updates or corrections)
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateMistakeCheck(id, req.body);
    handleControllerResponse(res, result);
  } catch (error) {
    console.error('❌ Express route error:', error);
    res.status(500).json({ 
      error: 'Failed to update mistake check', 
      details: error.message 
    });
  }
});

// Delete mistake check entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.query;
    const result = await deleteMistakeCheck(id, uid);
    handleControllerResponse(res, result);
  } catch (error) {
    console.error('❌ Express route error:', error);
    res.status(500).json({ 
      error: 'Failed to delete mistake check', 
      details: error.message 
    });
  }
});

// Get specific mistake check by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.query;
    const result = await getMistakeCheckById(id, uid);
    handleControllerResponse(res, result);
  } catch (error) {
    console.error('❌ Express route error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch mistake check', 
      details: error.message 
    });
  }
});

export default router; 