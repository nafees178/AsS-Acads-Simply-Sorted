# Academic Management System API Documentation

## Overview

This API provides backend functionality for an academic management system with Google Classroom integration. It allows users to sync their Google Classroom materials, process documents, and perform intelligent search across their academic content.

## Base URL

```
http://localhost:8000
```

## Authentication

The API uses user IDs for authentication. Users must be created first before accessing other endpoints.

## API Endpoints

### User Management

#### Create User
```http
POST /users/
```

**Request Body:**
```json
{
  "user_id": "user123",
  "name": "John Doe",
  "email": "john.doe@example.com"
}
```

**Response:**
```json
{
  "user_id": "user123",
  "name": "John Doe",
  "email": "john.doe@example.com"
}
```

#### Get User
```http
GET /users/{user_id}
```

**Response:**
```json
{
  "user_id": "user123",
  "name": "John Doe",
  "email": "john.doe@example.com"
}
```

### Google Classroom Integration

#### Get Google Classroom Authorization URL
```http
GET /auth/google-classroom/{user_id}
```

**Response:**
```json
{
  "auth_url": "https://accounts.google.com/o/oauth2/auth?...",
  "message": "Please visit this URL to authorize Google Classroom access"
}
```

#### Handle OAuth Callback
```http
GET /auth/callback?user_id={user_id}&code={authorization_code}&state={user_id}
```

**Response:**
```json
{
  "message": "Google Classroom authorization successful",
  "user_id": "user123"
}
```

#### Check Google Classroom Status
```http
GET /google-classroom/status/{user_id}
```

**Response:**
```json
{
  "user_id": "user123",
  "is_authorized": true,
  "message": "User has Google Classroom access"
}
```

#### Get User Courses
```http
GET /google-classroom/courses/{user_id}
```

**Response:**
```json
{
  "user_id": "user123",
  "courses": [
    {
      "id": "course_123",
      "name": "Advanced Mathematics",
      "section": "Section A",
      "description": "Advanced calculus and linear algebra",
      "room": "Room 101",
      "owner_id": "teacher_123",
      "creation_time": "2023-01-01T00:00:00.000Z",
      "enrollment_code": "ABC123",
      "course_state": "ACTIVE",
      "alternate_link": "https://classroom.google.com/c/course_123"
    }
  ],
  "total_courses": 1
}
```

#### Get Course Materials
```http
GET /google-classroom/materials/{user_id}/{course_id}
```

**Response:**
```json
{
  "user_id": "user123",
  "course_id": "course_123",
  "materials": [
    {
      "id": "material_123",
      "course_id": "course_123",
      "title": "Week 1 Lecture Notes",
      "description": "Notes from the first week of class",
      "state": "PUBLISHED",
      "creation_time": "2023-01-01T00:00:00.000Z",
      "update_time": "2023-01-01T00:00:00.000Z",
      "materials": [
        {
          "driveFile": {
            "driveFile": {
              "id": "file_123",
              "title": "lecture_notes.pdf"
            },
            "shareMode": "VIEW"
          }
        }
      ],
      "alternate_link": "https://classroom.google.com/c/course_123/m/material_123"
    }
  ],
  "total_materials": 1
}
```

#### Get Course Assignments
```http
GET /google-classroom/assignments/{user_id}/{course_id}
```

**Response:**
```json
{
  "user_id": "user123",
  "course_id": "course_123",
  "assignments": [
    {
      "id": "assignment_123",
      "course_id": "course_123",
      "title": "Homework 1",
      "description": "Complete exercises 1-10",
      "state": "PUBLISHED",
      "due_date": {
        "year": 2023,
        "month": 1,
        "day": 15
      },
      "due_time": {
        "hours": 23,
        "minutes": 59
      },
      "creation_time": "2023-01-01T00:00:00.000Z",
      "update_time": "2023-01-01T00:00:00.000Z",
      "materials": [],
      "work_type": "ASSIGNMENT",
      "max_points": 100,
      "alternate_link": "https://classroom.google.com/c/course_123/a/assignment_123"
    }
  ],
  "total_assignments": 1
}
```

#### Get Course Announcements
```http
GET /google-classroom/announcements/{user_id}/{course_id}
```

**Response:**
```json
{
  "user_id": "user123",
  "course_id": "course_123",
  "announcements": [
    {
      "id": "announcement_123",
      "course_id": "course_123",
      "text": "Class will be cancelled next Monday due to holiday",
      "state": "PUBLISHED",
      "creation_time": "2023-01-01T00:00:00.000Z",
      "update_time": "2023-01-01T00:00:00.000Z",
      "materials": [],
      "alternate_link": "https://classroom.google.com/c/course_123/n/announcement_123"
    }
  ],
  "total_announcements": 1
}
```

