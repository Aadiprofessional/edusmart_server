import express from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../utils/supabase.js';
import { v4 as uuidv4 } from 'uuid';
import { 
  submitHomework,
  getHomeworkHistory,
  updateHomework,
  deleteHomework,
  getHomeworkById
} from '../controllers/homeworkController.js';

const router = express.Router();

// Get Supabase admin client
const getSupabaseAdmin = () => supabaseAdmin();

// Configure multer for memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for homework files
  },
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, and text files for homework
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

// Submit homework with file upload and solution
router.post('/submit', async (req, res) => {
  try {
    console.log('📝 Express route: Homework submission request received');
    
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

    const result = await submitHomework(mockRequest);
    handleControllerResponse(res, result);
  } catch (error) {
    console.error('❌ Express route error:', error);
    res.status(500).json({ 
      error: 'Failed to submit homework', 
      details: error.message 
    });
  }
});

// Get homework history for a user
router.get('/history/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const result = await getHomeworkHistory(uid, req.query);
    handleControllerResponse(res, result);
  } catch (error) {
    console.error('❌ Express route error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch homework history', 
      details: error.message 
    });
  }
});

// Update homework solution (for streaming updates)
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await updateHomework(id, req.body);
    handleControllerResponse(res, result);
  } catch (error) {
    console.error('❌ Express route error:', error);
    res.status(500).json({ 
      error: 'Failed to update homework', 
      details: error.message 
    });
  }
});

// Delete homework entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.query;
    const result = await deleteHomework(id, uid);
    handleControllerResponse(res, result);
  } catch (error) {
    console.error('❌ Express route error:', error);
    res.status(500).json({ 
      error: 'Failed to delete homework', 
      details: error.message 
    });
  }
});

// Get specific homework by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.query;
    const result = await getHomeworkById(id, uid);
    handleControllerResponse(res, result);
  } catch (error) {
    console.error('❌ Express route error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch homework', 
      details: error.message 
    });
  }
});

export default router; 