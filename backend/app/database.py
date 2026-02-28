import os
import logging
import sqlite3
import json
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime

import config

logger = logging.getLogger(__name__)

# Configuration
DB_PATH = str(config.DB_PATH)

class VectorDatabase:
    def __init__(self):
        self.db_path = DB_PATH
        self.init_db()
    
    def init_db(self):
        """Initialize SQLite database and create tables"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Create users table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS users (
                        user_id TEXT PRIMARY KEY,
                        name TEXT NOT NULL,
                        email TEXT NOT NULL,
                        created_at TEXT NOT NULL
                    )
                ''')
                
                # Create documents table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS documents (
                        document_id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        filename TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY (user_id) REFERENCES users (user_id)
                    )
                ''')
                
                # Create chunks table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS chunks (
                        chunk_id TEXT PRIMARY KEY,
                        document_id TEXT NOT NULL,
                        user_id TEXT NOT NULL,
                        chunk_index INTEGER NOT NULL,
                        content TEXT NOT NULL,
                        embedding TEXT NOT NULL,
                        metadata TEXT,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY (document_id) REFERENCES documents (document_id),
                        FOREIGN KEY (user_id) REFERENCES users (user_id)
                    )
                ''')
                
                conn.commit()
                logger.info("Database initialized successfully")
                
        except Exception as e:
            logger.error(f"Error initializing database: {str(e)}")
            raise
    
    async def store_embeddings(self, user_id: str, document_id: str, filename: str, 
                             chunks: List[Dict[str, Any]], embeddings: List[List[float]]):
        """Store document chunks and their embeddings in SQLite"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Insert document
                cursor.execute('''
                    INSERT OR REPLACE INTO documents (document_id, user_id, filename, created_at)
                    VALUES (?, ?, ?, ?)
                ''', (document_id, user_id, filename, datetime.utcnow().isoformat()))
                
                # Insert chunks
                for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                    chunk_id = str(uuid.uuid4())
                    
                    cursor.execute('''
                        INSERT INTO chunks (
                            chunk_id, document_id, user_id, chunk_index, 
                            content, embedding, metadata, created_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        chunk_id, document_id, user_id, i,
                        chunk["content"], json.dumps(embedding), 
                        json.dumps(chunk.get("metadata", {})),
                        datetime.utcnow().isoformat()
                    ))
                
                conn.commit()
                logger.info(f"Stored {len(chunks)} chunks for document {document_id}")
                return True
                
        except Exception as e:
            logger.error(f"Error storing embeddings: {str(e)}")
            return False
    
    async def search_similar(self, user_id: str, query_embedding: List[float], 
                           top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar documents using cosine similarity"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Get all chunks for the user
                cursor.execute('''
                    SELECT c.chunk_id, c.document_id, c.chunk_index, c.content, 
                           c.embedding, c.metadata, c.created_at, d.filename
                    FROM chunks c
                    JOIN documents d ON c.document_id = d.document_id
                    WHERE c.user_id = ?
                ''', (user_id,))
                
                results = []
                total_chunks = 0
                matching_chunks = 0
                
                for row in cursor.fetchall():
                    chunk_id, document_id, chunk_index, content, embedding_str, metadata_str, created_at, filename = row
                    total_chunks += 1
                    
                    # Calculate cosine similarity
                    stored_embedding = json.loads(embedding_str)
                    similarity = self._cosine_similarity(query_embedding, stored_embedding)
                    
                    # Only include results with meaningful similarity
                    if similarity > 0.1:  # Threshold to filter out noise
                        matching_chunks += 1
                        results.append({
                            "document_id": document_id,
                            "filename": filename,
                            "content": content,
                            "score": similarity,
                            "metadata": {
                                "chunk_index": chunk_index,
                                "created_at": created_at
                            }
                        })
                
                logger.info(f"Search completed: {total_chunks} total chunks, {matching_chunks} matches above threshold")
                
                # Sort by similarity score and return top k
                results.sort(key=lambda x: x["score"], reverse=True)
                return results[:top_k]
                
        except Exception as e:
            logger.error(f"Error searching similar documents: {str(e)}")
            return []
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine similarity between two vectors"""
        try:
            import math
            
            # Ensure vectors are the same length
            if len(vec1) != len(vec2):
                logger.warning(f"Vector length mismatch: {len(vec1)} vs {len(vec2)}")
                min_len = min(len(vec1), len(vec2))
                vec1 = vec1[:min_len]
                vec2 = vec2[:min_len]
            
            # Calculate dot product
            dot_product = sum(a * b for a, b in zip(vec1, vec2))
            
            # Calculate magnitudes
            magnitude1 = math.sqrt(sum(a * a for a in vec1))
            magnitude2 = math.sqrt(sum(b * b for b in vec2))
            
            # Avoid division by zero
            if magnitude1 == 0 or magnitude2 == 0:
                return 0.0
            
            # Calculate cosine similarity
            similarity = dot_product / (magnitude1 * magnitude2)
            
            # Log similarity for debugging
            logger.debug(f"Cosine similarity: {similarity}")
            
            return similarity
            
        except Exception as e:
            logger.error(f"Error calculating cosine similarity: {str(e)}")
            return 0.0
    
    async def get_user_documents(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all documents for a specific user"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT d.document_id, d.filename, d.created_at,
                           COUNT(c.chunk_id) as chunks
                    FROM documents d
                    LEFT JOIN chunks c ON d.document_id = c.document_id
                    WHERE d.user_id = ?
                    GROUP BY d.document_id, d.filename, d.created_at
                    ORDER BY d.created_at DESC
                ''', (user_id,))
                
                documents = []
                for row in cursor.fetchall():
                    document_id, filename, created_at, chunks = row
                    documents.append({
                        "document_id": document_id,
                        "filename": filename,
                        "created_at": created_at,
                        "chunks": chunks or 0
                    })
                
                return documents
                
        except Exception as e:
            logger.error(f"Error getting user documents: {str(e)}")
            return []
    
    async def delete_document(self, user_id: str, document_id: str) -> bool:
        """Delete all chunks of a document for a specific user"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Delete chunks
                cursor.execute('''
                    DELETE FROM chunks 
                    WHERE user_id = ? AND document_id = ?
                ''', (user_id, document_id))
                
                # Delete document
                cursor.execute('''
                    DELETE FROM documents 
                    WHERE user_id = ? AND document_id = ?
                ''', (user_id, document_id))
                
                conn.commit()
                logger.info(f"Deleted document {document_id} for user {user_id}")
                return True
                
        except Exception as e:
            logger.error(f"Error deleting document: {str(e)}")
            return False

# Global instance
_vector_db: Optional[VectorDatabase] = None

async def get_vector_db() -> VectorDatabase:
    """Get the global vector database instance"""
    global _vector_db
    if _vector_db is None:
        _vector_db = VectorDatabase()
    return _vector_db

async def init_vector_db():
    """Initialize the vector database"""
    global _vector_db
    if _vector_db is None:
        _vector_db = VectorDatabase()
