const { supabase, supabaseAdmin } = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');

// Get all case studies with pagination and filtering
const getCaseStudies = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, outcome, country, field, search, featured } = req.query;
    const offset = (page - 1) * limit;
    
    let query = supabase
      .from('case_studies')
      .select('*', { count: 'exact' })
      .eq('status', 'published'); // Only show published case studies
      
    // Apply filters if provided
    if (category) {
      query = query.eq('category', category);
    }
    
    if (outcome) {
      query = query.eq('outcome', outcome);
    }
    
    if (country) {
      query = query.eq('target_country', country);
    }
    
    if (field) {
      query = query.eq('field_of_study', field);
    }
    
    if (featured !== undefined) {
      query = query.eq('featured', featured === 'true');
    }
    
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,student_name.ilike.%${search}%,tags.cs.{${search}}`);
    }
    
    // Apply pagination
    const { data: caseStudies, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error('Error fetching case studies:', error);
      return res.status(500).json({ error: 'Failed to fetch case studies' });
    }
    
    // Calculate total pages
    const totalPages = Math.ceil(count / limit);
    
    res.status(200).json({
      caseStudies,
      pagination: {
        totalItems: count,
        totalPages,
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get case studies error:', error);
    res.status(500).json({ error: 'Server error fetching case studies' });
  }
};

// Get a single case study by ID
const getCaseStudyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: caseStudy, error } = await supabase
      .from('case_studies')
      .select('*')
      .eq('id', id)
      .eq('status', 'published')
      .single();
      
    if (error) {
      console.error('Error fetching case study:', error);
      return res.status(404).json({ error: 'Case study not found' });
    }
    
    // Increment view count
    await supabase
      .from('case_studies')
      .update({ views: caseStudy.views + 1 })
      .eq('id', id);
    
    res.status(200).json({ caseStudy: { ...caseStudy, views: caseStudy.views + 1 } });
  } catch (error) {
    console.error('Get case study error:', error);
    res.status(500).json({ error: 'Server error fetching case study' });
  }
};

// Create a new case study (Admin only)
const createCaseStudy = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    
    const { 
      uid,
      title,
      subtitle,
      description,
      student_name,
      student_image,
      student_background,
      previous_education,
      target_program,
      target_university,
      target_country,
      outcome,
      scholarship_amount,
      scholarship_currency,
      application_year,
      story_content,
      challenges_faced,
      strategies_used,
      advice_given,
      timeline,
      test_scores,
      documents_used,
      featured,
      category,
      field_of_study,
      tags,
      reading_time,
      status
    } = req.body;
    
    console.log('Extracted fields:', { uid, title, student_name, category, outcome });
    
    // The UID has already been verified by checkAdminByUid middleware
    const createdBy = uid;
    
    const insertData = {
      title,
      subtitle: subtitle || null,
      description,
      student_name,
      student_image: student_image || null,
      student_background: student_background || null,
      previous_education: previous_education || null,
      target_program: target_program || null,
      target_university: target_university || null,
      target_country: target_country || null,
      outcome,
      scholarship_amount: scholarship_amount || null,
      scholarship_currency: scholarship_currency || 'USD',
      application_year: application_year || null,
      story_content,
      challenges_faced: challenges_faced || [],
      strategies_used: strategies_used || [],
      advice_given: advice_given || [],
      timeline: timeline || null,
      test_scores: test_scores || null,
      documents_used: documents_used || [],
      featured: featured || false,
      category,
      field_of_study: field_of_study || null,
      tags: tags || [],
      reading_time: reading_time || 5,
      views: 0,
      likes: 0,
      status: status || 'published',
      created_by: createdBy
    };
    
    console.log('Insert data:', insertData);
    
    // Use supabaseAdmin to bypass RLS
    const { data: caseStudy, error } = await supabaseAdmin
      .from('case_studies')
      .insert([insertData])
      .select()
      .single();
      
    if (error) {
      console.error('Supabase error creating case study:', error);
      return res.status(500).json({ error: 'Failed to create case study', details: error.message });
    }
    
    console.log('Case study created successfully:', caseStudy);
    
    res.status(201).json({ 
      message: 'Case study created successfully', 
      caseStudy 
    });
  } catch (error) {
    console.error('Create case study error:', error);
    res.status(500).json({ error: 'Server error creating case study', details: error.message });
  }
};

// Update an existing case study (Admin only)
const updateCaseStudy = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      uid,
      title,
      subtitle,
      description,
      student_name,
      student_image,
      student_background,
      previous_education,
      target_program,
      target_university,
      target_country,
      outcome,
      scholarship_amount,
      scholarship_currency,
      application_year,
      story_content,
      challenges_faced,
      strategies_used,
      advice_given,
      timeline,
      test_scores,
      documents_used,
      featured,
      category,
      field_of_study,
      tags,
      reading_time,
      status
    } = req.body;
    
    // First check if the case study exists
    const { data: existingCaseStudy, error: fetchError } = await supabase
      .from('case_studies')
      .select('created_by')
      .eq('id', id)
      .single();
      
    if (fetchError || !existingCaseStudy) {
      return res.status(404).json({ error: 'Case study not found' });
    }
    
    // Update the case study using admin client (admin can update any case study)
    const { data: updatedCaseStudy, error } = await supabaseAdmin
      .from('case_studies')
      .update({
        title,
        subtitle,
        description,
        student_name,
        student_image,
        student_background,
        previous_education,
        target_program,
        target_university,
        target_country,
        outcome,
        scholarship_amount,
        scholarship_currency,
        application_year,
        story_content,
        challenges_faced,
        strategies_used,
        advice_given,
        timeline,
        test_scores,
        documents_used,
        featured,
        category,
        field_of_study,
        tags,
        reading_time,
        status,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating case study:', error);
      return res.status(500).json({ error: 'Failed to update case study' });
    }
    
    res.status(200).json({ 
      message: 'Case study updated successfully', 
      caseStudy: updatedCaseStudy 
    });
  } catch (error) {
    console.error('Update case study error:', error);
    res.status(500).json({ error: 'Server error updating case study' });
  }
};

// Delete a case study (Admin only)
const deleteCaseStudy = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid } = req.body;
    
    // First check if the case study exists
    const { data: existingCaseStudy, error: fetchError } = await supabase
      .from('case_studies')
      .select('created_by')
      .eq('id', id)
      .single();
      
    if (fetchError || !existingCaseStudy) {
      return res.status(404).json({ error: 'Case study not found' });
    }
    
    // Delete the case study using admin client (admin can delete any case study)
    const { error } = await supabaseAdmin
      .from('case_studies')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting case study:', error);
      return res.status(500).json({ error: 'Failed to delete case study' });
    }
    
    res.status(200).json({ 
      message: 'Case study deleted successfully'
    });
  } catch (error) {
    console.error('Delete case study error:', error);
    res.status(500).json({ error: 'Server error deleting case study' });
  }
};

// Get case study categories
const getCaseStudyCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('case_studies')
      .select('category')
      .eq('status', 'published')
      .order('category');
      
    if (error) {
      console.error('Error fetching case study categories:', error);
      return res.status(500).json({ error: 'Failed to fetch case study categories' });
    }
    
    // Extract unique categories
    const categories = [...new Set(data.map(caseStudy => caseStudy.category))];
    
    res.status(200).json({ categories });
  } catch (error) {
    console.error('Get case study categories error:', error);
    res.status(500).json({ error: 'Server error fetching case study categories' });
  }
};

// Get case study outcomes
const getCaseStudyOutcomes = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('case_studies')
      .select('outcome')
      .eq('status', 'published')
      .order('outcome');
      
    if (error) {
      console.error('Error fetching case study outcomes:', error);
      return res.status(500).json({ error: 'Failed to fetch case study outcomes' });
    }
    
    // Extract unique outcomes
    const outcomes = [...new Set(data.map(caseStudy => caseStudy.outcome))];
    
    res.status(200).json({ outcomes });
  } catch (error) {
    console.error('Get case study outcomes error:', error);
    res.status(500).json({ error: 'Server error fetching case study outcomes' });
  }
};

// Get case study countries
const getCaseStudyCountries = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('case_studies')
      .select('target_country')
      .eq('status', 'published')
      .not('target_country', 'is', null)
      .order('target_country');
      
    if (error) {
      console.error('Error fetching case study countries:', error);
      return res.status(500).json({ error: 'Failed to fetch case study countries' });
    }
    
    // Extract unique countries
    const countries = [...new Set(data.map(caseStudy => caseStudy.target_country))];
    
    res.status(200).json({ countries });
  } catch (error) {
    console.error('Get case study countries error:', error);
    res.status(500).json({ error: 'Server error fetching case study countries' });
  }
};

// Get case study fields of study
const getCaseStudyFields = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('case_studies')
      .select('field_of_study')
      .eq('status', 'published')
      .not('field_of_study', 'is', null)
      .order('field_of_study');
      
    if (error) {
      console.error('Error fetching case study fields:', error);
      return res.status(500).json({ error: 'Failed to fetch case study fields' });
    }
    
    // Extract unique fields
    const fields = [...new Set(data.map(caseStudy => caseStudy.field_of_study))];
    
    res.status(200).json({ fields });
  } catch (error) {
    console.error('Get case study fields error:', error);
    res.status(500).json({ error: 'Server error fetching case study fields' });
  }
};

module.exports = {
  getCaseStudies,
  getCaseStudyById,
  createCaseStudy,
  updateCaseStudy,
  deleteCaseStudy,
  getCaseStudyCategories,
  getCaseStudyOutcomes,
  getCaseStudyCountries,
  getCaseStudyFields
}; 