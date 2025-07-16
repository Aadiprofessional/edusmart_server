const { supabaseAdmin } = require('../utils/supabase');

const getSupabaseAdmin = () => supabaseAdmin();

// Save document summary (create new)
const saveDocumentSummary = async (data) => {
  try {
    console.log('📝 Document Summarizer Controller: Saving document summary');
    
    const {
      uid,
      title,
      summary,
      sourceType,
      textInput,
      fileName,
      fileType,
      fileSize,
      documentPages,
      pageSummaries,
      mindmapData,
      metadata = {}
    } = data;

    // Validate required fields
    if (!uid || !title || !summary || !sourceType) {
      return {
        status: 400,
        data: { 
          error: 'Missing required fields', 
          details: 'uid, title, summary, and sourceType are required' 
        }
      };
    }

    // Validate sourceType
    if (!['file', 'text'].includes(sourceType)) {
      return {
        status: 400,
        data: { 
          error: 'Invalid source type', 
          details: 'sourceType must be either "file" or "text"' 
        }
      };
    }

    const supabase = getSupabaseAdmin();
    
    // Insert document summary
    const { data: documentSummary, error } = await supabase
      .from('document_summaries')
      .insert({
        user_id: uid,
        title: title.trim(),
        summary,
        source_type: sourceType,
        text_input: textInput || null,
        file_name: fileName || null,
        file_type: fileType || null,
        file_size: fileSize || null,
        document_pages: documentPages || null,
        page_summaries: pageSummaries || null,
        mindmap_data: mindmapData || null,
        processing_status: 'completed',
        metadata: {
          ...metadata,
          created_by: 'document_summarizer_controller',
          version: '1.0'
        }
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return {
        status: 500,
        data: { 
          error: 'Failed to save document summary', 
          details: error.message 
        }
      };
    }

    console.log('✅ Document summary saved successfully:', documentSummary.id);
    return {
      status: 201,
      data: {
        success: true,
        message: 'Document summary saved successfully',
        documentSummary
      }
    };

  } catch (error) {
    console.error('❌ Controller error:', error);
    return {
      status: 500,
      data: { 
        error: 'Internal server error', 
        details: error.message 
      }
    };
  }
};

// Update existing document summary
const updateDocumentSummary = async (documentId, data) => {
  try {
    console.log('🔄 Document Summarizer Controller: Updating document summary');
    
    const {
      uid,
      title,
      summary,
      mindmapData,
      metadata
    } = data;

    // Validate required fields
    if (!uid || !documentId) {
      return {
        status: 400,
        data: { 
          error: 'Missing required fields', 
          details: 'uid and documentId are required' 
        }
      };
    }

    const supabase = getSupabaseAdmin();
    
    // Prepare update object with only provided fields
    const updateObj = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateObj.title = title.trim();
    if (summary !== undefined) updateObj.summary = summary;
    if (mindmapData !== undefined) updateObj.mindmap_data = mindmapData;
    if (metadata !== undefined) {
      updateObj.metadata = {
        ...metadata,
        updated_by: 'document_summarizer_controller',
        last_updated: new Date().toISOString()
      };
    }

    // Update document summary with user verification
    const { data: documentSummary, error } = await supabase
      .from('document_summaries')
      .update(updateObj)
      .eq('id', documentId)
      .eq('user_id', uid)
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return {
        status: 500,
        data: { 
          error: 'Failed to update document summary', 
          details: error.message 
        }
      };
    }

    if (!documentSummary) {
      return {
        status: 404,
        data: { 
          error: 'Document summary not found or access denied', 
          details: 'Document may not exist or you do not have permission to update it' 
        }
      };
    }

    console.log('✅ Document summary updated successfully:', documentSummary.id);
    return {
      status: 200,
      data: {
        success: true,
        message: 'Document summary updated successfully',
        documentSummary
      }
    };

  } catch (error) {
    console.error('❌ Controller error:', error);
    return {
      status: 500,
      data: { 
        error: 'Internal server error', 
        details: error.message 
      }
    };
  }
};

