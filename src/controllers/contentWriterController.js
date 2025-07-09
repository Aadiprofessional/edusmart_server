const { supabase, supabaseAdmin } = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');

// Save generated content
const saveContent = async (req, res) => {
  try {
    const { 
      uid, 
      title, 
      prompt, 
      generatedContent, 
      templateType, 
      contentType, 
      wordCount, 
      tone, 
      fontSize, 
      metadata 
    } = req.body;

    if (!uid || !title || !prompt || !generatedContent) {
      return res.status(400).json({ 
        error: 'Missing required fields: uid, title, prompt, and generatedContent are required' 
      });
    }

    const insertData = {
      id: uuidv4(),
      user_id: uid,
      title,
      prompt,
      generated_content: generatedContent,
      template_type: templateType || 'essay',
      content_type: contentType || 'essay',
      word_count: wordCount || 500,
      tone: tone || 'academic',
      font_size: fontSize || 16,
      metadata: metadata || {}
    };

    const { data: content, error } = await supabaseAdmin()
      .from('content_writer')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Error saving content:', error);
      return res.status(500).json({ 
        error: 'Failed to save content', 
        details: error.message 
      });
    }

    res.status(201).json({ 
      message: 'Content saved successfully', 
      content 
    });
  } catch (error) {
    console.error('Save content error:', error);
    res.status(500).json({ 
      error: 'Server error saving content',
      details: error.message 
    });
  }
};

// Get content history for a user
const getContentHistory = async (req, res) => {
  try {
    const { uid } = req.params;
    const { page = 1, limit = 10, templateType, contentType } = req.query;
    
    if (!uid) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const offset = (page - 1) * limit;
    
    let query = supabaseAdmin()
      .from('content_writer')
      .select('*', { count: 'exact' })
      .eq('user_id', uid);

    // Apply filters if provided
    if (templateType) {
      query = query.eq('template_type', templateType);
    }
    
    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    // Apply pagination and ordering
    const { data: contentHistory, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching content history:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch content history', 
        details: error.message 
      });
    }

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      contentHistory,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get content history error:', error);
    res.status(500).json({ 
      error: 'Server error fetching content history',
      details: error.message 
    });
  }
};

// Get specific content by ID
const getContentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Content ID is required' });
    }

    if (!uid) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const { data: content, error } = await supabaseAdmin()
      .from('content_writer')
      .select('*')
      .eq('id', id)
      .eq('user_id', uid)
      .single();

    if (error) {
      console.error('Error fetching content:', error);
      return res.status(404).json({ error: 'Content not found' });
    }

    res.status(200).json({ content });
  } catch (error) {
    console.error('Get content by ID error:', error);
    res.status(500).json({ 
      error: 'Server error fetching content',
      details: error.message 
    });
  }
};

// Update existing content
const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      uid,
      title, 
      prompt, 
      generatedContent, 
      templateType, 
      contentType, 
      wordCount, 
      tone, 
      fontSize, 
      metadata 
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Content ID is required' });
    }

    if (!uid) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // First check if the content exists and belongs to the user
    const { data: existingContent, error: fetchError } = await supabaseAdmin()
      .from('content_writer')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingContent) {
      return res.status(404).json({ error: 'Content not found' });
    }

    if (existingContent.user_id !== uid) {
      return res.status(403).json({ error: 'Unauthorized: You can only update your own content' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (prompt !== undefined) updateData.prompt = prompt;
    if (generatedContent !== undefined) updateData.generated_content = generatedContent;
    if (templateType !== undefined) updateData.template_type = templateType;
    if (contentType !== undefined) updateData.content_type = contentType;
    if (wordCount !== undefined) updateData.word_count = wordCount;
    if (tone !== undefined) updateData.tone = tone;
    if (fontSize !== undefined) updateData.font_size = fontSize;
    if (metadata !== undefined) updateData.metadata = metadata;

    const { data: updatedContent, error } = await supabaseAdmin()
      .from('content_writer')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', uid)
      .select()
      .single();

    if (error) {
      console.error('Error updating content:', error);
      return res.status(500).json({ 
        error: 'Failed to update content', 
        details: error.message 
      });
    }

    res.status(200).json({ 
      message: 'Content updated successfully', 
      content: updatedContent 
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({ 
      error: 'Server error updating content',
      details: error.message 
    });
  }
};

// Delete content
const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Content ID is required' });
    }

    if (!uid) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // First check if the content exists and belongs to the user
    const { data: existingContent, error: fetchError } = await supabaseAdmin()
      .from('content_writer')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingContent) {
      return res.status(404).json({ error: 'Content not found' });
    }

    if (existingContent.user_id !== uid) {
      return res.status(403).json({ error: 'Unauthorized: You can only delete your own content' });
    }

    const { error } = await supabaseAdmin()
      .from('content_writer')
      .delete()
      .eq('id', id)
      .eq('user_id', uid);

    if (error) {
      console.error('Error deleting content:', error);
      return res.status(500).json({ 
        error: 'Failed to delete content', 
        details: error.message 
      });
    }

    res.status(200).json({ message: 'Content deleted successfully' });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({ 
      error: 'Server error deleting content',
      details: error.message 
    });
  }
};

// Get content statistics for a user
const getContentStats = async (req, res) => {
  try {
    const { uid } = req.params;

    if (!uid) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get total count
    const { count: totalCount, error: totalError } = await supabaseAdmin()
      .from('content_writer')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid);

    if (totalError) {
      console.error('Error fetching total count:', totalError);
      return res.status(500).json({ error: 'Failed to fetch content statistics' });
    }

    // Get counts by template type
    const { data: templateStats, error: templateError } = await supabaseAdmin()
      .from('content_writer')
      .select('template_type')
      .eq('user_id', uid);

    if (templateError) {
      console.error('Error fetching template stats:', templateError);
      return res.status(500).json({ error: 'Failed to fetch template statistics' });
    }

    // Group by template type
    const templateCounts = templateStats.reduce((acc, item) => {
      acc[item.template_type] = (acc[item.template_type] || 0) + 1;
      return acc;
    }, {});

    // Get recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { count: recentCount, error: recentError } = await supabaseAdmin()
      .from('content_writer')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid)
      .gte('created_at', weekAgo.toISOString());

    if (recentError) {
      console.error('Error fetching recent count:', recentError);
      return res.status(500).json({ error: 'Failed to fetch recent activity' });
    }

    res.status(200).json({
      totalContent: totalCount,
      templateCounts,
      recentActivity: recentCount
    });
  } catch (error) {
    console.error('Get content stats error:', error);
    res.status(500).json({ 
      error: 'Server error fetching content statistics',
      details: error.message 
    });
  }
};

module.exports = {
  saveContent,
  getContentHistory,
  getContentById,
  updateContent,
  deleteContent,
  getContentStats
}; 