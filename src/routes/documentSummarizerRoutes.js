const express = require('express');
const router = express.Router();

const {
  saveDocumentSummary,
  updateDocumentSummary,
  getDocumentSummaryHistory,
  getDocumentSummary,
  deleteDocumentSummary,
  getDocumentSummaryStats
} = require('../controllers/documentSummarizerController');

// Helper function to convert controller responses to Express format
const handleControllerResponse = (res, result) => {
  res.status(result.status).json(result.data);
};

// Save document summary (create new)
router.post('/save', async (req, res) => {
  try {
    console.log('📝 Express route: Document summary save request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const result = await saveDocumentSummary(req.body);
    handleControllerResponse(res, result);
  } catch (error) {
    console.error('❌ Express route error:', error);
    res.status(500).json({ 
      error: 'Failed to save document summary', 
      details: error.message 
    });
  }
});

// Update existing document summary
router.put('/:id', async (req, res) => {
  try {
    console.log('🔄 Express route: Document summary update request received');
    console.log('Document ID:', req.params.id);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { id } = req.params;
    const result = await updateDocumentSummary(id, req.body);
    handleControllerResponse(res, result);
  } catch (error) {
    console.error('❌ Express route error:', error);
    res.status(500).json({ 
      error: 'Failed to update document summary', 
      details: error.message 
    });
  }
});

// Get document summary history for a user
router.get('/history/:uid', async (req, res) => {
  try {
    console.log('📚 Express route: Document summary history request received');
    console.log('User ID:', req.params.uid);
    console.log('Query params:', req.query);
    
    const { uid } = req.params;
    const result = await getDocumentSummaryHistory(uid, req.query);
    handleControllerResponse(res, result);
  } catch (error) {
    console.error('❌ Express route error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch document summary history', 
      details: error.message 
    });
  }
});

// Get specific document summary by ID
router.get('/:id', async (req, res) => {
  try {
    console.log('📄 Express route: Document summary get request received');
    console.log('Document ID:', req.params.id);
    console.log('Query params:', req.query);
    
    const { id } = req.params;
    const { uid } = req.query;
    
    if (!uid) {
      return res.status(400).json({
        error: 'Missing required parameter',
        details: 'uid query parameter is required'
      });
    }
    
    const result = await getDocumentSummary(id, uid);
    handleControllerResponse(res, result);
  } catch (error) {
    console.error('❌ Express route error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch document summary', 
      details: error.message 
    });
  }
});

// Delete document summary
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ Express route: Document summary delete request received');
    console.log('Document ID:', req.params.id);
    console.log('Query params:', req.query);
    
    const { id } = req.params;
    const { uid } = req.query;
    
    if (!uid) {
      return res.status(400).json({
        error: 'Missing required parameter',
        details: 'uid query parameter is required'
      });
    }
    
    const result = await deleteDocumentSummary(id, uid);
    handleControllerResponse(res, result);
  } catch (error) {
    console.error('❌ Express route error:', error);
    res.status(500).json({ 
      error: 'Failed to delete document summary', 
      details: error.message 
    });
  }
});

// Get document summary statistics
router.get('/stats/:uid', async (req, res) => {
  try {
    console.log('📊 Express route: Document summary statistics request received');
    console.log('User ID:', req.params.uid);
    
    const { uid } = req.params;
    const result = await getDocumentSummaryStats(uid);
    handleControllerResponse(res, result);
  } catch (error) {
    console.error('❌ Express route error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch document summary statistics', 
      details: error.message 
    });
  }
});

module.exports = router; 