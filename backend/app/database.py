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
CORE_DB_PATH = str(config.CORE_DB_PATH)
VECTOR_DB_PATH = str(config.VECTOR_DB_PATH)

class VectorDatabase:
    def __init__(self):
        self.core_db_path = CORE_DB_PATH
        self.vector_db_path = VECTOR_DB_PATH
        self.init_db()
    
    def init_db(self):
        """Initialize both SQLite databases and create tables"""
        try:
            # 1. Initialize Core Database (Metadata, Jobs)
            with sqlite3.connect(self.core_db_path) as conn:
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
                
                # Create processing_jobs table (GC background sync status)
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS processing_jobs (
                        user_id TEXT,
                        course_id TEXT,
                        status TEXT,
                        updated_at TEXT,
                        PRIMARY KEY (user_id, course_id)
                    )
                ''')

                # Create video_jobs table (AI Studio persistence)
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS video_jobs (
                        job_id TEXT PRIMARY KEY,
                        user_id TEXT,
                        topic TEXT,
                        status TEXT,
                        progress TEXT,
                        output_dir TEXT,
                        final_video TEXT,
                        error TEXT,
                        created_at TEXT,
                        updated_at TEXT
                    )
                ''')

                # Create classroom_courses table for caching
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS classroom_courses (
                        user_id TEXT,
                        course_id TEXT,
                        data_json TEXT,
                        updated_at TEXT,
                        PRIMARY KEY (user_id, course_id)
                    )
                ''')

                # Create classroom_assignments table for caching
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS classroom_assignments (
                        user_id TEXT,
                        course_id TEXT,
                        data_json TEXT,
                        updated_at TEXT,
                        PRIMARY KEY (user_id, course_id)
                    )
                ''')

                # Create classroom_materials table for caching
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS classroom_materials (
                        user_id TEXT,
                        course_id TEXT,
                        data_json TEXT,
                        updated_at TEXT,
                        PRIMARY KEY (user_id, course_id)
                    )
                ''')
                
                conn.commit()
                logger.info("Core database initialized successfully")

            # 2. Initialize Vector Database (Documents, Embeddings)
            with sqlite3.connect(self.vector_db_path) as conn:
                cursor = conn.cursor()
                
                # Create documents table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS documents (
                        document_id TEXT PRIMARY KEY,
                        user_id TEXT NOT NULL,
                        filename TEXT NOT NULL,
                        created_at TEXT NOT NULL,
                        summary TEXT,
                        course_id TEXT
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
                        embedding BLOB NOT NULL,
                        metadata TEXT,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY (document_id) REFERENCES documents (document_id)
                    )
                ''')
                
                conn.commit()
                logger.info("Vector database initialized successfully")
                
        except Exception as e:
            logger.error(f"Error initializing databases: {str(e)}")
            raise
    
    # helper for specific DB connections
    def get_core_conn(self): return sqlite3.connect(self.core_db_path)
    def get_vector_conn(self): return sqlite3.connect(self.vector_db_path)

    async def store_embeddings(self, user_id: str, document_id: str, filename: str, 
                             chunks: List[Dict[str, Any]], embeddings: List[List[float]], summary: str = "", course_id: str = None) -> bool:
        """Store document chunks and their embeddings in Vector Database"""
        try:
            with self.get_vector_conn() as conn:
                cursor = conn.cursor()
                
                # Insert document
                cursor.execute('''
                    INSERT OR REPLACE INTO documents (document_id, user_id, filename, created_at, summary, course_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (document_id, user_id, filename, datetime.utcnow().isoformat(), summary, course_id))
                
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
                logger.info(f"Stored {len(chunks)} chunks for document {document_id} in vector store")
                return True
                
        except Exception as e:
            logger.error(f"Error storing embeddings: {str(e)}")
            return False
    
    async def search_similar(self, user_id: str, query_embedding: List[float], 
                           top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for similar documents using cosine similarity from Vector Database"""
        try:
            with self.get_vector_conn() as conn:
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
        """Get all documents for a specific user from Vector Database"""
        try:
            with self.get_vector_conn() as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT d.document_id, d.filename, d.created_at, d.summary, d.course_id,
                           COUNT(c.chunk_id) as chunks
                    FROM documents d
                    LEFT JOIN chunks c ON d.document_id = c.document_id
                    WHERE d.user_id = ?
                    GROUP BY d.document_id, d.filename, d.created_at, d.summary, d.course_id
                    ORDER BY d.created_at DESC
                ''', (user_id,))
                
                documents = []
                for row in cursor.fetchall():
                    document_id, filename, created_at, summary, course_id, chunks = row
                    documents.append({
                        "document_id": document_id,
                        "filename": filename,
                        "created_at": created_at,
                        "summary": summary or "",
                        "chunks": chunks or 0,
                        "course_id": course_id
                    })
                
                return documents
                
        except Exception as e:
            logger.error(f"Error getting user documents: {str(e)}")
            return []
    
    async def delete_document(self, user_id: str, document_id: str) -> bool:
        """Delete a document and its embeddings from Vector Database"""
        try:
            with self.get_vector_conn() as conn:
                cursor = conn.cursor()
                
                # Verify ownership
                cursor.execute('SELECT 1 FROM documents WHERE document_id = ? AND user_id = ?', (document_id, user_id))
                if not cursor.fetchone():
                    return False
                
                # Delete chunks (cascading manually if needed, but we do it explicitly here)
                cursor.execute('DELETE FROM chunks WHERE document_id = ?', (document_id,))
                
                # Delete document record
                cursor.execute('DELETE FROM documents WHERE document_id = ?', (document_id,))
                
                conn.commit()
                logger.info(f"Deleted document {document_id} for user {user_id}")
                return True
                
        except Exception as e:
            logger.error(f"Error deleting document: {str(e)}")
            return False

    async def set_processing_status(self, user_id: str, course_id: str, status: str) -> bool:
        """Set processing status in Core Database"""
        try:
            with self.get_core_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT OR REPLACE INTO processing_jobs (user_id, course_id, status, updated_at)
                    VALUES (?, ?, ?, ?)
                ''', (user_id, course_id, status, datetime.utcnow().isoformat()))
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Error setting processing status: {str(e)}")
            return False

    async def get_processing_status(self, user_id: str, course_id: str) -> str:
        """Get processing status from Core Database"""
        try:
            with self.get_core_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT status FROM processing_jobs WHERE user_id = ? AND course_id = ?', (user_id, course_id))
                row = cursor.fetchone()
                return row[0] if row else "idle"
        except Exception as e:
            logger.error(f"Error getting processing status: {str(e)}")
            return "error"

    # --- Classroom Caching ---

    async def cache_classroom_data(self, user_id: str, course_id: str, data_type: str, data: Any) -> bool:
        """
        Cache Classroom data (courses, assignments, or materials) in Core Database.
        data_type: 'courses', 'assignments', 'materials'
        """
        table_map = {
            'courses': 'classroom_courses',
            'assignments': 'classroom_assignments',
            'materials': 'classroom_materials'
        }
        table = table_map.get(data_type)
        if not table: return False

        try:
            with self.get_core_conn() as conn:
                cursor = conn.cursor()
                cursor.execute(f'''
                    INSERT OR REPLACE INTO {table} (user_id, course_id, data_json, updated_at)
                    VALUES (?, ?, ?, ?)
                ''', (user_id, course_id, json.dumps(data), datetime.utcnow().isoformat()))
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Error caching {data_type}: {str(e)}")
            return False

    async def get_cached_classroom_data(self, user_id: str, course_id: str, data_type: str, max_age_minutes: int = 30) -> Optional[Any]:
        """
        Retrieve cached Classroom data if it's fresh enough.
        """
        table_map = {
            'courses': 'classroom_courses',
            'assignments': 'classroom_assignments',
            'materials': 'classroom_materials'
        }
        table = table_map.get(data_type)
        if not table: return None

        try:
            with self.get_core_conn() as conn:
                cursor = conn.cursor()
                cursor.execute(f'SELECT data_json, updated_at FROM {table} WHERE user_id = ? AND course_id = ?', (user_id, course_id))
                row = cursor.fetchone()
                if not row: return None

                data_json, updated_at = row
                updated_dt = datetime.fromisoformat(updated_at)
                age = (datetime.utcnow() - updated_dt).total_seconds() / 60

                if age > max_age_minutes:
                    logger.info(f"Cache expired for {data_type} ({age:.1f} mins old)")
                    return None
                
                return json.loads(data_json)
        except Exception as e:
            logger.error(f"Error getting cached {data_type}: {str(e)}")
            return None

    async def get_document_info(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Get info for a single document by its document_id"""
        try:
            with self.get_vector_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    SELECT document_id, filename, summary, user_id, course_id, created_at
                    FROM documents WHERE document_id = ?
                ''', (document_id,))
                row = cursor.fetchone()
                if not row:
                    return None
                return {
                    "document_id": row[0],
                    "filename": row[1],
                    "summary": row[2],
                    "user_id": row[3],
                    "course_id": row[4],
                    "created_at": row[5]
                }
        except Exception as e:
            logger.error(f"Error getting document info: {str(e)}")
            return None

    # --- Video Jobs Persistence ---

    async def save_video_job(self, job_data: Dict[str, Any]) -> bool:
        """Save or update a video job in Core Database"""
        try:
            with self.get_core_conn() as conn:
                cursor = conn.cursor()
                now = datetime.utcnow().isoformat()
                cursor.execute('''
                    INSERT OR REPLACE INTO video_jobs (
                        job_id, user_id, topic, status, progress, 
                        output_dir, final_video, error, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    job_data['job_id'], job_data.get('user_id'), job_data['topic'],
                    job_data['status'], job_data['progress'], job_data.get('output_dir'),
                    job_data.get('final_video'), job_data.get('error'),
                    job_data.get('created_at', now), now
                ))
                conn.commit()
                return True
        except Exception as e:
            logger.error(f"Error saving video job: {str(e)}")
            return False

    async def get_video_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a video job from Core Database"""
        try:
            with self.get_core_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('SELECT * FROM video_jobs WHERE job_id = ?', (job_id,))
                row = cursor.fetchone()
                if not row: return None
                
                # Get column names from cursor description
                cols = [d[0] for d in cursor.description]
                return dict(zip(cols, row))
        except Exception as e:
            logger.error(f"Error getting video job: {str(e)}")
            return None

    async def list_video_jobs(self, user_id: str = None) -> List[Dict[str, Any]]:
        """List all video jobs (optionally for a specific user)"""
        try:
            with self.get_core_conn() as conn:
                cursor = conn.cursor()
                if user_id:
                    cursor.execute('SELECT * FROM video_jobs WHERE user_id = ? ORDER BY created_at DESC', (user_id,))
                else:
                    cursor.execute('SELECT * FROM video_jobs ORDER BY created_at DESC')
                
                cols = [d[0] for d in cursor.description]
                return [dict(zip(cols, row)) for row in cursor.fetchall()]
        except Exception as e:
            logger.error(f"Error listing video jobs: {str(e)}")
            return []

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
