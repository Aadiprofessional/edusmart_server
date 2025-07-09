const { supabase, supabaseAdmin } = require('../utils/supabase');

// ============= STUDY TASKS =============

// Get all study tasks for a user
const getUserStudyTasks = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, subject, priority, completed } = req.query;

    let query = supabaseAdmin()
      .from('study_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    // Apply filters
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }
    if (subject && subject !== 'all') {
      query = query.eq('subject', subject);
    }
    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }
    if (completed !== undefined) {
      query = query.eq('completed', completed === 'true');
    }

    const { data: studyTasks, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: studyTasks
    });
  } catch (error) {
    console.error('Error fetching study tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study tasks',
      error: error.message
    });
  }
};

// Get study task by ID
const getStudyTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: studyTask, error } = await supabaseAdmin()
      .from('study_tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!studyTask) {
      return res.status(404).json({
        success: false,
        message: 'Study task not found'
      });
    }

    res.json({
      success: true,
      data: studyTask
    });
  } catch (error) {
    console.error('Error fetching study task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study task',
      error: error.message
    });
  }
};

// Create new study task
const createStudyTask = async (req, res) => {
  try {
    const taskData = req.body;
    
    // Ensure user_id is set
    if (!taskData.user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required'
      });
    }

    const { data: studyTask, error } = await supabaseAdmin()
      .from('study_tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) throw error;

    // Create reminder if specified
    if (taskData.reminder && taskData.reminder_date) {
      await createTaskReminder(studyTask.id, taskData.user_id, 'study_task', {
        title: `Study Task: ${taskData.task}`,
        description: `Subject: ${taskData.subject}`,
        reminder_date: taskData.reminder_date,
        priority: taskData.priority || 'medium'
      });
    }

    res.status(201).json({
      success: true,
      data: studyTask,
      message: 'Study task created successfully'
    });
  } catch (error) {
    console.error('Error creating study task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create study task',
      error: error.message
    });
  }
};

// Update study task
const updateStudyTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data: studyTask, error } = await supabaseAdmin()
      .from('study_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Handle reminder updates
    if (updateData.reminder !== undefined) {
      if (updateData.reminder && updateData.reminder_date) {
        // Create or update reminder
        await createOrUpdateTaskReminder(id, studyTask.user_id, 'study_task', {
          title: `Study Task: ${studyTask.task}`,
          description: `Subject: ${studyTask.subject}`,
          reminder_date: updateData.reminder_date,
          priority: studyTask.priority || 'medium'
        });
      } else if (!updateData.reminder) {
        // Remove reminder
        await removeTaskReminder(id, 'study_task');
      }
    }

    res.json({
      success: true,
      data: studyTask,
      message: 'Study task updated successfully'
    });
  } catch (error) {
    console.error('Error updating study task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update study task',
      error: error.message
    });
  }
};

// Delete study task
const deleteStudyTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Remove associated reminders first
    await removeTaskReminder(id, 'study_task');

    const { error } = await supabaseAdmin()
      .from('study_tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Study task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting study task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete study task',
      error: error.message
    });
  }
};

// ============= APPLICATIONS =============

// Get all applications for a user
const getUserApplications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, country } = req.query;

    let query = supabaseAdmin()
      .from('applications')
      .select(`
        *,
        application_tasks (*)
      `)
      .eq('user_id', userId)
      .order('deadline', { ascending: true });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (country && country !== 'all') {
      query = query.eq('country', country);
    }

    const { data: applications, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: applications
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
};

