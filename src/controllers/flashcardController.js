const { supabase, supabaseAdmin } = require('../utils/supabase');
const { v4: uuidv4 } = require('uuid');

// Get all flashcard sets for a user
const getUserFlashcardSets = async (req, res) => {
  try {
    const { user_id, page = 1, limit = 10, search = '' } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const offset = (page - 1) * limit;

    let query = supabaseAdmin()
      .from('flashcard_sets')
      .select(`
        *,
        flashcards(*)
      `)
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: flashcardSets, error } = await query
      .range(offset, offset + parseInt(limit) - 1);

    if (error) {
      console.error('Error fetching flashcard sets:', error);
      return res.status(500).json({ error: 'Failed to fetch flashcard sets' });
    }

    // Transform the data to match frontend format
    const transformedSets = flashcardSets.map(set => ({
      id: set.id,
      name: set.name,
      description: set.description,
      createdAt: new Date(set.created_at),
      source: set.source,
      sourceFile: set.source_file,
      flashcards: set.flashcards.map(card => ({
        id: card.id,
        question: card.question,
        answer: card.answer,
        mastered: card.mastered
      }))
    }));

    res.status(200).json({
      success: true,
      flashcardSets: transformedSets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: flashcardSets.length
      }
    });
  } catch (error) {
    console.error('Get flashcard sets error:', error);
    res.status(500).json({ error: 'Server error fetching flashcard sets' });
  }
};

// Get a specific flashcard set by ID
const getFlashcardSetById = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const { data: flashcardSet, error } = await supabaseAdmin()
      .from('flashcard_sets')
      .select(`
        *,
        flashcards(*)
      `)
      .eq('id', id)
      .eq('user_id', user_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Flashcard set not found' });
      }
      console.error('Error fetching flashcard set:', error);
      return res.status(500).json({ error: 'Failed to fetch flashcard set' });
    }

    // Transform the data to match frontend format
    const transformedSet = {
      id: flashcardSet.id,
      name: flashcardSet.name,
      description: flashcardSet.description,
      createdAt: new Date(flashcardSet.created_at),
      source: flashcardSet.source,
      sourceFile: flashcardSet.source_file,
      flashcards: flashcardSet.flashcards.map(card => ({
        id: card.id,
        question: card.question,
        answer: card.answer,
        mastered: card.mastered
      }))
    };

    res.status(200).json({
      success: true,
      flashcardSet: transformedSet
    });
  } catch (error) {
    console.error('Get flashcard set by ID error:', error);
    res.status(500).json({ error: 'Server error fetching flashcard set' });
  }
};

// Create a new flashcard set
const createFlashcardSet = async (req, res) => {
  try {
    const { user_id, name, description, source = 'manual', sourceFile = null, flashcards = [] } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const setId = uuidv4();

    // Create the flashcard set
    const { data: newSet, error: setError } = await supabaseAdmin()
      .from('flashcard_sets')
      .insert([
        {
          id: setId,
          user_id: user_id,
          name,
          description: description || '',
          source,
          source_file: sourceFile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (setError) {
      console.error('Error creating flashcard set:', setError);
      return res.status(500).json({ error: 'Failed to create flashcard set' });
    }

    // If flashcards are provided, create them
    let createdFlashcards = [];
    if (flashcards && flashcards.length > 0) {
      const flashcardInserts = flashcards.map((card, index) => ({
        id: uuidv4(),
        flashcard_set_id: setId,
        question: card.question || '',
        answer: card.answer || '',
        mastered: card.mastered || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { data: insertedCards, error: cardsError } = await supabaseAdmin()
        .from('flashcards')
        .insert(flashcardInserts)
        .select();

      if (cardsError) {
        console.error('Error creating flashcards:', cardsError);
        // Delete the set if flashcards failed to create
        await supabaseAdmin()
          .from('flashcard_sets')
          .delete()
          .eq('id', setId);
        return res.status(500).json({ error: 'Failed to create flashcards' });
      }

      createdFlashcards = insertedCards;
    }

    // Transform the data to match frontend format
    const transformedSet = {
      id: newSet.id,
      name: newSet.name,
      description: newSet.description,
      createdAt: new Date(newSet.created_at),
      source: newSet.source,
      sourceFile: newSet.source_file,
      flashcards: createdFlashcards.map(card => ({
        id: card.id,
        question: card.question,
        answer: card.answer,
        mastered: card.mastered
      }))
    };

    res.status(201).json({
      success: true,
      message: 'Flashcard set created successfully',
      flashcardSet: transformedSet
    });
  } catch (error) {
    console.error('Create flashcard set error:', error);
    res.status(500).json({ error: 'Server error creating flashcard set' });
  }
};

// Update a flashcard set
const updateFlashcardSet = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, name, description } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Check if the set exists and belongs to the user
    const { data: existingSet, error: fetchError } = await supabaseAdmin()
      .from('flashcard_sets')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id)
      .single();

    if (fetchError || !existingSet) {
      return res.status(404).json({ error: 'Flashcard set not found' });
    }

    const { data: updatedSet, error } = await supabaseAdmin()
      .from('flashcard_sets')
      .update({
        name: name || existingSet.name,
        description: description !== undefined ? description : existingSet.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating flashcard set:', error);
      return res.status(500).json({ error: 'Failed to update flashcard set' });
    }

    res.status(200).json({
      success: true,
      message: 'Flashcard set updated successfully',
      flashcardSet: {
        id: updatedSet.id,
        name: updatedSet.name,
        description: updatedSet.description,
        createdAt: new Date(updatedSet.created_at),
        source: updatedSet.source,
        sourceFile: updatedSet.source_file
      }
    });
  } catch (error) {
    console.error('Update flashcard set error:', error);
    res.status(500).json({ error: 'Server error updating flashcard set' });
  }
};

// Delete a flashcard set
const deleteFlashcardSet = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Check if the set exists and belongs to the user
    const { data: existingSet, error: fetchError } = await supabaseAdmin()
      .from('flashcard_sets')
      .select('id')
      .eq('id', id)
      .eq('user_id', user_id)
      .single();

    if (fetchError || !existingSet) {
      return res.status(404).json({ error: 'Flashcard set not found' });
    }

    // Delete all flashcards in the set first (cascade should handle this, but being explicit)
    await supabaseAdmin()
      .from('flashcards')
      .delete()
      .eq('flashcard_set_id', id);

    // Delete the flashcard set
    const { error } = await supabaseAdmin()
      .from('flashcard_sets')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);

    if (error) {
      console.error('Error deleting flashcard set:', error);
      return res.status(500).json({ error: 'Failed to delete flashcard set' });
    }

    res.status(200).json({
      success: true,
      message: 'Flashcard set deleted successfully'
    });
  } catch (error) {
    console.error('Delete flashcard set error:', error);
    res.status(500).json({ error: 'Server error deleting flashcard set' });
  }
};

