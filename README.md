# EduSmart API Server

Serverless API backend for the EduSmart educational platform.

## Features

- Authentication and user management
- Blog management (create, read, update, delete)
- Course management
- Scholarship information
- Admin panel support
- Supabase integration
- Serverless deployment ready

## Tech Stack

- Node.js
- Express.js
- Supabase
- Serverless Framework
- JWT Authentication
- AWS Lambda (deployment target)

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn
- Supabase account
- AWS account (for deployment)

### Installation

1. Clone the repository
```
git clone <repository-url>
cd edusmart_server
```

2. Install dependencies
```
npm install
```

3. Set up environment variables
Create a `.env` file in the root directory with the following variables:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
JWT_SECRET=your_custom_jwt_secret
PORT=8000
```

4. Start the development server
```
npm run dev
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/profile` - Get current user profile (protected)

### Blog Endpoints

- `GET /api/blogs` - Get all blogs with pagination and filtering
- `GET /api/blogs/:id` - Get a single blog by ID
- `POST /api/blogs` - Create a new blog (admin only)
- `PUT /api/blogs/:id` - Update an existing blog
- `DELETE /api/blogs/:id` - Delete a blog
- `GET /api/blog-categories` - Get all blog categories
- `GET /api/blog-tags` - Get all blog tags

### Course Endpoints

- `GET /api/courses` - Get all courses with pagination and filtering
- `GET /api/courses/:id` - Get a single course by ID
- `POST /api/courses` - Create a new course (admin only)
- `PUT /api/courses/:id` - Update an existing course
- `DELETE /api/courses/:id` - Delete a course
- `GET /api/course-categories` - Get all course categories
- `GET /api/course-levels` - Get all course levels

### Scholarship Endpoints

- `GET /api/scholarships` - Get all scholarships with pagination and filtering
- `GET /api/scholarships/:id` - Get a single scholarship by ID
- `POST /api/scholarships` - Create a new scholarship (admin only)
- `PUT /api/scholarships/:id` - Update an existing scholarship
- `DELETE /api/scholarships/:id` - Delete a scholarship
- `GET /api/scholarship-countries` - Get all scholarship countries
- `GET /api/scholarship-universities` - Get all scholarship universities

## Database Schema

The application uses Supabase as the database and authentication provider. Here are the main tables in the database:

### profiles

Stores user profile information:

- `id` (UUID, primary key) - User ID
- `email` (string, unique) - User email
- `name` (string) - User name
- `password` (string, hashed) - User password
- `role` (string) - User role (user/admin)
- `avatar_url` (string, optional) - User avatar URL
- `created_at` (timestamp) - Account creation date

### blogs

Stores blog posts:

- `id` (UUID, primary key) - Blog ID
- `title` (string) - Blog title
- `content` (text) - Blog content
- `excerpt` (text) - Short excerpt for previews
- `category` (string) - Blog category
- `tags` (array) - Array of tags
- `image` (string) - Blog cover image URL
- `author_id` (UUID, foreign key) - References profiles.id
- `created_at` (timestamp) - Creation date
- `updated_at` (timestamp) - Last update date

### courses

Stores course information:

- `id` (UUID, primary key) - Course ID
- `title` (string) - Course title
- `description` (text) - Course description
- `category` (string) - Course category
- `level` (string) - Course difficulty level
- `duration` (number) - Course duration in hours
- `price` (number) - Course price
- `image` (string) - Course cover image URL
- `instructor_name` (string) - Instructor name
- `instructor_bio` (text) - Instructor biography
- `syllabus` (json) - Course syllabus
- `created_by` (UUID, foreign key) - References profiles.id
- `created_at` (timestamp) - Creation date
- `updated_at` (timestamp) - Last update date

### scholarships

Stores scholarship information:

- `id` (UUID, primary key) - Scholarship ID
- `title` (string) - Scholarship title
- `description` (text) - Scholarship description
- `amount` (number) - Scholarship amount
- `eligibility` (text) - Eligibility criteria
- `deadline` (date) - Application deadline
- `university` (string) - University name
- `country` (string) - Country
- `application_link` (string) - Application URL
- `requirements` (json) - Application requirements
- `created_by` (UUID, foreign key) - References profiles.id
- `created_at` (timestamp) - Creation date
- `updated_at` (timestamp) - Last update date

## Deployment

### Deploying to AWS Lambda

1. Configure AWS credentials
```
aws configure
```

2. Deploy using Serverless Framework
```
npm run deploy
```

## License

This project is licensed under the MIT License - see the LICENSE file for details 