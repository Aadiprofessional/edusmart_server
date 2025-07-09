const { supabaseAdmin } = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');

// Get Supabase admin client
const getSupabaseAdmin = () => supabaseAdmin();

// Helper function to handle file uploads in serverless environment
async function handleHomeworkFileUpload(file, uid) {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `homework/${uid}/${fileName}`;

    const supabase = getSupabaseAdmin();

    // Convert file to buffer if needed
    const fileBuffer = file instanceof File ? await file.arrayBuffer() : file;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('homework-files')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('homework-files')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrl,
      filename: fileName,
      originalName: file.name,
      path: filePath
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Submit homework
const submitHomework = async (req) => {
  try {
    console.log('📝 Homework submission request received');
    
    // Parse form data for serverless environment
    let body;
    let file = null;
    
    // Check if body is already parsed (serverless environment)
    if (req.body) {
      body = req.body;
      console.log('📦 Using pre-parsed body from serverless environment');
    } else {
      // Parse body for environments where it hasn't been parsed yet
      const contentType = req.headers.get ? req.headers.get('content-type') : req.headers['content-type'];
      
      if (contentType?.includes('multipart/form-data')) {
        const formData = await req.formData();
        body = {};
        
        // Extract form fields
        for (const [key, value] of formData.entries()) {
          if (key === 'file' && value instanceof File) {
            file = value;
          } else {
            body[key] = value;
          }
        }
      } else {
        // For JSON requests, parse once and store
        body = await req.json();
      }
    }

    const { uid, question, solution, file_type, page_solutions, current_page, processing_complete } = body;

    if (!uid) {
      console.error('❌ Missing UID in request');
      return { status: 400, data: { error: 'User ID is required' } };
    }

    console.log('👤 Processing homework for user:', uid);

    let fileUrl = null;
    let fileName = null;
    let filePath = null;

    const supabase = getSupabaseAdmin();

    // Handle file upload if present
    if (file) {
      console.log('📁 Processing file upload:', file.name);
      
      const uploadResult = await handleHomeworkFileUpload(file, uid);
      
      if (!uploadResult.success) {
        console.error('❌ File upload error:', uploadResult.error);
        return { status: 500, data: { error: 'Failed to upload file to storage', details: uploadResult.error } };
      }

      fileUrl = uploadResult.url;
      fileName = uploadResult.originalName;
      filePath = uploadResult.path;
      console.log('✅ File uploaded successfully');
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
      file_name: fileName,
      file_url: fileUrl,
      file_path: filePath,
      file_type: file_type || (file ? file.type : 'text'),
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
      
      if (dbError.message && dbError.message.includes('relation "homework_submissions" does not exist')) {
        return { 
          status: 500, 
          data: { 
            error: 'Database table not found', 
            details: 'Please run the SQL script to create the homework_submissions table',
            dbError: dbError.message 
          }
        };
      }
      
      return { status: 500, data: { error: 'Failed to save homework to database', details: dbError.message } };
    }

    console.log('✅ Homework saved successfully:', homeworkData.id);

    return {
      status: 200,
      data: {
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
      }
    };
  } catch (error) {
    console.error('❌ Submit homework error:', error);
    return { 
      status: 500, 
      data: { 
        error: 'Failed to submit homework', 
        details: error.message 
      }
    };
  }
};

// Get homework history
const getHomeworkHistory = async (uid, query) => {
  try {
    console.log('📚 Fetching homework history');
    const limit = query.limit || 20;
    const offset = query.offset || 0;

    if (!uid) {
      console.error('❌ Missing UID in history request');
      return { status: 400, data: { error: 'User ID is required' } };
    }

    console.log('👤 Fetching history for user:', uid);

    const supabase = getSupabaseAdmin();

    // Fetch homework history from database
    const { data: historyData, error: dbError } = await supabase
      .from('homework_submissions')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (dbError) {
      console.error('❌ Database fetch error:', dbError);
      return { status: 500, data: { error: 'Failed to fetch homework history', details: dbError.message } };
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

    return {
      status: 200,
      data: {
        success: true,
        history: transformedHistory,
        total: transformedHistory.length
      }
    };
  } catch (error) {
    console.error('❌ Get homework history error:', error);
    return { 
      status: 500, 
      data: { 
        error: 'Failed to fetch homework history', 
        details: error.message 
      }
    };
  }
};

// Update homework
const updateHomework = async (id, body) => {
  try {
    const { solution, page_solutions, current_page, processing_complete } = body;

    if (!id) {
      return { status: 400, data: { error: 'Homework ID is required' } };
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
      return { status: 500, data: { error: 'Failed to update homework', details: dbError.message } };
    }

    return {
      status: 200,
      data: {
        success: true,
        homework: {
          id: updatedData.id,
          solution: updatedData.solution,
          pageSolutions: updatedData.page_solutions,
          currentPage: updatedData.current_page,
          processingComplete: updatedData.processing_complete,
          updatedAt: updatedData.updated_at
        }
      }
    };
  } catch (error) {
    console.error('Update homework error:', error);
    return { status: 500, data: { error: 'Failed to update homework' } };
  }
};

// Delete homework
const deleteHomework = async (id, uid) => {
  try {
    if (!id || !uid) {
      return { status: 400, data: { error: 'Homework ID and User ID are required' } };
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
      return { status: 500, data: { error: 'Failed to fetch homework', details: fetchError.message } };
    }

    if (!homeworkData) {
      return { status: 404, data: { error: 'Homework not found or unauthorized' } };
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
      return { status: 500, data: { error: 'Failed to delete homework', details: dbError.message } };
    }

    return {
      status: 200,
      data: {
        success: true,
        message: 'Homework deleted successfully'
      }
    };
  } catch (error) {
    console.error('Delete homework error:', error);
    return { status: 500, data: { error: 'Failed to delete homework' } };
  }
};

// Get homework by ID
const getHomeworkById = async (id, uid) => {
  try {
    if (!id || !uid) {
      return { status: 400, data: { error: 'Homework ID and User ID are required' } };
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
      return { status: 500, data: { error: 'Failed to fetch homework', details: dbError.message } };
    }

    if (!homeworkData) {
      return { status: 404, data: { error: 'Homework not found or unauthorized' } };
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

    return {
      status: 200,
      data: {
        success: true,
        homework: transformedHomework
      }
    };
  } catch (error) {
    console.error('Get homework error:', error);
    return { status: 500, data: { error: 'Failed to fetch homework' } };
  }
};

module.exports = {
  submitHomework,
  getHomeworkHistory,
  updateHomework,
  deleteHomework,
  getHomeworkById
}; 