// Get application by ID
const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: application, error } = await supabaseAdmin()
      .from('applications')
      .select(`
        *,
        application_tasks (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: error.message
    });
  }
};

// Create new application
const createApplication = async (req, res) => {
  try {
    const applicationData = req.body;
    
    // Ensure user_id is set
    if (!applicationData.user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required'
      });
    }

    const { data: application, error } = await supabaseAdmin()
      .from('applications')
      .insert([applicationData])
      .select()
      .single();

    if (error) throw error;

    // Create reminder if specified
    if (applicationData.reminder && applicationData.reminder_date) {
      await createTaskReminder(application.id, applicationData.user_id, 'application', {
        title: `Application Deadline: ${applicationData.university}`,
        description: `${applicationData.program} - ${applicationData.country}`,
        reminder_date: applicationData.reminder_date,
        priority: 'high'
      });
    }

    // Create study task for application deadline
    await createStudyTaskFromApplication(application);

    res.status(201).json({
      success: true,
      data: application,
      message: 'Application created successfully'
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create application',
      error: error.message
    });
  }
};

// Update application
const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data: application, error } = await supabaseAdmin()
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Handle reminder updates
    if (updateData.reminder !== undefined) {
      if (updateData.reminder && updateData.reminder_date) {
        await createOrUpdateTaskReminder(id, application.user_id, 'application', {
          title: `Application Deadline: ${application.university}`,
          description: `${application.program} - ${application.country}`,
          reminder_date: updateData.reminder_date,
          priority: 'high'
        });
      } else if (!updateData.reminder) {
        await removeTaskReminder(id, 'application');
      }
    }

    // Update related study task
    await updateStudyTaskFromApplication(application);

    res.json({
      success: true,
      data: application,
      message: 'Application updated successfully'
    });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application',
      error: error.message
    });
  }
};

// Delete application
const deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    // Remove associated reminders and study tasks
    await removeTaskReminder(id, 'application');
    await supabaseAdmin()
      .from('study_tasks')
      .delete()
      .eq('application_id', id);

    const { error } = await supabaseAdmin()
      .from('applications')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete application',
      error: error.message
    });
  }
};

// ============= APPLICATION TASKS =============

// Create application task
const createApplicationTask = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const taskData = { ...req.body, application_id: applicationId };

    const { data: task, error } = await supabaseAdmin()
      .from('application_tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) throw error;

    // Get application details for study task creation
    const { data: application } = await supabaseAdmin()
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    // Create study task for this application task
    if (application) {
      await createStudyTaskFromApplicationTask(task, application);
    }

    // Create reminder if specified
    if (taskData.reminder && taskData.reminder_date) {
      await createTaskReminder(task.id, application.user_id, 'application_task', {
        title: `Application Task: ${taskData.task}`,
        description: `${application.university} - ${application.program}`,
        reminder_date: taskData.reminder_date,
        priority: 'medium'
      });
    }

    res.status(201).json({
      success: true,
      data: task,
      message: 'Application task created successfully'
    });
  } catch (error) {
    console.error('Error creating application task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create application task',
      error: error.message
    });
  }
};

// Update application task
const updateApplicationTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data: task, error } = await supabaseAdmin()
      .from('application_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Get application details
    const { data: application } = await supabaseAdmin()
      .from('applications')
      .select('*')
      .eq('id', task.application_id)
      .single();

    // Update related study task
    await updateStudyTaskFromApplicationTask(task, application);

    // Handle reminder updates
    if (updateData.reminder !== undefined) {
      if (updateData.reminder && updateData.reminder_date) {
        await createOrUpdateTaskReminder(id, application.user_id, 'application_task', {
          title: `Application Task: ${task.task}`,
          description: `${application.university} - ${application.program}`,
          reminder_date: updateData.reminder_date,
          priority: 'medium'
        });
      } else if (!updateData.reminder) {
        await removeTaskReminder(id, 'application_task');
      }
    }

    res.json({
      success: true,
      data: task,
      message: 'Application task updated successfully'
    });
  } catch (error) {
    console.error('Error updating application task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application task',
      error: error.message
    });
  }
};

// Delete application task
const deleteApplicationTask = async (req, res) => {
  try {
    const { id } = req.params;

    // Remove associated reminders and study tasks
    await removeTaskReminder(id, 'application_task');
    await supabaseAdmin()
      .from('study_tasks')
      .delete()
      .eq('source', 'application')
      .like('id', `%app-task-%-${id}`);

    const { error } = await supabaseAdmin()
      .from('application_tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Application task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting application task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete application task',
      error: error.message
    });
  }
};

// ============= REMINDERS =============

// Get user reminders
const getUserReminders = async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, isActive, startDate, endDate } = req.query;

    let query = supabaseAdmin()
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('reminder_date', { ascending: true });

    // Apply filters
    if (type && type !== 'all') {
      query = query.eq('type', type);
    }
    if (isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true');
    }
    if (startDate) {
      query = query.gte('reminder_date', startDate);
    }
    if (endDate) {
      query = query.lte('reminder_date', endDate);
    }

    const { data: reminders, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: reminders
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reminders',
      error: error.message
    });
  }
};

// Create reminder
const createReminder = async (req, res) => {
  try {
    const reminderData = req.body;
    
    if (!reminderData.user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required'
      });
    }

    const { data: reminder, error } = await supabaseAdmin()
      .from('reminders')
      .insert([reminderData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: reminder,
      message: 'Reminder created successfully'
    });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create reminder',
      error: error.message
    });
  }
};

// Update reminder
const updateReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const { data: reminder, error } = await supabaseAdmin()
      .from('reminders')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: reminder,
      message: 'Reminder updated successfully'
    });
  } catch (error) {
    console.error('Error updating reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update reminder',
      error: error.message
    });
  }
};

// Delete reminder
const deleteReminder = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin()
      .from('reminders')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Reminder deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete reminder',
      error: error.message
    });
  }
};

// ============= HELPER FUNCTIONS =============

// Create study task from application
const createStudyTaskFromApplication = async (application) => {
  try {
    const studyTaskData = {
      id: `app-deadline-${application.id}`,
      user_id: application.user_id,
      task: `${application.university} - ${application.program} Application Deadline`,
      subject: 'Applications',
      date: application.reminder && application.reminder_date 
        ? application.reminder_date.split('T')[0] 
        : application.deadline,
      completed: ['submitted', 'accepted', 'rejected'].includes(application.status),
      priority: 'high',
      estimated_hours: 1,
      source: 'application',
      application_id: application.id,
      reminder: application.reminder,
      reminder_date: application.reminder_date
    };

    await supabaseAdmin()
      .from('study_tasks')
      .upsert([studyTaskData]);
  } catch (error) {
    console.error('Error creating study task from application:', error);
  }
};

// Update study task from application
const updateStudyTaskFromApplication = async (application) => {
  try {
    const studyTaskId = `app-deadline-${application.id}`;
    
    const updateData = {
      task: `${application.university} - ${application.program} Application Deadline`,
      date: application.reminder && application.reminder_date 
        ? application.reminder_date.split('T')[0] 
        : application.deadline,
      completed: ['submitted', 'accepted', 'rejected'].includes(application.status),
      reminder: application.reminder,
      reminder_date: application.reminder_date
    };

    await supabaseAdmin()
      .from('study_tasks')
      .update(updateData)
      .eq('id', studyTaskId);
  } catch (error) {
    console.error('Error updating study task from application:', error);
  }
};

// Create study task from application task
const createStudyTaskFromApplicationTask = async (task, application) => {
  try {
    const studyTaskData = {
      id: `app-task-${application.id}-${task.id}`,
      user_id: application.user_id,
      task: `${task.task} (${application.university})`,
      subject: 'Applications',
      date: task.reminder && task.reminder_date 
        ? task.reminder_date.split('T')[0] 
        : (task.due_date || application.deadline),
      completed: task.completed,
      priority: 'medium',
      estimated_hours: 2,
      source: 'application',
      application_id: application.id,
      reminder: task.reminder,
      reminder_date: task.reminder_date
    };

    await supabaseAdmin()
      .from('study_tasks')
      .upsert([studyTaskData]);
  } catch (error) {
    console.error('Error creating study task from application task:', error);
  }
};

// Update study task from application task
const updateStudyTaskFromApplicationTask = async (task, application) => {
  try {
    const studyTaskId = `app-task-${application.id}-${task.id}`;
    
    const updateData = {
      task: `${task.task} (${application.university})`,
      date: task.reminder && task.reminder_date 
        ? task.reminder_date.split('T')[0] 
        : (task.due_date || application.deadline),
      completed: task.completed,
      reminder: task.reminder,
      reminder_date: task.reminder_date
    };

    await supabaseAdmin()
      .from('study_tasks')
      .update(updateData)
      .eq('id', studyTaskId);
  } catch (error) {
    console.error('Error updating study task from application task:', error);
  }
};

// Create task reminder
const createTaskReminder = async (referenceId, userId, type, reminderData) => {
  try {
    const reminder = {
      user_id: userId,
      type: type,
      reference_id: referenceId.toString(),
      title: reminderData.title,
      description: reminderData.description || null,
      reminder_date: reminderData.reminder_date,
      priority: reminderData.priority || 'medium',
      is_active: true,
      metadata: reminderData.metadata || {}
    };

    await supabaseAdmin()
      .from('reminders')
      .insert([reminder]);
  } catch (error) {
    console.error('Error creating task reminder:', error);
  }
};

// Create or update task reminder
const createOrUpdateTaskReminder = async (referenceId, userId, type, reminderData) => {
  try {
    // First try to update existing reminder
    const { data: existingReminder } = await supabaseAdmin()
      .from('reminders')
      .select('id')
      .eq('reference_id', referenceId.toString())
      .eq('type', type)
      .single();

    if (existingReminder) {
      // Update existing reminder
      await supabaseAdmin()
        .from('reminders')
        .update({
          title: reminderData.title,
          description: reminderData.description || null,
          reminder_date: reminderData.reminder_date,
          priority: reminderData.priority || 'medium',
          is_active: true,
          metadata: reminderData.metadata || {}
        })
        .eq('id', existingReminder.id);
    } else {
      // Create new reminder
      await createTaskReminder(referenceId, userId, type, reminderData);
    }
  } catch (error) {
    console.error('Error creating or updating task reminder:', error);
  }
};

// Remove task reminder
const removeTaskReminder = async (referenceId, type) => {
  try {
    await supabaseAdmin()
      .from('reminders')
      .delete()
      .eq('reference_id', referenceId.toString())
      .eq('type', type);
  } catch (error) {
    console.error('Error removing task reminder:', error);
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get study tasks stats
    const { data: studyTasksStats } = await supabaseAdmin()
      .from('study_tasks')
      .select('completed, priority')
      .eq('user_id', userId);

    // Get applications stats
    const { data: applicationsStats } = await supabaseAdmin()
      .from('applications')
      .select('status')
      .eq('user_id', userId);

    // Get reminders stats
    const { data: remindersStats } = await supabaseAdmin()
      .from('reminders')
      .select('is_active, reminder_date')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gte('reminder_date', new Date().toISOString());

    const stats = {
      studyTasks: {
        total: studyTasksStats?.length || 0,
        completed: studyTasksStats?.filter(t => t.completed).length || 0,
        pending: studyTasksStats?.filter(t => !t.completed).length || 0,
        highPriority: studyTasksStats?.filter(t => t.priority === 'high' && !t.completed).length || 0
      },
      applications: {
        total: applicationsStats?.length || 0,
        planning: applicationsStats?.filter(a => a.status === 'planning').length || 0,
        inProgress: applicationsStats?.filter(a => a.status === 'in-progress').length || 0,
        submitted: applicationsStats?.filter(a => a.status === 'submitted').length || 0
      },
      reminders: {
        active: remindersStats?.length || 0,
        today: remindersStats?.filter(r => 
          new Date(r.reminder_date).toDateString() === new Date().toDateString()
        ).length || 0
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error.message
    });
  }
};

module.exports = {
  // Study Tasks
  getUserStudyTasks,
  getStudyTaskById,
  createStudyTask,
  updateStudyTask,
  deleteStudyTask,
  
  // Applications
  getUserApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
  
  // Application Tasks
  createApplicationTask,
  updateApplicationTask,
  deleteApplicationTask,
  
  // Reminders
  getUserReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  
  // Dashboard
  getDashboardStats
}; 