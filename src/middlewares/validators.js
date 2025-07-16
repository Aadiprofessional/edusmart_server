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
  
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  
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
    .withMessage('Category is required')
    .isIn(['programming', 'data-science', 'business', 'design', 'marketing', 'language', 'test-prep', 'academic'])
    .withMessage('Category must be one of: programming, data-science, business, design, marketing, language, test-prep, academic'),
  
  body('level')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Level is required')
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Level must be one of: beginner, intermediate, advanced'),
  
  body('instructor_name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Instructor name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Instructor name must be between 2 and 100 characters'),
  
  // Optional fields that match database schema
  body('subtitle')
    .optional()
    .isString()
    .isLength({ max: 300 })
    .withMessage('Subtitle must be at most 300 characters'),
  
  body('subcategory')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('Subcategory must be at most 50 characters'),
  
  body('language')
    .optional()
    .isString()
    .isLength({ max: 20 })
    .withMessage('Language must be at most 20 characters'),
  
  body('price')
    .optional()
    .isNumeric()
    .withMessage('Price must be a number'),
  
  body('original_price')
    .optional()
    .isNumeric()
    .withMessage('Original price must be a number'),
  
  body('currency')
    .optional()
    .isString()
    .isLength({ max: 3 })
    .withMessage('Currency must be at most 3 characters'),
  
  body('duration_hours')
    .optional()
    .isNumeric()
    .withMessage('Duration hours must be a number'),
  
  body('total_lectures')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total lectures must be a non-negative integer'),
  
  body('total_sections')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total sections must be a non-negative integer'),
  
  body('thumbnail_image')
    .optional()
    .isURL()
    .withMessage('Thumbnail image must be a valid URL'),
  
  body('preview_video_url')
    .optional()
    .isURL()
    .withMessage('Preview video URL must be a valid URL'),
  
  body('instructor_id')
    .optional()
    .isUUID()
    .withMessage('Instructor ID must be a valid UUID'),
  
  body('instructor_bio')
    .optional()
    .isString()
    .withMessage('Instructor bio must be a string'),
  
  body('instructor_image')
    .optional()
    .isURL()
    .withMessage('Instructor image must be a valid URL'),
  
  body('what_you_will_learn')
    .optional()
    .isArray()
    .withMessage('What you will learn must be an array'),
  
  body('prerequisites')
    .optional()
    .isArray()
    .withMessage('Prerequisites must be an array'),
  
  body('target_audience')
    .optional()
    .isArray()
    .withMessage('Target audience must be an array'),
  
  body('course_includes')
    .optional()
    .isArray()
    .withMessage('Course includes must be an array'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('keywords')
    .optional()
    .isArray()
    .withMessage('Keywords must be an array'),
  
  body('meta_description')
    .optional()
    .isString()
    .withMessage('Meta description must be a string'),
  
  body('status')
    .optional()
    .isIn(['draft'])
    .withMessage('Status must be: draft'),
  
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  
  body('bestseller')
    .optional()
    .isBoolean()
    .withMessage('Bestseller must be a boolean'),
  
  body('new_course')
    .optional()
    .isBoolean()
    .withMessage('New course must be a boolean'),
  
  body('rating')
    .optional()
    .isNumeric()
    .isFloat({ min: 0, max: 5 })
    .withMessage('Rating must be a number between 0 and 5'),
  
  body('total_reviews')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total reviews must be a non-negative integer'),
  
  body('total_students')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Total students must be a non-negative integer'),
  
  body('certificate_available')
    .optional()
    .isBoolean()
    .withMessage('Certificate available must be a boolean'),
  
  body('completion_certificate_template')
    .optional()
    .isString()
    .withMessage('Completion certificate template must be a string'),
  
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
  
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  
  validateRequest
];

