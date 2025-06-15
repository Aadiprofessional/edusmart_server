import { supabase, supabaseAdmin } from '../utils/supabase.js';
import { v4 as uuidv4 } from 'uuid';

// Get all responses with pagination and filtering
const getResponses = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, type, search, featured } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('responses')
      .select('*', { count: 'exact' });
      
    // Apply filters if provided
    if (category) {
      query = query.eq('category', category);
    }
    
    if (type) {
      query = query.eq('type', type);
    }
    
    if (featured !== undefined) {
      query = query.eq('featured', featured === 'true');
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,tags.cs.{${search}}`);
    }
    
    // Apply pagination
    const { data: responses, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error('Error fetching responses:', error);
      return res.status(500).json({ error: 'Failed to fetch responses' });
    }
    
    // Calculate total pages
    const totalPages = Math.ceil(count / limit);
    
    res.status(200).json({
      responses,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ error: 'Server error fetching responses' });
  }
};

// Get a single response by ID
const getResponseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: response, error } = await supabase
      .from('responses')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      console.error('Error fetching response:', error);
      return res.status(404).json({ error: 'Response not found' });
    }
    
    res.status(200).json({ response });
  } catch (error) {
    console.error('Get response error:', error);
    res.status(500).json({ error: 'Server error fetching response' });
  }
};

// Create a new response (Admin only)
const createResponse = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    
    const { 
      uid,
      title, 
      description, 
      type, 
      category, 
      url, 
      file_size,
      thumbnail,
      download_link,
      video_link,
      featured,
      tags
    } = req.body;
    
    console.log('Extracted fields:', { uid, title, description, type, category });
    
    // The UID has already been verified by checkAdminByUid middleware
    // Use a known admin UUID that exists in the profiles table
    const createdBy = 'bca2f806-29c5-4be9-bc2d-a484671546cd'; // Known admin UID
    
    const insertData = {
      title,
      description,
      type,
      category,
      url: url || null,
      file_size: file_size || null,
      thumbnail: thumbnail || null,
      download_link: download_link || null,
      video_link: video_link || null,
      featured: featured || false,
      tags: tags || [],
      downloads: 0,
      created_by: createdBy
    };
    
    console.log('Insert data:', insertData);
    
    // Use supabaseAdmin to bypass RLS
    const { data: response, error } = await supabaseAdmin
      .from('responses')
      .insert([insertData])
      .select()
      .single();
      
    if (error) {
      console.error('Supabase error creating response:', error);
      
      // If we still get a permission error, try without created_by field
      if (error.code === '42501' && error.message.includes('permission denied for table users')) {
        console.log('Trying to create response without created_by field due to database constraint issue...');
        
        // Remove created_by and try again
        const { created_by, ...insertDataWithoutCreatedBy } = insertData;
        
        const { data: response2, error: error2 } = await supabaseAdmin
          .from('responses')
          .insert([insertDataWithoutCreatedBy])
          .select()
          .single();
          
        if (error2) {
          return res.status(500).json({ 
            error: 'Database configuration error', 
            details: 'Unable to create response due to database constraints. The responses table may have foreign key issues.',
            originalError: error.message,
            fallbackError: error2.message
          });
        }
        
        console.log('Response created successfully without created_by field:', response2);
        return res.status(201).json({ 
          message: 'Response created successfully (without created_by due to database constraints)', 
          response: response2 
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to create response', 
        details: error.message || error.toString()
      });
    }
    
    if (!response) {
      return res.status(500).json({ 
        error: 'Failed to create response', 
        details: 'No response data returned from database'
      });
    }
    
    console.log('Response created successfully:', response);
    
    res.status(201).json({ 
      message: 'Response created successfully', 
      response 
    });
  } catch (error) {
    console.error('Create response error:', error);
    res.status(500).json({ error: 'Server error creating response', details: error.message });
  }
};

// Update an existing response (Admin only)
const updateResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      uid,
      title, 
      description, 
      type, 
      category, 
      url, 
      file_size,
      thumbnail,
      download_link,
      video_link,
      featured,
      tags
    } = req.body;
    
    // First check if the response exists
    const { data: existingResponse, error: fetchError } = await supabase
      .from('responses')
      .select('created_by')
      .eq('id', id)
      .single();
      
    if (fetchError || !existingResponse) {
      return res.status(404).json({ error: 'Response not found' });
    }
    
    // Update the response using admin client (admin can update any response)
    const { data: updatedResponse, error } = await supabaseAdmin
      .from('responses')
      .update({
        title,
        description,
        type,
        category,
        url,
        file_size,
        thumbnail,
        download_link,
        video_link,
        featured,
        tags,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating response:', error);
      return res.status(500).json({ error: 'Failed to update response' });
    }
    
    res.status(200).json({ 
      message: 'Response updated successfully', 
      response: updatedResponse 
    });
  } catch (error) {
    console.error('Update response error:', error);
    res.status(500).json({ error: 'Server error updating response' });
  }
};

// Delete a response (Admin only)
const deleteResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.body;
    
    // First check if the response exists
    const { data: existingResponse, error: fetchError } = await supabase
      .from('responses')
      .select('created_by')
      .eq('id', id)
      .single();
      
    if (fetchError || !existingResponse) {
      return res.status(404).json({ error: 'Response not found' });
    }
    
    // Delete the response using admin client (admin can delete any response)
    const { error } = await supabaseAdmin
      .from('responses')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting response:', error);
      return res.status(500).json({ error: 'Failed to delete response' });
    }
    
    res.status(200).json({ 
      message: 'Response deleted successfully'
    });
  } catch (error) {
    console.error('Delete response error:', error);
    res.status(500).json({ error: 'Server error deleting response' });
  }
};

// Get response categories
const getResponseCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('responses')
      .select('category')
      .order('category');
      
    if (error) {
      console.error('Error fetching response categories:', error);
      return res.status(500).json({ error: 'Failed to fetch response categories' });
    }
    
    // Extract unique categories
    const categories = [...new Set(data.map(response => response.category))];
    
    res.status(200).json({ categories });
  } catch (error) {
    console.error('Get response categories error:', error);
    res.status(500).json({ error: 'Server error fetching response categories' });
  }
};

// Get response types
const getResponseTypes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('responses')
      .select('type')
      .order('type');
      
    if (error) {
      console.error('Error fetching response types:', error);
      return res.status(500).json({ error: 'Failed to fetch response types' });
    }
    
    // Extract unique types
    const types = [...new Set(data.map(response => response.type))];
    
    res.status(200).json({ types });
  } catch (error) {
    console.error('Get response types error:', error);
    res.status(500).json({ error: 'Server error fetching response types' });
  }
};

export {
  getResponses,
  getResponseById,
  createResponse,
  updateResponse,
  deleteResponse,
  getResponseCategories,
  getResponseTypes
}; 