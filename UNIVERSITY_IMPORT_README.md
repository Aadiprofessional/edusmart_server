# University Import Scripts

This directory contains scripts to import all 255 universities from the QS university data into your EduSmart database using the university API endpoints.

## Files

- `qs.json` - The source data file containing university information
- `add_universities.js` - Main script to transform and import universities
- `test_transformation.js` - Test script to verify data transformation
- `package.json` - Dependencies configuration

## Prerequisites

1. **Node.js and npm installed**
2. **Your EduSmart server running** (the API endpoints need to be accessible)
3. **Admin credentials** (you need an admin UID to create universities)
4. **Dependencies installed**: Run `npm install` to install required packages

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure the Script

Edit `add_universities.js` and update these configuration values:

```javascript
// Configuration
const API_BASE_URL = 'http://localhost:3000/api'; // Change to your API URL
const ADMIN_UID = 'admin_uid_here'; // Replace with actual admin UID
```

**Important Configuration Notes:**
- `API_BASE_URL`: Set this to your actual API base URL (e.g., `https://your-domain.com/api` for production)
- `ADMIN_UID`: You need a valid admin user UID. This should be the UID of an admin user in your system

### 3. Test the Data Transformation (Recommended)

Before running the full import, test the data transformation:

```bash
node test_transformation.js
```

This will:
- Show you sample transformed data
- Display country distribution statistics
- Create a `sample_universities.json` file for inspection
- Verify that the JSON parsing and transformation works correctly

### 4. Run the University Import

```bash
node add_universities.js
```

The script will:
- Read and transform all university data from `qs.json`
- Add universities in batches of 5 to avoid overwhelming the API
- Show progress for each batch
- Display success/failure status for each university
- Generate a summary report
- Save detailed results to `university_import_results.json`

## Data Handling

### Placeholder Values
For missing or empty data fields, the script uses sensible defaults:

- **Images**: Uses Unsplash placeholder images for universities
- **Contact Info**: Generic placeholder emails and phone numbers
- **Academic Data**: Reasonable defaults for tuition, acceptance rates, etc.
- **Text Fields**: "NA" for missing optional text fields
- **Arrays**: Default arrays for programs, facilities, etc.

### Data Transformation
The script handles:
- **Ranking Extraction**: Automatically extracts numeric rankings from university names
- **Country Mapping**: Maps countries from the source data
- **URL Generation**: Creates reasonable website URLs based on university names
- **Type Conversion**: Converts strings to appropriate data types (numbers, booleans, arrays)
- **Data Cleaning**: Handles null, undefined, and empty values

## Expected Output

The script will process approximately 255 universities and provide:

1. **Real-time Progress**: Shows which batch is being processed
2. **Individual Results**: Success/failure status for each university
3. **Final Summary**: Total count, successes, and failures
4. **Error Details**: Specific error messages for failed imports
5. **Results File**: Complete results saved to `university_import_results.json`

## Troubleshooting

### Common Issues

1. **"Connection refused" or "Network Error"**
   - Make sure your EduSmart server is running
   - Check that the `API_BASE_URL` is correct
   - Verify the API endpoints are accessible

2. **"Unauthorized" or "Admin access required"**
   - Ensure the `ADMIN_UID` is correct
   - Verify the user has admin privileges in your system
   - Check that the admin authentication middleware is working

3. **"Validation errors"**
   - The university data might not match your API validation rules
   - Check the validation requirements in your API
   - Review the error messages in the results file

4. **"Duplicate entries" or "University already exists"**
   - Some universities might already exist in your database
   - The script doesn't check for duplicates before adding
   - You may need to clear existing data or modify the script to handle duplicates

### Performance Considerations

- The script processes universities in batches of 5 with 1-second delays
- Total execution time: approximately 1-2 minutes for all 255 universities
- You can adjust the `batchSize` in the script if needed

### Data Verification

After running the import:
1. Check your database to verify universities were added
2. Review the `university_import_results.json` file for detailed results
3. Test the university API endpoints to ensure data is accessible
4. Verify that images and other URLs are working correctly

## Customization

You can customize the script by:

1. **Modifying Default Values**: Edit the `DEFAULT_VALUES` object in `add_universities.js`
2. **Changing Image Sources**: Update the `getUniversityImageUrl` and `getUniversityLogoUrl` functions
3. **Adjusting Batch Size**: Change the `batchSize` variable for faster/slower processing
4. **Adding Data Validation**: Add custom validation before API calls
5. **Filtering Universities**: Add logic to skip certain universities based on criteria

## Data Source

The `qs.json` file contains data for 255 universities with the following fields:
- Basic info (name, country, city, etc.)
- Academic data (ranking, programs, etc.)
- Admission requirements (GPA, test scores, etc.)
- Financial information (tuition, fees, etc.)
- Contact and facility information

All missing fields are filled with appropriate placeholder values to ensure complete university profiles.

## Support

If you encounter issues:
1. Check the console output for specific error messages
2. Review the `university_import_results.json` file for detailed results
3. Verify your API endpoints are working with tools like Postman
4. Test with a smaller batch first by modifying the script

## File Cleanup

After successful import, you can:
- Keep `university_import_results.json` for records
- Delete `sample_universities.json` (it's just for testing)
- Archive the import scripts if no longer needed 