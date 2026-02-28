# Google Classroom API Setup Guide

## Overview

To use the Google Classroom integration, you need to set up Google API credentials. This involves creating a project in the Google Cloud Console and enabling the Google Classroom API.

## Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your project ID

### 2. Enable Google Classroom API

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "Google Classroom API"
3. Click on "Google Classroom API" and click "Enable"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Application type": Web application
4. Configure the OAuth consent screen:
   - **User Type**: External (for testing) or Internal (if your organization uses G Suite)
   - **App name**: "Academic Management System"
   - **User support email**: Your email address
   - **Developer contact email**: Your email address
5. Save and continue

### 4. Configure Authorized Redirect URIs

In the OAuth client ID configuration, add these redirect URIs:
```
http://localhost:8000/auth/callback
http://127.0.0.1:8000/auth/callback
```

### 5. Download Credentials

1. After creating the OAuth client ID, download the JSON file
2. Rename it to `credentials.json`
3. Place it in your project root directory (same level as `app/`)

## Credentials.json File Structure

The downloaded file will look like this:

```json
{
  "web": {
    "client_id": "123456789-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com",
    "project_id": "your-project-id",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "your-client-secret",
    "redirect_uris": [
      "http://localhost:8000/auth/callback",
      "http://127.0.0.1:8000/auth/callback"
    ]
  }
}
```

## Required API Scopes

The application requests these permissions:

- `https://www.googleapis.com/auth/classroom.courses.readonly` - View your Google Classroom courses
- `https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly` - View course materials
- `https://www.googleapis.com/auth/classroom.announcements.readonly` - View announcements
- `https://www.googleapis.com/auth/classroom.coursework.me.readonly` - View your assignments
- `https://www.googleapis.com/auth/drive.readonly` - Access Google Drive files

## Testing the Setup

1. **Start your application**:
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

2. **Create a test user**:
   ```bash
   curl -X POST "http://localhost:8000/users/" \
     -H "Content-Type: application/json" \
     -d '{"user_id": "test_user", "name": "Test User", "email": "test@example.com"}'
   ```

3. **Get authorization URL**:
   ```bash
   curl "http://localhost:8000/auth/google-classroom/test_user"
   ```

4. **Visit the authorization URL** in your browser and grant permissions

5. **Handle the callback** - Google will redirect to your callback URL with authorization code

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**
   - Ensure the redirect URI in Google Cloud Console matches exactly what your app uses
   - Check for trailing slashes or protocol mismatches

2. **"Project not found"**
   - Verify the project ID in credentials.json is correct
   - Ensure the Google Classroom API is enabled for your project

3. **"Access not configured"**
   - Make sure you've enabled the Google Classroom API
   - Check that your OAuth consent screen is published (not just saved as draft)

4. **"Invalid client secret"**
   - Ensure you're using the correct credentials.json file
   - Regenerate credentials if needed

### Security Notes

- **Never commit credentials.json to version control**
- Add `credentials.json` to your `.gitignore` file
- Use environment variables for production deployments
- Regularly rotate OAuth client secrets

### Environment Variables (Optional)

For production, you can use environment variables instead of a file:

```bash
export GOOGLE_CLIENT_ID="your-client-id"
export GOOGLE_CLIENT_SECRET="your-client-secret"
export GOOGLE_PROJECT_ID="your-project-id"
```

## Production Deployment

### 1. Update Redirect URIs

For production, add your actual domain:
```
https://yourdomain.com/auth/callback
https://www.yourdomain.com/auth/callback
```

### 2. OAuth Consent Screen

- Switch from "External" to "Internal" if using G Suite
- Add your domain to authorized domains
- Submit for verification if needed (for sensitive scopes)

### 3. Security Best Practices

- Use HTTPS in production
- Implement proper session management
- Add rate limiting
- Monitor API usage in Google Cloud Console

## Testing with Sample Data

If you don't have access to Google Classroom, you can test the API structure:

1. **Mock the Google Classroom service** by creating a test version that returns sample data
2. **Use the existing document upload endpoints** to test search functionality
3. **Test the user management and search features** independently

## Next Steps

Once Google Classroom is set up:

1. **Test the full integration flow**
2. **Monitor API usage** in Google Cloud Console
3. **Set up billing alerts** if needed
4. **Consider implementing caching** for better performance
5. **Add logging** for debugging OAuth issues

## Support

For additional help:
- [Google Classroom API Documentation](https://developers.google.com/classroom)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console Help](https://cloud.google.com/console-help)