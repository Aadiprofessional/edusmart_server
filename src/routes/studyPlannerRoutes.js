import express from 'express';
const router = express.Router();
import {
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
} from '../controllers/studyPlannerController.js';

// ============= STUDY TASKS ROUTES =============

// Get all study tasks for a user
router.get('/users/:userId/study-tasks', getUserStudyTasks);

// Get study task by ID
router.get('/study-tasks/:id', getStudyTaskById);

// Create new study task
router.post('/study-tasks', createStudyTask);

// Update study task
router.put('/study-tasks/:id', updateStudyTask);

// Delete study task
router.delete('/study-tasks/:id', deleteStudyTask);

// ============= APPLICATIONS ROUTES =============

// Get all applications for a user
router.get('/users/:userId/applications', getUserApplications);

// Get application by ID
router.get('/applications/:id', getApplicationById);

// Create new application
router.post('/applications', createApplication);

// Update application
router.put('/applications/:id', updateApplication);

// Delete application
router.delete('/applications/:id', deleteApplication);

// ============= APPLICATION TASKS ROUTES =============

// Create application task
router.post('/applications/:applicationId/tasks', createApplicationTask);

// Update application task
router.put('/application-tasks/:id', updateApplicationTask);

// Delete application task
router.delete('/application-tasks/:id', deleteApplicationTask);

// ============= REMINDERS ROUTES =============

// Get user reminders
router.get('/users/:userId/reminders', getUserReminders);

// Create reminder
router.post('/reminders', createReminder);

// Update reminder
router.put('/reminders/:id', updateReminder);

// Delete reminder
router.delete('/reminders/:id', deleteReminder);

// ============= DASHBOARD ROUTES =============

// Get dashboard statistics
router.get('/users/:userId/dashboard/stats', getDashboardStats);

export default router; 