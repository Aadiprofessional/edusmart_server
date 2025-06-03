const { body, validationResult } = require('express-validator');

// Validation result middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Blog validation rules
const blogValidationRules = [
  body('uid')
    .isString()
    .withMessage('User ID must be a string')
    .notEmpty()
    .withMessage('User ID is required'),

  body('title')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('content')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters'),
  
  body('excerpt')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Excerpt is required')
    .isLength({ max: 300 })
    .withMessage('Excerpt must be at most 300 characters'),
  
  body('category')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  
  body('tags')
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('image')
    .optional()
    .isURL()
    .withMessage('Image must be a valid URL'),
  
  validateRequest
];

// Course validation rules
const courseValidationRules = [
  body('uid')
    .isString()
    .withMessage('User ID must be a string')
    .notEmpty()
    .withMessage('User ID is required'),

  body('title')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 50 })
    .withMessage('Description must be at least 50 characters'),
  
  body('category')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  
  body('level')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Level is required'),
  
  body('duration')
    .isNumeric()
    .withMessage('Duration must be a number'),
  
  body('price')
    .isNumeric()
    .withMessage('Price must be a number'),
  
  body('image')
    .optional()
    .isURL()
    .withMessage('Image must be a valid URL'),
  
  validateRequest
];

// Scholarship validation rules
const scholarshipValidationRules = [
  body('uid')
    .isString()
    .withMessage('User ID must be a string')
    .notEmpty()
    .withMessage('User ID is required'),

  body('title')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  
  body('description')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 50 })
    .withMessage('Description must be at least 50 characters'),
  
  body('amount')
    .optional()
    .isNumeric()
    .withMessage('Amount must be a number'),
  
  body('eligibility')
    .optional()
    .isString()
    .withMessage('Eligibility criteria must be a string'),
  
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date'),
  
  body('university')
    .optional()
    .isString()
    .withMessage('University must be a string'),
  
  body('country')
    .optional()
    .isString()
    .withMessage('Country must be a string'),
  
  body('application_link')
    .optional()
    .isURL()
    .withMessage('Application link must be a valid URL'),
  
  validateRequest
];

// User/Profile validation rules
const profileValidationRules = [
  body('name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Name is required'),
  
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address'),
  
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  
  body('uid')
    .isString()
    .withMessage('User ID must be a string')
    .notEmpty()
    .withMessage('User ID is required'),
  
  validateRequest
];

module.exports = {
  validateRequest,
  blogValidationRules,
  courseValidationRules,
  scholarshipValidationRules,
  profileValidationRules
}; 