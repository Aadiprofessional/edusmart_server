-- Sample data for profiles table
-- Note: Passwords are hashed using bcrypt, these are just examples with the value 'password123'
INSERT INTO profiles (id, email, name, password, role, title, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@edusmart.com', 'Admin User', '$2b$10$1XeY6bLZZWFdQV0.3s9a8ev1n3JgdFrHnR09hFHxvs0tZOgC9Vjx.', 'admin', 'Administrator', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'user@edusmart.com', 'Regular User', '$2b$10$1XeY6bLZZWFdQV0.3s9a8ev1n3JgdFrHnR09hFHxvs0tZOgC9Vjx.', 'user', 'Student', NOW()),
  ('33333333-3333-3333-3333-333333333333', 'author@edusmart.com', 'Content Author', '$2b$10$1XeY6bLZZWFdQV0.3s9a8ev1n3JgdFrHnR09hFHxvs0tZOgC9Vjx.', 'admin', 'Content Writer', NOW());

-- Sample data for blogs table
INSERT INTO blogs (title, content, excerpt, category, tags, image, author_id, created_at)
VALUES
  ('How AI Is Revolutionizing University Selection Process', 
   'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Mauris euismod, nisl eu aliquam ultricies, nisl nisl aliquet nisl, eu aliquam nisl nisl eu nisl. Nulla facilisi. Mauris euismod, nisl eu aliquam ultricies, nisl nisl aliquet nisl, eu aliquam nisl nisl eu nisl. Nulla facilisi. Mauris euismod, nisl eu aliquam ultricies, nisl nisl aliquet nisl, eu aliquam nisl nisl eu nisl. Nulla facilisi. Mauris euismod, nisl eu aliquam ultricies, nisl nisl aliquet nisl, eu aliquam nisl nisl eu nisl.',
   'Discover how artificial intelligence algorithms are helping students find their perfect university match with unprecedented accuracy.',
   'AI Technology',
   ARRAY['AI', 'University Selection', 'Technology', 'Education'],
   'https://images.unsplash.com/photo-1593642532744-d377ab507dc8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
   '33333333-3333-3333-3333-333333333333',
   NOW() - INTERVAL '2 days'),
   
  ('5 Success Stories: From Rejection to Top University Admission', 
   'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Mauris euismod, nisl eu aliquam ultricies, nisl nisl aliquet nisl, eu aliquam nisl nisl eu nisl. Nulla facilisi. Mauris euismod, nisl eu aliquam ultricies, nisl nisl aliquet nisl, eu aliquam nisl nisl eu nisl. Nulla facilisi. Mauris euismod, nisl eu aliquam ultricies, nisl nisl aliquet nisl, eu aliquam nisl nisl eu nisl. Nulla facilisi. Mauris euismod, nisl eu aliquam ultricies, nisl nisl aliquet nisl, eu aliquam nisl nisl eu nisl.',
   'Read inspiring case studies of students who overcame initial rejections and secured spots at prestigious universities worldwide.',
   'Success Stories',
   ARRAY['Success', 'Admissions', 'University', 'Education'],
   'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
   '33333333-3333-3333-3333-333333333333',
   NOW() - INTERVAL '5 days'),
   
  ('International Scholarship Guide: Hidden Opportunities for 2025', 
   'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla facilisi. Mauris euismod, nisl eu aliquam ultricies, nisl nisl aliquet nisl, eu aliquam nisl nisl eu nisl. Nulla facilisi. Mauris euismod, nisl eu aliquam ultricies, nisl nisl aliquet nisl, eu aliquam nisl nisl eu nisl. Nulla facilisi. Mauris euismod, nisl eu aliquam ultricies, nisl nisl aliquet nisl, eu aliquam nisl nisl eu nisl. Nulla facilisi. Mauris euismod, nisl eu aliquam ultricies, nisl nisl aliquet nisl, eu aliquam nisl nisl eu nisl.',
   'Uncover lesser-known scholarship programs and funding sources for international students planning to study abroad.',
   'Scholarships',
   ARRAY['Scholarships', 'International', 'Study Abroad', 'Funding'],
   'https://images.unsplash.com/photo-1532649538693-f3a2ec1bf8bd?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
   '11111111-1111-1111-1111-111111111111',
   NOW() - INTERVAL '10 days');

-- Sample data for courses table
INSERT INTO courses (title, description, category, level, duration, price, image, instructor_name, instructor_bio, syllabus, created_by, created_at)
VALUES
  ('Introduction to Artificial Intelligence', 
   'A comprehensive introduction to the fundamentals of artificial intelligence, covering basic concepts, algorithms, and applications.',
   'Computer Science',
   'Beginner',
   40,
   99.99,
   'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
   'Dr. Sarah Chen',
   'PhD in AI from Stanford University with 10+ years of industry experience at Google and Microsoft.',
   '{"weeks": [{"week": 1, "topic": "Introduction to AI", "content": ["History of AI", "Types of AI", "Modern Applications"]}, {"week": 2, "topic": "Machine Learning Fundamentals", "content": ["Supervised Learning", "Unsupervised Learning", "Reinforcement Learning"]}]}',
   '11111111-1111-1111-1111-111111111111',
   NOW() - INTERVAL '30 days'),
   
  ('Data Science for Beginners', 
   'Learn the basics of data science, including data analysis, visualization, and machine learning using Python and popular libraries.',
   'Data Science',
   'Beginner',
   35,
   89.99,
   'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
   'Michael Johnson',
   'Data Science Lead at Amazon with expertise in predictive analytics and big data.',
   '{"weeks": [{"week": 1, "topic": "Introduction to Data Science", "content": ["What is Data Science?", "Data Science Process", "Tools and Technologies"]}, {"week": 2, "topic": "Python Fundamentals", "content": ["Python Basics", "NumPy", "Pandas"]}]}',
   '11111111-1111-1111-1111-111111111111',
   NOW() - INTERVAL '60 days'),
   
  ('Advanced Web Development with React', 
   'Master modern web development using React, Redux, and related technologies to build scalable and responsive applications.',
   'Web Development',
   'Advanced',
   50,
   129.99,
   'https://images.unsplash.com/photo-1593720213428-28a5b9e94613?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
   'Jennifer Wilson',
   'Senior Frontend Engineer with 8+ years experience working with React at Facebook and Airbnb.',
   '{"weeks": [{"week": 1, "topic": "React Fundamentals", "content": ["Components", "JSX", "Props and State"]}, {"week": 2, "topic": "State Management", "content": ["Context API", "Redux", "Performance Optimization"]}]}',
   '11111111-1111-1111-1111-111111111111',
   NOW() - INTERVAL '45 days');

-- Sample data for scholarships table
INSERT INTO scholarships (title, description, amount, eligibility, deadline, university, country, application_link, requirements, created_by, created_at)
VALUES
  ('Global Leaders Scholarship Program', 
   'A prestigious scholarship for exceptional students pursuing undergraduate or graduate studies in STEM fields.',
   25000.00,
   'Open to international students with a minimum GPA of 3.5/4.0 or equivalent. Applicants must demonstrate leadership potential and community involvement.',
   '2025-12-31',
   'Massachusetts Institute of Technology',
   'United States',
   'https://example.com/mit-scholarship',
   '{"documents": ["Academic transcripts", "Recommendation letters (2)", "Statement of purpose", "Resume/CV"], "gpa_minimum": 3.5, "language_requirements": {"test": "TOEFL", "minimum_score": 100}}',
   '11111111-1111-1111-1111-111111111111',
   NOW() - INTERVAL '5 days'),
   
  ('European Excellence Scholarship', 
   'A merit-based scholarship for students pursuing graduate studies in Business, Economics, or International Relations.',
   15000.00,
   'Open to all nationalities with a Bachelor degree with distinction (top 10% of class). Preference given to applicants with relevant work experience.',
   '2025-10-15',
   'London School of Economics',
   'United Kingdom',
   'https://example.com/lse-scholarship',
   '{"documents": ["Academic transcripts", "Recommendation letters (3)", "Research proposal", "Resume/CV", "Writing sample"], "gpa_minimum": 3.7, "language_requirements": {"test": "IELTS", "minimum_score": 7.5}}',
   '11111111-1111-1111-1111-111111111111',
   NOW() - INTERVAL '15 days'),
   
  ('Asia-Pacific Innovation Grant', 
   'A research-focused scholarship supporting graduate students in technology innovation and sustainable development.',
   20000.00,
   'Open to citizens of Asia-Pacific countries pursuing a Masters or PhD in Computer Science, Engineering, or Environmental Sciences.',
   '2025-09-30',
   'National University of Singapore',
   'Singapore',
   'https://example.com/nus-scholarship',
   '{"documents": ["Academic transcripts", "Research proposal", "Publications list", "Recommendation letters (2)"], "gpa_minimum": 3.3, "language_requirements": {"test": "TOEFL", "minimum_score": 90}}',
   '11111111-1111-1111-1111-111111111111',
   NOW() - INTERVAL '20 days'); 