// Add a flashcard to a set
const addFlashcard = async (req, res) => {
  try {
    const { setId } = req.params;
    const { user_id, question, answer, mastered = false } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    // Check if the set exists and belongs to the user
    const { data: existingSet, error: fetchError } = await supabaseAdmin()
      .from('flashcard_sets')
      .select('id')
      .eq('id', setId)
      .eq('user_id', user_id)
      .single();

    if (fetchError || !existingSet) {
      return res.status(404).json({ error: 'Flashcard set not found' });
    }

    const { data: newFlashcard, error } = await supabaseAdmin()
      .from('flashcards')
      .insert([
        {
          id: uuidv4(),
          flashcard_set_id: setId,
          question,
          answer,
          mastered,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating flashcard:', error);
      return res.status(500).json({ error: 'Failed to create flashcard' });
    }

    res.status(201).json({
      success: true,
      message: 'Flashcard created successfully',
      flashcard: {
        id: newFlashcard.id,
        question: newFlashcard.question,
        answer: newFlashcard.answer,
        mastered: newFlashcard.mastered
      }
    });
  } catch (error) {
    console.error('Add flashcard error:', error);
    res.status(500).json({ error: 'Server error creating flashcard' });
  }
};

// Update a flashcard
const updateFlashcard = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, question, answer, mastered } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Check if the flashcard exists and belongs to the user's set
    const { data: existingCard, error: fetchError } = await supabaseAdmin()
      .from('flashcards')
      .select(`
        *,
        flashcard_sets!inner(user_id)
      `)
      .eq('id', id)
      .eq('flashcard_sets.user_id', user_id)
      .single();

    if (fetchError || !existingCard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (question !== undefined) updateData.question = question;
    if (answer !== undefined) updateData.answer = answer;
    if (mastered !== undefined) updateData.mastered = mastered;

    const { data: updatedFlashcard, error } = await supabaseAdmin()
      .from('flashcards')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating flashcard:', error);
      return res.status(500).json({ error: 'Failed to update flashcard' });
    }

    res.status(200).json({
      success: true,
      message: 'Flashcard updated successfully',
      flashcard: {
        id: updatedFlashcard.id,
        question: updatedFlashcard.question,
        answer: updatedFlashcard.answer,
        mastered: updatedFlashcard.mastered
      }
    });
  } catch (error) {
    console.error('Update flashcard error:', error);
    res.status(500).json({ error: 'Server error updating flashcard' });
  }
};

// Delete a flashcard
const deleteFlashcard = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query || req.body; // Accept from both query and body

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // First, get the flashcard and its set to verify ownership
    const { data: existingCard, error: fetchError } = await supabaseAdmin()
      .from('flashcards')
      .select('id, flashcard_set_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingCard) {
      return res.status(404).json({ error: 'Flashcard not found' });
    }

    // Check if the flashcard set belongs to the user
    const { data: flashcardSet, error: setError } = await supabaseAdmin()
      .from('flashcard_sets')
      .select('user_id')
      .eq('id', existingCard.flashcard_set_id)
      .eq('user_id', user_id)
      .single();

    if (setError || !flashcardSet) {
      return res.status(403).json({ error: 'Access denied: Flashcard does not belong to user' });
    }

    // Delete the flashcard
    const { error } = await supabaseAdmin()
      .from('flashcards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting flashcard:', error);
      return res.status(500).json({ error: 'Failed to delete flashcard' });
    }

    res.status(200).json({
      success: true,
      message: 'Flashcard deleted successfully'
    });
  } catch (error) {
    console.error('Delete flashcard error:', error);
    res.status(500).json({ error: 'Server error deleting flashcard' });
  }
};

module.exports = {
  getUserFlashcardSets,
  getFlashcardSetById,
  createFlashcardSet,
  updateFlashcardSet,
  deleteFlashcardSet,
  addFlashcard,
  updateFlashcard,
  deleteFlashcard
}; 