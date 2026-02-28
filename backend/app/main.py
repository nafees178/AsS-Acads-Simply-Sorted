from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import os
import uuid
import logging
from datetime import datetime

# Import our modules
from database import get_vector_db, init_vector_db
from document_processor import DocumentProcessor
from user_manager import UserManager
from search_engine import SearchEngine
from google_classroom_service import GoogleClassroomService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Document Processing API",
    description="API for uploading, processing, and searching documents",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components
document_processor = DocumentProcessor()
user_manager = UserManager()

# We'll get the vector_db instance when needed in each endpoint

class User(BaseModel):
    user_id: str
    name: str
    email: str

class SearchResult(BaseModel):
    document_id: str
    filename: str
    content: str
    score: float
    metadata: dict

@app.on_event("startup")
async def startup_event():
    """Initialize the application on startup"""
    await init_vector_db()
    logger.info("Application started successfully")

@app.post("/users/", response_model=User)
async def create_user(user: User):
    """Create a new user"""
    try:
        created_user = await user_manager.create_user(user.user_id, user.name, user.email)
        return created_user
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    """Get user information"""
    try:
        user = await user_manager.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except Exception as e:
        logger.error(f"Error getting user: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload/")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    document_name: Optional[str] = Form(None)
):
    """Upload and process a document"""
    try:
        # Validate user exists
        user = await user_manager.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Generate document ID
        document_id = str(uuid.uuid4())
        
        # Get filename - prioritize file.filename, then document_name, then generate
        if file.filename and file.filename.strip():
            filename = file.filename
        elif document_name and document_name.strip():
            filename = document_name
        else:
            filename = f"document_{document_id}"
        
        logger.info(f"Uploading document: filename='{filename}', original='{file.filename}', document_name='{document_name}'")
        
        # Process the document
        result = await document_processor.process_document(
            file=file,
            user_id=user_id,
            document_id=document_id,
            filename=filename
        )
        
        return {
            "message": "Document processed successfully",
            "document_id": document_id,
            "filename": filename,
            "chunks_processed": result["chunks_processed"],
            "processing_time": result["processing_time"]
        }
        
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/{user_id}")
async def list_user_documents(user_id: str):
    """List all documents for a user"""
    try:
        documents = await document_processor.get_user_documents(user_id)
        return {"documents": documents}
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search/")
async def search_documents(
    user_id: str = Form(...),
    query: str = Form(...),
    top_k: int = Form(5)
):
    """Search documents for a query"""
    try:
        # Validate user exists
        user = await user_manager.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get vector database instance
        vector_db = await get_vector_db()
        search_engine = SearchEngine(vector_db)
        
        # Perform search
        results = await search_engine.search(
            user_id=user_id,
            query=query,
            top_k=top_k
        )
        
        return {
            "query": query,
            "results": results,
            "total_results": len(results)
        }
        
    except Exception as e:
        logger.error(f"Error searching documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/documents/{document_id}")
async def delete_document(document_id: str, user_id: str):
    """Delete a document and its embeddings"""
    try:
        # Validate user exists
        user = await user_manager.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Delete document
        success = await document_processor.delete_document(document_id, user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Document not found")
        
        return {"message": "Document deleted successfully"}
        
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Google Classroom API Endpoints

@app.get("/auth/google-classroom/{user_id}")
async def get_google_classroom_auth_url(user_id: str):
    """Get Google Classroom OAuth2 authorization URL"""
    try:
        # Validate user exists
        user = await user_manager.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Initialize Google Classroom service
        classroom_service = GoogleClassroomService()
        
        # Get authorization URL
        auth_url = classroom_service.get_authorization_url(user_id)
        
        return {
            "auth_url": auth_url,
            "message": "Please visit this URL to authorize Google Classroom access"
        }
        
    except Exception as e:
        logger.error(f"Error getting Google Classroom auth URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/auth/callback")
async def google_classroom_callback(code: str = None, state: str = None):
    """Handle Google Classroom OAuth2 callback"""
    try:
        # Extract user_id from state parameter
        if not state:
            raise HTTPException(status_code=400, detail="Missing state parameter")
        
        user_id = state
        
        # Validate user exists
        user = await user_manager.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Reconstruct authorization response URL - use the full URL from Google
        from urllib.parse import urlencode, quote
        base_url = "http://localhost:8000/auth/callback"
        
        # Build the query parameters, including all parameters from Google
        params = {}
        if code:
            params['code'] = code
        if state:
            params['state'] = state
        
        # Add other parameters that Google might send
        import sys
        from urllib.parse import urlparse, parse_qs
        
        # If we have the full URL, parse it properly
        full_url = f"{base_url}?{urlencode(params)}"
        
        logger.info(f"Reconstructed authorization URL: {full_url}")
        
        # Initialize Google Classroom service
        classroom_service = GoogleClassroomService()
        
        # Handle OAuth callback
        success = classroom_service.handle_oauth_callback(user_id, full_url)
        
        if success:
            return {
                "message": "Google Classroom authorization successful",
                "user_id": user_id
            }
        else:
            raise HTTPException(status_code=400, detail="Google Classroom authorization failed")
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"Error handling Google Classroom callback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Callback error: {str(e)}")

