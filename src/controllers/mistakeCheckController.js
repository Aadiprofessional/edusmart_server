import { supabaseAdmin } from '../utils/supabase.js';
import { v4 as uuidv4 } from 'uuid';

// Get Supabase admin client
const getSupabaseAdmin = () => supabaseAdmin();

// Helper function to handle file uploads in serverless environment
async function handleMistakeCheckFileUpload(file, uid) {
  try {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `mistake-checks/${uid}/${fileName}`;

    const supabase = getSupabaseAdmin();

    // Convert file to buffer if needed
    const fileBuffer = file instanceof File ? await file.arrayBuffer() : file;

    // Try to upload to Supabase storage
    try {
      const { data, error } = await supabase.storage
        .from('mistake-check-files')
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        // If it's a bucket not found error (common in localhost), handle gracefully
        if (error.message.includes('Bucket not found') || error.message.includes('bucket')) {
          console.warn('⚠️ Storage bucket not found (likely localhost environment), skipping file upload');
          return {
            success: true,
            url: null, // No URL since we didn't upload
            filename: fileName,
            originalName: file.name,
            path: null,
            skippedUpload: true
          };
        }
        throw error;
      }

      // Get public URL if upload succeeded
      const { data: { publicUrl } } = supabase.storage
        .from('mistake-check-files')
        .getPublicUrl(filePath);

      return {
        success: true,
        url: publicUrl,
        filename: fileName,
        originalName: file.name,
        path: filePath
      };
    } catch (storageError) {
      // Handle storage errors gracefully for development
      console.warn('⚠️ File upload to storage failed, continuing without file storage:', storageError.message);
      return {
        success: true,
        url: null, // No URL since we didn't upload
        filename: fileName,
        originalName: file.name,
        path: null,
        skippedUpload: true
      };
    }
  } catch (error) {
    console.error('❌ File upload handler error:', error);
    return { success: false, error: error.message };
  }
}

