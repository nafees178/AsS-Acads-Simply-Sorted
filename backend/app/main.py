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

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Document Processing API is running"}

if __name__ == "__main__":
    import uvicorn
    print("app running on 0.0.0.0")
    uvicorn.run(app, host="0.0.0.0", port=8000)