// University validation rules
const universityValidationRules = [
  body('uid')
    .isString()
    .withMessage('User ID must be a string')
    .notEmpty()
    .withMessage('User ID is required'),

  body('name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('University name is required')
    .isLength({ min: 2, max: 200 })
    .withMessage('University name must be between 2 and 200 characters'),
  
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  
  body('country')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Country is required'),
  
  body('city')
    .optional()
    .isString()
    .trim()
    .withMessage('City must be a string'),
  
  body('website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL'),
  
  body('ranking')
    .optional()
    .isNumeric()
    .withMessage('Ranking must be a number'),
  
  body('tuition_fee')
    .optional()
    .isNumeric()
    .withMessage('Tuition fee must be a number'),
  
  body('acceptance_rate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Acceptance rate must be between 0 and 100'),
  
  body('student_population')
    .optional()
    .isNumeric()
    .withMessage('Student population must be a number'),
  
  body('established_year')
    .optional()
    .isNumeric()
    .withMessage('Established year must be a number'),
  
  body('image')
    .optional()
    .isURL()
    .withMessage('Image must be a valid URL'),
  
  body('programs_offered')
    .optional()
    .isArray()
    .withMessage('Programs offered must be an array'),

  // New admission requirements validation
  body('min_gpa_required')
    .optional()
    .isFloat({ min: 0, max: 4.0 })
    .withMessage('Minimum GPA must be between 0 and 4.0'),

  body('sat_score_required')
    .optional()
    .isString()
    .trim()
    .withMessage('SAT score must be a string'),

  body('act_score_required')
    .optional()
    .isString()
    .trim()
    .withMessage('ACT score must be a string'),

  body('ielts_score_required')
    .optional()
    .isString()
    .trim()
    .withMessage('IELTS score must be a string'),

  body('toefl_score_required')
    .optional()
    .isString()
    .trim()
    .withMessage('TOEFL score must be a string'),

  body('gre_score_required')
    .optional()
    .isString()
    .trim()
    .withMessage('GRE score must be a string'),

  body('gmat_score_required')
    .optional()
    .isString()
    .trim()
    .withMessage('GMAT score must be a string'),

  // Application deadlines validation
  body('application_deadline_fall')
    .optional()
    .isString()
    .trim()
    .withMessage('Fall application deadline must be a string'),

  body('application_deadline_spring')
    .optional()
    .isString()
    .trim()
    .withMessage('Spring application deadline must be a string'),

  body('application_deadline_summer')
    .optional()
    .isString()
    .trim()
    .withMessage('Summer application deadline must be a string'),

  // Financial information validation
  body('tuition_fee_graduate')
    .optional()
    .isNumeric()
    .withMessage('Graduate tuition fee must be a number'),

  body('scholarship_available')
    .optional()
    .isBoolean()
    .withMessage('Scholarship availability must be a boolean'),

  body('financial_aid_available')
    .optional()
    .isBoolean()
    .withMessage('Financial aid availability must be a boolean'),

  // Additional admission requirements validation
  body('application_requirements')
    .optional()
    .isArray()
    .withMessage('Application requirements must be an array'),

  body('admission_essay_required')
    .optional()
    .isBoolean()
    .withMessage('Admission essay requirement must be a boolean'),

  body('letters_of_recommendation_required')
    .optional()
    .isNumeric()
    .withMessage('Letters of recommendation required must be a number'),

  body('interview_required')
    .optional()
    .isBoolean()
    .withMessage('Interview requirement must be a boolean'),

  body('work_experience_required')
    .optional()
    .isBoolean()
    .withMessage('Work experience requirement must be a boolean'),

  body('portfolio_required')
    .optional()
    .isBoolean()
    .withMessage('Portfolio requirement must be a boolean'),
  
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

// Response validation rules
const responseValidationRules = [
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
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  
  body('type')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['guide', 'template', 'checklist', 'video', 'webinar', 'ebook', 'course'])
    .withMessage('Type must be one of: guide, template, checklist, video, webinar, ebook, course'),
  
  body('category')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['application', 'study', 'test-prep', 'career', 'visa', 'finance'])
    .withMessage('Category must be one of: application, study, test-prep, career, visa, finance'),
  
  body('url')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('URL must be a valid URL'),
  
  body('thumbnail')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Thumbnail must be a valid URL'),
  
  body('download_link')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Download link must be a valid URL'),
  
  body('video_link')
    .optional({ checkFalsy: true })
    .isURL()
    .withMessage('Video link must be a valid URL'),
  
  body('file_size')
    .optional({ checkFalsy: true })
    .isNumeric()
    .withMessage('File size must be a number'),
  
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  validateRequest
];

// Case study validation rules
const caseStudyValidationRules = [
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
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters'),
  
  body('student_name')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Student name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Student name must be between 2 and 100 characters'),
  
  body('story_content')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Story content is required')
    .isLength({ min: 100 })
    .withMessage('Story content must be at least 100 characters'),
  
  body('category')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['undergraduate', 'graduate', 'phd', 'scholarship', 'visa', 'career-change'])
    .withMessage('Category must be one of: undergraduate, graduate, phd, scholarship, visa, career-change'),
  
  body('outcome')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Outcome is required')
    .isIn(['accepted', 'scholarship', 'rejected', 'waitlisted', 'in-progress'])
    .withMessage('Outcome must be one of: accepted, scholarship, rejected, waitlisted, in-progress'),
  
  body('student_image')
    .optional()
    .isURL()
    .withMessage('Student image must be a valid URL'),
  
  body('scholarship_amount')
    .optional()
    .isNumeric()
    .withMessage('Scholarship amount must be a number'),
  
  body('application_year')
    .optional()
    .isInt({ min: 2000, max: 2030 })
    .withMessage('Application year must be between 2000 and 2030'),
  
  body('challenges_faced')
    .optional()
    .isArray()
    .withMessage('Challenges faced must be an array'),
  
  body('strategies_used')
    .optional()
    .isArray()
    .withMessage('Strategies used must be an array'),
  
  body('advice_given')
    .optional()
    .isArray()
    .withMessage('Advice given must be an array'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('reading_time')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Reading time must be between 1 and 60 minutes'),
  
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be one of: draft, published, archived'),
  
  validateRequest
];

module.exports = {
  validateRequest,
  blogValidationRules,
  courseValidationRules,
  scholarshipValidationRules,
  universityValidationRules,
  profileValidationRules,
  responseValidationRules,
  caseStudyValidationRules
}; 