@app.get("/google-classroom/courses/{user_id}")
async def get_user_courses(user_id: str):
    """Get user's Google Classroom courses"""
    try:
        # Validate user exists
        user = await user_manager.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Initialize Google Classroom service
        classroom_service = GoogleClassroomService()
        
        # Sync courses
        courses = await classroom_service.sync_courses(user_id)
        
        return {
            "user_id": user_id,
            "courses": courses,
            "total_courses": len(courses)
        }
        
    except Exception as e:
        logger.error(f"Error getting Google Classroom courses: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/google-classroom/materials/{user_id}/{course_id}")
async def get_course_materials(user_id: str, course_id: str):
    """Get materials for a specific Google Classroom course"""
    try:
        # Validate user exists
        user = await user_manager.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Initialize Google Classroom service
        classroom_service = GoogleClassroomService()
        
        # Sync materials
        materials = await classroom_service.sync_course_materials(user_id, course_id)
        
        return {
            "user_id": user_id,
            "course_id": course_id,
            "materials": materials,
            "total_materials": len(materials)
        }
        
    except Exception as e:
        logger.error(f"Error getting Google Classroom materials: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/google-classroom/assignments/{user_id}/{course_id}")
async def get_course_assignments(user_id: str, course_id: str):
    """Get assignments for a specific Google Classroom course"""
    try:
        # Validate user exists
        user = await user_manager.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Initialize Google Classroom service
        classroom_service = GoogleClassroomService()
        
        # Sync assignments
        assignments = await classroom_service.sync_assignments(user_id, course_id)
        
        return {
            "user_id": user_id,
            "course_id": course_id,
            "assignments": assignments,
            "total_assignments": len(assignments)
        }
        
    except Exception as e:
        logger.error(f"Error getting Google Classroom assignments: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/google-classroom/announcements/{user_id}/{course_id}")
async def get_course_announcements(user_id: str, course_id: str):
    """Get announcements for a specific Google Classroom course"""
    try:
        # Validate user exists
        user = await user_manager.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Initialize Google Classroom service
        classroom_service = GoogleClassroomService()
        
        # Sync announcements
        announcements = await classroom_service.sync_announcements(user_id, course_id)
        
        return {
            "user_id": user_id,
            "course_id": course_id,
            "announcements": announcements,
            "total_announcements": len(announcements)
        }
        
    except Exception as e:
        logger.error(f"Error getting Google Classroom announcements: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/google-classroom/process/{user_id}/{course_id}")
async def process_classroom_course(user_id: str, course_id: str):
    """Process all materials from a Google Classroom course"""
    try:
        # Validate user exists
        user = await user_manager.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Initialize Google Classroom service
        classroom_service = GoogleClassroomService()
        
        # Process course materials
        result = await classroom_service.process_classroom_materials(user_id, course_id)
        
        return {
            "user_id": user_id,
            "course_id": course_id,
            "processing_result": result
        }
        
    except Exception as e:
        logger.error(f"Error processing Google Classroom course: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/google-classroom/status/{user_id}")
async def get_classroom_status(user_id: str):
    """Check if user has Google Classroom authorization"""
    try:
        # Validate user exists
        user = await user_manager.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Initialize Google Classroom service
        classroom_service = GoogleClassroomService()
        
        # Check if credentials exist
        creds = classroom_service.get_credentials(user_id)
        is_authorized = creds is not None and creds.valid
        
        return {
            "user_id": user_id,
            "is_authorized": is_authorized,
            "message": "User has Google Classroom access" if is_authorized else "User needs to authorize Google Classroom"
        }
        
    except Exception as e:
        logger.error(f"Error checking Google Classroom status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/google-classroom/revoke/{user_id}")
async def revoke_classroom_access(user_id: str):
    """Revoke Google Classroom access for user"""
    try:
        # Validate user exists
        user = await user_manager.get_user(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Initialize Google Classroom service
        classroom_service = GoogleClassroomService()
        
        # Revoke credentials
        success = classroom_service.revoke_credentials(user_id)
        
        if success:
            return {
                "message": "Google Classroom access revoked successfully",
                "user_id": user_id
            }
        else:
            return {
                "message": "No Google Classroom credentials found to revoke",
                "user_id": user_id
            }
        
    except Exception as e:
        logger.error(f"Error revoking Google Classroom access: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Document Processing API is running"}

if __name__ == "__main__":
    import uvicorn
    print("app running on 0.0.0.0")
    uvicorn.run(app, host="0.0.0.0", port=8000)