// Get document summary history for a user
const getDocumentSummaryHistory = async (userId, queryParams = {}) => {
  try {
    console.log('📚 Document Summarizer Controller: Fetching document summary history');
    
    if (!userId) {
      return {
        status: 400,
        data: { 
          error: 'Missing required parameter', 
          details: 'userId is required' 
        }
      };
    }

    const {
      page = 1,
      limit = 10,
      sourceType
    } = queryParams;

    const supabase = getSupabaseAdmin();
    
    // Build query
    let query = supabase
      .from('document_summaries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Add source type filter if provided
    if (sourceType && ['file', 'text'].includes(sourceType)) {
      query = query.eq('source_type', sourceType);
    }

    // Add pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: documentHistory, error, count } = await query;

    if (error) {
      console.error('❌ Database error:', error);
      return {
        status: 500,
        data: { 
          error: 'Failed to fetch document summary history', 
          details: error.message 
        }
      };
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('document_summaries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.warn('⚠️ Could not get total count:', countError);
    }

    const totalItems = totalCount || documentHistory.length;
    const totalPages = Math.ceil(totalItems / limit);

    console.log(`✅ Retrieved ${documentHistory.length} document summaries for user ${userId}`);
    return {
      status: 200,
      data: {
        success: true,
        documentHistory,
        pagination: {
          totalItems,
          totalPages,
          currentPage: parseInt(page),
          itemsPerPage: parseInt(limit)
        }
      }
    };

  } catch (error) {
    console.error('❌ Controller error:', error);
    return {
      status: 500,
      data: { 
        error: 'Internal server error', 
        details: error.message 
      }
    };
  }
};

// Get specific document summary by ID
const getDocumentSummary = async (documentId, userId) => {
  try {
    console.log('📄 Document Summarizer Controller: Fetching document summary');
    
    if (!documentId || !userId) {
      return {
        status: 400,
        data: { 
          error: 'Missing required parameters', 
          details: 'documentId and userId are required' 
        }
      };
    }

    const supabase = getSupabaseAdmin();
    
    const { data: documentSummary, error } = await supabase
      .from('document_summaries')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          status: 404,
          data: { 
            error: 'Document summary not found', 
            details: 'Document may not exist or you do not have permission to view it' 
          }
        };
      }
      console.error('❌ Database error:', error);
      return {
        status: 500,
        data: { 
          error: 'Failed to fetch document summary', 
          details: error.message 
        }
      };
    }

    console.log('✅ Document summary retrieved successfully:', documentSummary.id);
    return {
      status: 200,
      data: {
        success: true,
        documentSummary
      }
    };

  } catch (error) {
    console.error('❌ Controller error:', error);
    return {
      status: 500,
      data: { 
        error: 'Internal server error', 
        details: error.message 
      }
    };
  }
};

// Delete document summary
const deleteDocumentSummary = async (documentId, userId) => {
  try {
    console.log('🗑️ Document Summarizer Controller: Deleting document summary');
    
    if (!documentId || !userId) {
      return {
        status: 400,
        data: { 
          error: 'Missing required parameters', 
          details: 'documentId and userId are required' 
        }
      };
    }

    const supabase = getSupabaseAdmin();
    
    const { data: deletedSummary, error } = await supabase
      .from('document_summaries')
      .delete()
      .eq('id', documentId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          status: 404,
          data: { 
            error: 'Document summary not found', 
            details: 'Document may not exist or you do not have permission to delete it' 
          }
        };
      }
      console.error('❌ Database error:', error);
      return {
        status: 500,
        data: { 
          error: 'Failed to delete document summary', 
          details: error.message 
        }
      };
    }

    console.log('✅ Document summary deleted successfully:', deletedSummary.id);
    return {
      status: 200,
      data: {
        success: true,
        message: 'Document summary deleted successfully'
      }
    };

  } catch (error) {
    console.error('❌ Controller error:', error);
    return {
      status: 500,
      data: { 
        error: 'Internal server error', 
        details: error.message 
      }
    };
  }
};

// Get document summary statistics
const getDocumentSummaryStats = async (userId) => {
  try {
    console.log('📊 Document Summarizer Controller: Fetching document summary statistics');
    
    if (!userId) {
      return {
        status: 400,
        data: { 
          error: 'Missing required parameter', 
          details: 'userId is required' 
        }
      };
    }

    const supabase = getSupabaseAdmin();
    
    // Get total summaries
    const { count: totalSummaries, error: totalError } = await supabase
      .from('document_summaries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (totalError) {
      console.error('❌ Database error getting total summaries:', totalError);
      return {
        status: 500,
        data: { 
          error: 'Failed to fetch statistics', 
          details: totalError.message 
        }
      };
    }

    // Get file summaries count
    const { count: fileSummaries, error: fileError } = await supabase
      .from('document_summaries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('source_type', 'file');

    if (fileError) {
      console.error('❌ Database error getting file summaries:', fileError);
    }

    // Get text summaries count
    const { count: textSummaries, error: textError } = await supabase
      .from('document_summaries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('source_type', 'text');

    if (textError) {
      console.error('❌ Database error getting text summaries:', textError);
    }

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { count: recentActivity, error: recentError } = await supabase
      .from('document_summaries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo.toISOString());

    if (recentError) {
      console.error('❌ Database error getting recent activity:', recentError);
    }

    const statistics = {
      totalSummaries: totalSummaries || 0,
      fileSummaries: fileSummaries || 0,
      textSummaries: textSummaries || 0,
      recentActivity: recentActivity || 0
    };

    console.log('✅ Document summary statistics retrieved successfully:', statistics);
    return {
      status: 200,
      data: {
        success: true,
        statistics
      }
    };

  } catch (error) {
    console.error('❌ Controller error:', error);
    return {
      status: 500,
      data: { 
        error: 'Internal server error', 
        details: error.message 
      }
    };
  }
};

module.exports = {
  saveDocumentSummary,
  updateDocumentSummary,
  getDocumentSummaryHistory,
  getDocumentSummary,
  deleteDocumentSummary,
  getDocumentSummaryStats
}; 