import express from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../utils/supabase.js';
import { v4 as uuidv4 } from 'uuid';

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

// Submit homework with file upload and solution
router.post('/submit', upload.single('file'), async (req, res) => {
  try {
    console.log('📝 Homework submission request received');
    console.log('📋 Request body:', req.body);
    console.log('📁 Request file:', req.file ? 'File present' : 'No file');

    const { uid, question, solution, file_type, page_solutions, current_page, processing_complete } = req.body;

    if (!uid) {
      console.error('❌ Missing UID in request');
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('👤 Processing homework for user:', uid);

    let fileUrl = null;
    let fileName = null;
    let filePath = null;

    const supabase = getSupabaseAdmin();

    // Handle file upload if present
    if (req.file) {
      console.log('📁 Processing file upload:', req.file.originalname);
      const fileExtension = req.file.originalname.split('.').pop();
      fileName = `${uuidv4()}.${fileExtension}`;
      filePath = `homework/${uid}/${fileName}`;

      console.log('☁️ Uploading to Supabase storage:', filePath);

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('homework-files')
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Supabase upload error:', error);
        return res.status(500).json({ error: 'Failed to upload file to storage', details: error.message });
      }

      console.log('✅ File uploaded successfully');

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('homework-files')
        .getPublicUrl(filePath);

      fileUrl = publicUrl;
      console.log('🔗 File public URL:', fileUrl);
    }

    // Parse page solutions if provided
    let parsedPageSolutions = null;
    if (page_solutions) {
      try {
        parsedPageSolutions = typeof page_solutions === 'string' ? JSON.parse(page_solutions) : page_solutions;
        console.log('📄 Parsed page solutions:', parsedPageSolutions);
      } catch (e) {
        console.error('❌ Error parsing page solutions:', e);
      }
    }

    console.log('🗄️ Inserting homework record into database');

    // Insert homework record into database
    const insertData = {
      user_id: uid,
      file_name: req.file ? req.file.originalname : null,
      file_url: fileUrl,
      file_path: filePath,
      file_type: file_type || (req.file ? req.file.mimetype : 'text'),
      question: question || '',
      solution: solution || '',
      page_solutions: parsedPageSolutions,
      current_page: current_page ? parseInt(current_page) : 0,
      processing_complete: processing_complete === 'true' || processing_complete === true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📋 Insert data:', insertData);

    const { data: homeworkData, error: dbError } = await supabase
      .from('homework_submissions')
      .insert(insertData)
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database insert error:', dbError);
      
      // Check if table doesn't exist
      if (dbError.message && dbError.message.includes('relation "homework_submissions" does not exist')) {
        return res.status(500).json({ 
          error: 'Database table not found', 
          details: 'Please run the SQL script to create the homework_submissions table',
          dbError: dbError.message 
        });
      }
      
      return res.status(500).json({ error: 'Failed to save homework to database', details: dbError.message });
    }

    console.log('✅ Homework saved successfully:', homeworkData.id);

    res.json({
      success: true,
      homework: {
        id: homeworkData.id,
        fileName: homeworkData.file_name,
        fileUrl: homeworkData.file_url,
        question: homeworkData.question,
        solution: homeworkData.solution,
        fileType: homeworkData.file_type,
        pageSolutions: homeworkData.page_solutions,
        currentPage: homeworkData.current_page,
        processingComplete: homeworkData.processing_complete,
        timestamp: homeworkData.created_at
      }
    });
  } catch (error) {
    console.error('❌ Submit homework error:', error);
    res.status(500).json({ 
      error: 'Failed to submit homework', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get homework history for a user
router.get('/history/:uid', async (req, res) => {
  try {
    console.log('📚 Fetching homework history');
    const { uid } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    if (!uid) {
      console.error('❌ Missing UID in history request');
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('👤 Fetching history for user:', uid);

    const supabase = getSupabaseAdmin();

    // Test database connection first
    try {
      const { data: testData, error: testError } = await supabase
        .from('homework_submissions')
        .select('count')
        .limit(1);
      
      if (testError && testError.message.includes('relation "homework_submissions" does not exist')) {
        console.error('❌ Table does not exist');
        return res.status(500).json({ 
          error: 'Database table not found', 
          details: 'Please run the SQL script to create the homework_submissions table' 
        });
      }
    } catch (testErr) {
      console.error('❌ Database connection test failed:', testErr);
    }

    // Fetch homework history from database
    const { data: historyData, error: dbError } = await supabase
      .from('homework_submissions')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (dbError) {
      console.error('❌ Database fetch error:', dbError);
      return res.status(500).json({ error: 'Failed to fetch homework history', details: dbError.message });
    }

    console.log('✅ Found', historyData.length, 'homework entries');

    // Transform data to match frontend format
    const transformedHistory = historyData.map(item => ({
      id: item.id.toString(),
      fileName: item.file_name,
      fileUrl: item.file_url,
      question: item.question,
      answer: item.solution, // Frontend expects 'answer' field
      fileType: item.file_type,
      pageSolutions: item.page_solutions,
      currentPage: item.current_page,
      overallProcessingComplete: item.processing_complete,
      timestamp: new Date(item.created_at)
    }));

    res.json({
      success: true,
      history: transformedHistory,
      total: transformedHistory.length
    });
  } catch (error) {
    console.error('❌ Get homework history error:', error);
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
    const { solution, page_solutions, current_page, processing_complete } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Homework ID is required' });
    }

    const supabase = getSupabaseAdmin();

    // Parse page solutions if provided
    let parsedPageSolutions = null;
    if (page_solutions) {
      try {
        parsedPageSolutions = typeof page_solutions === 'string' ? JSON.parse(page_solutions) : page_solutions;
      } catch (e) {
        console.error('Error parsing page solutions:', e);
      }
    }

    // Update homework record
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (solution !== undefined) updateData.solution = solution;
    if (parsedPageSolutions !== null) updateData.page_solutions = parsedPageSolutions;
    if (current_page !== undefined) updateData.current_page = parseInt(current_page);
    if (processing_complete !== undefined) updateData.processing_complete = processing_complete === 'true' || processing_complete === true;

    const { data: updatedData, error: dbError } = await supabase
      .from('homework_submissions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      console.error('Database update error:', dbError);
      return res.status(500).json({ error: 'Failed to update homework', details: dbError.message });
    }

    res.json({
      success: true,
      homework: {
        id: updatedData.id,
        solution: updatedData.solution,
        pageSolutions: updatedData.page_solutions,
        currentPage: updatedData.current_page,
        processingComplete: updatedData.processing_complete,
        updatedAt: updatedData.updated_at
      }
    });
  } catch (error) {
    console.error('Update homework error:', error);
    res.status(500).json({ error: 'Failed to update homework' });
  }
});

// Delete homework entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.query;

    if (!id || !uid) {
      return res.status(400).json({ error: 'Homework ID and User ID are required' });
    }

    const supabase = getSupabaseAdmin();

    // First, get the homework to check file path
    const { data: homeworkData, error: fetchError } = await supabase
      .from('homework_submissions')
      .select('file_path, user_id')
      .eq('id', id)
      .eq('user_id', uid)
      .single();

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch homework', details: fetchError.message });
    }

    if (!homeworkData) {
      return res.status(404).json({ error: 'Homework not found or unauthorized' });
    }

    // Delete file from storage if it exists
    if (homeworkData.file_path) {
      const { error: storageError } = await supabase.storage
        .from('homework-files')
        .remove([homeworkData.file_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        // Don't fail the entire operation if file deletion fails
      }
    }

    // Delete homework record from database
    const { error: dbError } = await supabase
      .from('homework_submissions')
      .delete()
      .eq('id', id)
      .eq('user_id', uid);

    if (dbError) {
      console.error('Database delete error:', dbError);
      return res.status(500).json({ error: 'Failed to delete homework', details: dbError.message });
    }

    res.json({
      success: true,
      message: 'Homework deleted successfully'
    });
  } catch (error) {
    console.error('Delete homework error:', error);
    res.status(500).json({ error: 'Failed to delete homework' });
  }
});

// Get specific homework by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.query;

    if (!id || !uid) {
      return res.status(400).json({ error: 'Homework ID and User ID are required' });
    }

    const supabase = getSupabaseAdmin();

    // Fetch specific homework
    const { data: homeworkData, error: dbError } = await supabase
      .from('homework_submissions')
      .select('*')
      .eq('id', id)
      .eq('user_id', uid)
      .single();

    if (dbError) {
      console.error('Database fetch error:', dbError);
      return res.status(500).json({ error: 'Failed to fetch homework', details: dbError.message });
    }

    if (!homeworkData) {
      return res.status(404).json({ error: 'Homework not found or unauthorized' });
    }

    // Transform data to match frontend format
    const transformedHomework = {
      id: homeworkData.id.toString(),
      fileName: homeworkData.file_name,
      fileUrl: homeworkData.file_url,
      question: homeworkData.question,
      answer: homeworkData.solution,
      fileType: homeworkData.file_type,
      pageSolutions: homeworkData.page_solutions,
      currentPage: homeworkData.current_page,
      overallProcessingComplete: homeworkData.processing_complete,
      timestamp: new Date(homeworkData.created_at)
    };

    res.json({
      success: true,
      homework: transformedHomework
    });
  } catch (error) {
    console.error('Get homework error:', error);
    res.status(500).json({ error: 'Failed to fetch homework' });
  }
});

export default router; 