#### Process Course Materials
```http
POST /google-classroom/process/{user_id}/{course_id}
```

**Response:**
```json
{
  "user_id": "user123",
  "course_id": "course_123",
  "processing_result": {
    "total_processed": 5,
    "errors": [],
    "materials_synced": 3,
    "assignments_synced": 2
  }
}
```

#### Revoke Google Classroom Access
```http
DELETE /google-classroom/revoke/{user_id}
```

**Response:**
```json
{
  "message": "Google Classroom access revoked successfully",
  "user_id": "user123"
}
```

### Document Management

#### Upload Document
```http
POST /upload/
```

**Form Data:**
- `file`: File to upload (PDF, DOCX, PPTX, TXT)
- `user_id`: User identifier
- `document_name`: Optional document name

**Response:**
```json
{
  "message": "Document processed successfully",
  "document_id": "doc_123",
  "filename": "lecture_notes.pdf",
  "chunks_processed": 15,
  "processing_time": 2.5
}
```

#### List User Documents
```http
GET /documents/{user_id}
```

**Response:**
```json
{
  "documents": [
    {
      "document_id": "doc_123",
      "filename": "lecture_notes.pdf",
      "upload_time": "2023-01-01T00:00:00.000Z",
      "file_size": 1024000,
      "file_type": "application/pdf"
    }
  ]
}
```

#### Search Documents
```http
POST /search/
```

**Form Data:**
- `user_id`: User identifier
- `query`: Search query
- `top_k`: Number of results to return (default: 5)

**Response:**
```json
{
  "query": "linear algebra",
  "results": [
    {
      "document_id": "doc_123",
      "filename": "lecture_notes.pdf",
      "content": "Linear algebra is a branch of mathematics...",
      "score": 0.95,
      "metadata": {
        "page": 1,
        "chunk_id": "chunk_1",
        "source": "google_classroom"
      }
    }
  ],
  "total_results": 1
}
```

#### Delete Document
```http
DELETE /documents/{document_id}?user_id={user_id}
```

**Response:**
```json
{
  "message": "Document deleted successfully"
}
```

## Error Responses

All endpoints return standard HTTP error codes:

- `400 Bad Request`: Invalid request parameters
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

**Error Response Format:**
```json
{
  "detail": "Error description"
}
```

## Usage Examples

### 1. Complete Google Classroom Integration Flow

```javascript
// 1. Create user
const user = await fetch('/users/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: 'user123',
    name: 'John Doe',
    email: 'john@example.com'
  })
});

// 2. Get authorization URL
const authResponse = await fetch('/auth/google-classroom/user123');
const { auth_url } = await authResponse.json();

// 3. User visits auth_url and authorizes access
// 4. Handle callback at /auth/callback

// 5. Check authorization status
const statusResponse = await fetch('/google-classroom/status/user123');
const { is_authorized } = await statusResponse.json();

// 6. Get courses
const coursesResponse = await fetch('/google-classroom/courses/user123');
const { courses } = await coursesResponse.json();

// 7. Process course materials
await fetch(`/google-classroom/process/user123/${courses[0].id}`, {
  method: 'POST'
});

// 8. Search processed documents
const searchResponse = await fetch('/search/', {
  method: 'POST',
  body: new FormData({
    user_id: 'user123',
    query: 'linear algebra concepts',
    top_k: 10
  })
});
```

### 2. Manual Document Upload

```javascript
// Upload a document
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('user_id', 'user123');
formData.append('document_name', 'My Notes');

const response = await fetch('/upload/', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(`Uploaded: ${result.filename}`);
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 100 requests per minute per user
- 10 concurrent requests per user

## Security Notes

- Store user IDs securely on the frontend
- Google Classroom OAuth2 follows standard security practices
- All file uploads are validated for security
- Sensitive operations require user authentication

## Development Notes

- The API runs on port 8000 by default
- CORS is enabled for all origins (configure for production)
- Logs are written to stdout with INFO level
- Database is stored in SQLite for simplicity

## Next Phase Features

The following features are planned for future implementation:

1. **Academic Schedule Generator** - API endpoints for creating and managing study schedules
2. **Deadline Management** - Tracking and reminders for assignments and exams
3. **Enhanced Educational Search** - Smart filtering and recommendations
4. **Study Analytics** - Progress tracking and performance insights
5. **Collaboration Features** - Sharing and group study functionality