// Submit mistake check
export async function submitMistakeCheck(req) {
  try {
    console.log('🔍 Mistake check submission request received');
    
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

    const { 
      uid, 
      fileName, 
      text, 
      fileType, 
      documentPages, 
      mistakes, 
      pageMistakes, 
      extractedTexts, 
      pageMarkings, 
      markingSummary, 
      selectedMarkingStandard, 
      currentPage, 
      overallProcessingComplete 
    } = body;

    if (!uid) {
      console.error('❌ Missing UID in request');
      return { status: 400, data: { error: 'User ID is required' } };
    }

    console.log('👤 Processing mistake check for user:', uid);

    let fileUrl = null;
    let fileStorageName = null;
    let filePath = null;

    const supabase = getSupabaseAdmin();

    // Handle file upload if present
    if (file) {
      console.log('📁 Processing file upload:', file.name);
      
      const uploadResult = await handleMistakeCheckFileUpload(file, uid);
      
      if (!uploadResult.success) {
        console.error('❌ File upload error:', uploadResult.error);
        return { status: 500, data: { error: 'Failed to upload file to storage', details: uploadResult.error } };
      }

      fileUrl = uploadResult.url;
      fileStorageName = uploadResult.originalName;
      filePath = uploadResult.path;
      
      if (uploadResult.skippedUpload) {
        console.log('⚠️ File upload skipped (likely localhost environment), continuing with metadata only');
      } else {
        console.log('✅ File uploaded successfully');
      }
    }

    // Parse JSON fields if they are strings
    let parsedDocumentPages = null;
    let parsedMistakes = null;
    let parsedPageMistakes = null;
    let parsedExtractedTexts = null;
    let parsedPageMarkings = null;
    let parsedMarkingSummary = null;

    try {
      if (documentPages) {
        parsedDocumentPages = typeof documentPages === 'string' ? JSON.parse(documentPages) : documentPages;
      }
      if (mistakes) {
        parsedMistakes = typeof mistakes === 'string' ? JSON.parse(mistakes) : mistakes;
      }
      if (pageMistakes) {
        parsedPageMistakes = typeof pageMistakes === 'string' ? JSON.parse(pageMistakes) : pageMistakes;
      }
      if (extractedTexts) {
        parsedExtractedTexts = typeof extractedTexts === 'string' ? JSON.parse(extractedTexts) : extractedTexts;
      }
      if (pageMarkings) {
        parsedPageMarkings = typeof pageMarkings === 'string' ? JSON.parse(pageMarkings) : pageMarkings;
      }
      if (markingSummary) {
        parsedMarkingSummary = typeof markingSummary === 'string' ? JSON.parse(markingSummary) : markingSummary;
      }
    } catch (e) {
      console.error('❌ Error parsing JSON fields:', e);
      return { status: 400, data: { error: 'Invalid JSON in request fields' } };
    }

    console.log('🗄️ Inserting mistake check record into database');

    // Insert mistake check record into database
    const insertData = {
      user_id: uid,
      file_name: fileName || (file ? fileStorageName : null),
      file_url: fileUrl,
      file_path: filePath,
      file_type: fileType || (file ? file.type : 'text'),
      text: text || '',
      document_pages: parsedDocumentPages,
      mistakes: parsedMistakes,
      page_mistakes: parsedPageMistakes,
      extracted_texts: parsedExtractedTexts,
      page_markings: parsedPageMarkings,
      marking_summary: parsedMarkingSummary,
      selected_marking_standard: selectedMarkingStandard || 'hkdse',
      current_page: currentPage ? parseInt(currentPage) : 0,
      overall_processing_complete: overallProcessingComplete === 'true' || overallProcessingComplete === true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📋 Insert data preview:', {
      ...insertData,
      document_pages: parsedDocumentPages ? `Array(${parsedDocumentPages.length})` : null,
      mistakes: parsedMistakes ? `Array(${parsedMistakes.length})` : null,
      page_mistakes: parsedPageMistakes ? `Array(${parsedPageMistakes.length})` : null,
      extracted_texts: parsedExtractedTexts ? `Array(${parsedExtractedTexts.length})` : null
    });

    const { data: mistakeCheckData, error: dbError } = await supabase
      .from('mistake_checks')
      .insert(insertData)
      .select()
      .single();

    if (dbError) {
      console.error('❌ Database insert error:', dbError);
      
      if (dbError.message && dbError.message.includes('relation "mistake_checks" does not exist')) {
        return { 
          status: 500, 
          data: { 
            error: 'Database table not found', 
            details: 'Please run the SQL script to create the mistake_checks table',
            dbError: dbError.message 
          }
        };
      }
      
      return { status: 500, data: { error: 'Failed to save mistake check to database', details: dbError.message } };
    }

    console.log('✅ Mistake check saved successfully:', mistakeCheckData.id);

    return {
      status: 200,
      data: {
        success: true,
        mistakeCheck: {
          id: mistakeCheckData.id,
          fileName: mistakeCheckData.file_name,
          fileUrl: mistakeCheckData.file_url,
          text: mistakeCheckData.text,
          fileType: mistakeCheckData.file_type,
          documentPages: mistakeCheckData.document_pages,
          mistakes: mistakeCheckData.mistakes,
          pageMistakes: mistakeCheckData.page_mistakes,
          extractedTexts: mistakeCheckData.extracted_texts,
          pageMarkings: mistakeCheckData.page_markings,
          markingSummary: mistakeCheckData.marking_summary,
          selectedMarkingStandard: mistakeCheckData.selected_marking_standard,
          currentPage: mistakeCheckData.current_page,
          overallProcessingComplete: mistakeCheckData.overall_processing_complete,
          timestamp: mistakeCheckData.created_at
        }
      }
    };
  } catch (error) {
    console.error('❌ Submit mistake check error:', error);
    return { 
      status: 500, 
      data: { 
        error: 'Failed to submit mistake check', 
        details: error.message 
      }
    };
  }
}

