import os
import logging
import sqlite3
from typing import Dict, Any, Optional, List
from datetime import datetime
from database import get_vector_db

logger = logging.getLogger(__name__)

class UserManager:
    def __init__(self):
        self.vector_db = None
    
    async def init(self):
        """Initialize user manager with database connection"""
        self.vector_db = await get_vector_db()
    
    async def create_user(self, user_id: str, name: str, email: str) -> Dict[str, Any]:
        """Create a new user"""
        try:
            if not self.vector_db:
                await self.init()
            
            with sqlite3.connect(self.vector_db.db_path) as conn:
                cursor = conn.cursor()
                
                # Check if user already exists
                cursor.execute('SELECT user_id FROM users WHERE user_id = ?', (user_id,))
                if cursor.fetchone():
                    raise Exception("User already exists")
                
                # Insert new user
                created_at = datetime.utcnow().isoformat()
                cursor.execute('''
                    INSERT INTO users (user_id, name, email, created_at)
                    VALUES (?, ?, ?, ?)
                ''', (user_id, name, email, created_at))
                
                conn.commit()
                logger.info(f"Created user: {user_id}")
                
                return {
                    "user_id": user_id,
                    "name": name,
                    "email": email,
                    "created_at": created_at
                }
                
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            raise e
    
    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user information"""
        try:
            if not self.vector_db:
                await self.init()
            
            with sqlite3.connect(self.vector_db.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT user_id, name, email, created_at
                    FROM users WHERE user_id = ?
                ''', (user_id,))
                
                row = cursor.fetchone()
                if row:
                    return {
                        "user_id": row[0],
                        "name": row[1],
                        "email": row[2],
                        "created_at": row[3]
                    }
                return None
                
        except Exception as e:
            logger.error(f"Error getting user: {str(e)}")
            return None
    
    async def update_user(self, user_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update user information"""
        try:
            if not self.vector_db:
                await self.init()
            
            with sqlite3.connect(self.vector_db.db_path) as conn:
                cursor = conn.cursor()
                
                # Check if user exists
                cursor.execute('SELECT user_id FROM users WHERE user_id = ?', (user_id,))
                if not cursor.fetchone():
                    return None
                
                # Build update query
                set_fields = []
                values = []
                for key, value in updates.items():
                    if key in ['name', 'email']:
                        set_fields.append(f"{key} = ?")
                        values.append(value)
                
                if not set_fields:
                    return await self.get_user(user_id)
                
                values.append(user_id)
                query = f"UPDATE users SET {', '.join(set_fields)} WHERE user_id = ?"
                
                cursor.execute(query, values)
                conn.commit()
                
                logger.info(f"Updated user: {user_id}")
                return await self.get_user(user_id)
                
        except Exception as e:
            logger.error(f"Error updating user: {str(e)}")
            return None
    
    async def delete_user(self, user_id: str) -> bool:
        """Delete a user and all their documents"""
        try:
            if not self.vector_db:
                await self.init()
            
            with sqlite3.connect(self.vector_db.db_path) as conn:
                cursor = conn.cursor()
                
                # Delete user's documents and chunks (CASCADE will handle chunks)
                cursor.execute('DELETE FROM documents WHERE user_id = ?', (user_id,))
                cursor.execute('DELETE FROM users WHERE user_id = ?', (user_id,))
                
                conn.commit()
                logger.info(f"Deleted user: {user_id}")
                return True
                
        except Exception as e:
            logger.error(f"Error deleting user: {str(e)}")
            return False
    
    async def list_users(self) -> List[Dict[str, Any]]:
        """List all users"""
        try:
            if not self.vector_db:
                await self.init()
            
            with sqlite3.connect(self.vector_db.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT user_id, name, email, created_at
                    FROM users ORDER BY created_at DESC
                ''')
                
                users = []
                for row in cursor.fetchall():
                    users.append({
                        "user_id": row[0],
                        "name": row[1],
                        "email": row[2],
                        "created_at": row[3]
                    })
                
                return users
                
        except Exception as e:
            logger.error(f"Error listing users: {str(e)}")
            return []