// Get mistake check history
export async function getMistakeCheckHistory(uid, query) {
  try {
    console.log('📚 Fetching mistake check history');
    const limit = query.limit || 20;
    const offset = query.offset || 0;

    if (!uid) {
      console.error('❌ Missing UID in history request');
      return { status: 400, data: { error: 'User ID is required' } };
    }

    console.log('👤 Fetching history for user:', uid);

    const supabase = getSupabaseAdmin();

    // Fetch mistake check history from database
    const { data: historyData, error: dbError } = await supabase
      .from('mistake_checks')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (dbError) {
      console.error('❌ Database fetch error:', dbError);
      return { status: 500, data: { error: 'Failed to fetch mistake check history', details: dbError.message } };
    }

    console.log('✅ Found', historyData.length, 'mistake check entries');

    // Transform data to match frontend format
    const transformedHistory = historyData.map(item => ({
      id: item.id.toString(),
      fileName: item.file_name,
      fileUrl: item.file_url,
      text: item.text,
      fileType: item.file_type,
      documentPages: item.document_pages,
      mistakes: item.mistakes || [],
      pageMistakes: item.page_mistakes,
      extractedTexts: item.extracted_texts,
      pageMarkings: item.page_markings,
      markingSummary: item.marking_summary,
      selectedMarkingStandard: item.selected_marking_standard,
      currentPage: item.current_page,
      overallProcessingComplete: item.overall_processing_complete,
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
    console.error('❌ Get mistake check history error:', error);
    return { 
      status: 500, 
      data: { 
        error: 'Failed to fetch mistake check history', 
        details: error.message 
      }
    };
  }
}

// Update mistake check
export async function updateMistakeCheck(id, body) {
  try {
    const { 
      text, 
      mistakes, 
      pageMistakes, 
      extractedTexts, 
      pageMarkings, 
      markingSummary, 
      selectedMarkingStandard, 
      currentPage, 
      overallProcessingComplete 
    } = body;

    if (!id) {
      return { status: 400, data: { error: 'Mistake check ID is required' } };
    }

    const supabase = getSupabaseAdmin();

    // Parse JSON fields if they are strings
    let parsedMistakes = null;
    let parsedPageMistakes = null;
    let parsedExtractedTexts = null;
    let parsedPageMarkings = null;
    let parsedMarkingSummary = null;

    try {
      if (mistakes !== undefined) {
        parsedMistakes = typeof mistakes === 'string' ? JSON.parse(mistakes) : mistakes;
      }
      if (pageMistakes !== undefined) {
        parsedPageMistakes = typeof pageMistakes === 'string' ? JSON.parse(pageMistakes) : pageMistakes;
      }
      if (extractedTexts !== undefined) {
        parsedExtractedTexts = typeof extractedTexts === 'string' ? JSON.parse(extractedTexts) : extractedTexts;
      }
      if (pageMarkings !== undefined) {
        parsedPageMarkings = typeof pageMarkings === 'string' ? JSON.parse(pageMarkings) : pageMarkings;
      }
      if (markingSummary !== undefined) {
        parsedMarkingSummary = typeof markingSummary === 'string' ? JSON.parse(markingSummary) : markingSummary;
      }
    } catch (e) {
      console.error('Error parsing JSON fields:', e);
      return { status: 400, data: { error: 'Invalid JSON in request fields' } };
    }

    // Update mistake check record
    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (text !== undefined) updateData.text = text;
    if (parsedMistakes !== null) updateData.mistakes = parsedMistakes;
    if (parsedPageMistakes !== null) updateData.page_mistakes = parsedPageMistakes;
    if (parsedExtractedTexts !== null) updateData.extracted_texts = parsedExtractedTexts;
    if (parsedPageMarkings !== null) updateData.page_markings = parsedPageMarkings;
    if (parsedMarkingSummary !== null) updateData.marking_summary = parsedMarkingSummary;
    if (selectedMarkingStandard !== undefined) updateData.selected_marking_standard = selectedMarkingStandard;
    if (currentPage !== undefined) updateData.current_page = parseInt(currentPage);
    if (overallProcessingComplete !== undefined) updateData.overall_processing_complete = overallProcessingComplete === 'true' || overallProcessingComplete === true;

    const { data: updatedData, error: dbError } = await supabase
      .from('mistake_checks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      console.error('Database update error:', dbError);
      return { status: 500, data: { error: 'Failed to update mistake check', details: dbError.message } };
    }

    return {
      status: 200,
      data: {
        success: true,
        mistakeCheck: {
          id: updatedData.id,
          text: updatedData.text,
          mistakes: updatedData.mistakes,
          pageMistakes: updatedData.page_mistakes,
          extractedTexts: updatedData.extracted_texts,
          pageMarkings: updatedData.page_markings,
          markingSummary: updatedData.marking_summary,
          selectedMarkingStandard: updatedData.selected_marking_standard,
          currentPage: updatedData.current_page,
          overallProcessingComplete: updatedData.overall_processing_complete,
          updatedAt: updatedData.updated_at
        }
      }
    };
  } catch (error) {
    console.error('Update mistake check error:', error);
    return { status: 500, data: { error: 'Failed to update mistake check' } };
  }
}

// Delete mistake check
export async function deleteMistakeCheck(id, uid) {
  try {
    if (!id || !uid) {
      return { status: 400, data: { error: 'Mistake check ID and User ID are required' } };
    }

    const supabase = getSupabaseAdmin();

    // First, get the mistake check to check file path
    const { data: mistakeCheckData, error: fetchError } = await supabase
      .from('mistake_checks')
      .select('file_path, user_id')
      .eq('id', id)
      .eq('user_id', uid)
      .single();

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return { status: 500, data: { error: 'Failed to fetch mistake check', details: fetchError.message } };
    }

    if (!mistakeCheckData) {
      return { status: 404, data: { error: 'Mistake check not found or unauthorized' } };
    }

    // Delete file from storage if it exists
    if (mistakeCheckData.file_path) {
      const { error: storageError } = await supabase.storage
        .from('mistake-check-files')
        .remove([mistakeCheckData.file_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        // Don't fail the entire operation if file deletion fails
      }
    }

    // Delete mistake check record from database
    const { error: dbError } = await supabase
      .from('mistake_checks')
      .delete()
      .eq('id', id)
      .eq('user_id', uid);

    if (dbError) {
      console.error('Database delete error:', dbError);
      return { status: 500, data: { error: 'Failed to delete mistake check', details: dbError.message } };
    }

    return {
      status: 200,
      data: {
        success: true,
        message: 'Mistake check deleted successfully'
      }
    };
  } catch (error) {
    console.error('Delete mistake check error:', error);
    return { status: 500, data: { error: 'Failed to delete mistake check' } };
  }
}

// Get mistake check by ID
export async function getMistakeCheckById(id, uid) {
  try {
    if (!id || !uid) {
      return { status: 400, data: { error: 'Mistake check ID and User ID are required' } };
    }

    const supabase = getSupabaseAdmin();

    // Fetch specific mistake check
    const { data: mistakeCheckData, error: dbError } = await supabase
      .from('mistake_checks')
      .select('*')
      .eq('id', id)
      .eq('user_id', uid)
      .single();

    if (dbError) {
      console.error('Database fetch error:', dbError);
      return { status: 500, data: { error: 'Failed to fetch mistake check', details: dbError.message } };
    }

    if (!mistakeCheckData) {
      return { status: 404, data: { error: 'Mistake check not found or unauthorized' } };
    }

    // Transform data to match frontend format
    const transformedMistakeCheck = {
      id: mistakeCheckData.id.toString(),
      fileName: mistakeCheckData.file_name,
      fileUrl: mistakeCheckData.file_url,
      text: mistakeCheckData.text,
      fileType: mistakeCheckData.file_type,
      documentPages: mistakeCheckData.document_pages,
      mistakes: mistakeCheckData.mistakes || [],
      pageMistakes: mistakeCheckData.page_mistakes,
      extractedTexts: mistakeCheckData.extracted_texts,
      pageMarkings: mistakeCheckData.page_markings,
      markingSummary: mistakeCheckData.marking_summary,
      selectedMarkingStandard: mistakeCheckData.selected_marking_standard,
      currentPage: mistakeCheckData.current_page,
      overallProcessingComplete: mistakeCheckData.overall_processing_complete,
      timestamp: new Date(mistakeCheckData.created_at)
    };

    return {
      status: 200,
      data: {
        success: true,
        mistakeCheck: transformedMistakeCheck
      }
    };
  } catch (error) {
    console.error('Get mistake check error:', error);
    return { status: 500, data: { error: 'Failed to fetch mistake check' } };
  }
} 