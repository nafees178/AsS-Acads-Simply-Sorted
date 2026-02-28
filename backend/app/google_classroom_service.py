import os
import json
import logging
import secrets
import string
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow, InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import pickle
from pathlib import Path
import base64
import hashlib

import config
from database import get_vector_db
from document_processor import DocumentProcessor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GoogleClassroomService:
    """Service for handling Google Classroom API operations"""
    
    # If modifying these scopes, delete the file token.pickle.
    SCOPES = [
        'https://www.googleapis.com/auth/classroom.courses.readonly',
        'https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly',
        'https://www.googleapis.com/auth/classroom.announcements.readonly',
        'https://www.googleapis.com/auth/classroom.student-submissions.me.readonly',
        'https://www.googleapis.com/auth/drive.readonly'
    ]
    
    def __init__(self, credentials_file: str = "credentials.json"):
        """
        Initialize Google Classroom service
        
        Args:
            credentials_file: Path to Google API credentials JSON file
        """
        self.credentials_file = str(config.CREDENTIALS_FILE)
        self.document_processor = DocumentProcessor()
        
    def get_credentials(self, user_id: str) -> Optional[Credentials]:
        """
        Get valid user credentials from storage.
        
        Args:
            user_id: User identifier
            
        Returns:
            Credentials object or None if not available
        """
        creds = None
        token_file = str(config.TOKENS_DIR / f"token_{user_id}.pickle")
        
        # The file token.pickle stores the user's access and refresh tokens.
        if os.path.exists(token_file):
            with open(token_file, 'rb') as token:
                creds = pickle.load(token)
        
        # If there are no (valid) credentials available, let the user log in.
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                try:
                    creds.refresh(Request())
                except Exception as e:
                    logger.error(f"Error refreshing credentials for user {user_id}: {e}")
                    return None
            else:
                return None
            
            # Save the credentials for the next run
            with open(token_file, 'wb') as token:
                pickle.dump(creds, token)
                
        return creds
    
    def save_credentials(self, user_id: str, credentials: Credentials):
        """
        Save user credentials to storage.
        
        Args:
            user_id: User identifier
            credentials: Credentials object to save
        """
        token_file = str(config.TOKENS_DIR / f"token_{user_id}.pickle")
        with open(token_file, 'wb') as token:
            pickle.dump(credentials, token)
        logger.info(f"Credentials saved for user {user_id}")
    
    def generate_pkce_verifier(self) -> str:
        """Generate PKCE code verifier"""
        # Generate a random string between 43 and 128 characters
        alphabet = string.ascii_letters + string.digits + '-._~'
        verifier_length = secrets.randbelow(86) + 43  # Random length between 43-128
        return ''.join(secrets.choice(alphabet) for _ in range(verifier_length))
    
    def generate_pkce_challenge(self, verifier: str) -> str:
        """Generate PKCE code challenge from verifier"""
        # Create SHA256 hash of the verifier
        digest = hashlib.sha256(verifier.encode()).digest()
        # Base64 encode and replace URL unsafe characters
        challenge = base64.urlsafe_b64encode(digest).rstrip(b'=').decode()
        return challenge
    
    def get_authorization_url(self, user_id: str) -> str:
        """
        Generate OAuth2 authorization URL for user.
        
        Args:
            user_id: User identifier
            
        Returns:
            Authorization URL string
        """
        # Generate PKCE verifier and challenge
        code_verifier = self.generate_pkce_verifier()
        code_challenge = self.generate_pkce_challenge(code_verifier)
        
        # Store the verifier temporarily (in a real app, use session storage)
        self._store_verifier(user_id, code_verifier)
        
        # Load client secrets
        with open(self.credentials_file, 'r') as f:
            client_config = json.load(f)
        
        # Build authorization URL manually to include PKCE parameters
        client_id = client_config['web']['client_id']
        redirect_uri = 'http://localhost:8000/auth/callback'
        
        import urllib.parse
        params = {
            'client_id': client_id,
            'redirect_uri': redirect_uri,
            'scope': ' '.join(self.SCOPES),
            'response_type': 'code',
            'state': user_id,
            'code_challenge': code_challenge,
            'code_challenge_method': 'S256',
            'access_type': 'offline',
            'prompt': 'consent'
        }
        
        auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
        
        return auth_url
    
    def _store_verifier(self, user_id: str, verifier: str):
        """Store PKCE verifier for later use in callback"""
        # In a real application, use proper session storage
        # For now, we'll store it in a simple file
        verifier_file = str(config.TOKENS_DIR / f"pkce_verifier_{user_id}.txt")
        with open(verifier_file, 'w') as f:
            f.write(verifier)
    
    def _get_verifier(self, user_id: str) -> Optional[str]:
        """Retrieve stored PKCE verifier"""
        verifier_file = str(config.TOKENS_DIR / f"pkce_verifier_{user_id}.txt")
        try:
            with open(verifier_file, 'r') as f:
                return f.read().strip()
        except FileNotFoundError:
            return None
    
    def _clear_verifier(self, user_id: str):
        """Clear stored PKCE verifier"""
        verifier_file = str(config.TOKENS_DIR / f"pkce_verifier_{user_id}.txt")
        try:
            if os.path.exists(verifier_file):
                os.remove(verifier_file)
        except Exception:
            pass
    
    def handle_oauth_callback(self, user_id: str, authorization_response: str) -> bool:
        """
        Handle OAuth2 callback and save credentials.
        
        Args:
            user_id: User identifier
            authorization_response: Full authorization response URL
            
        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info(f"Handling OAuth callback for user {user_id}")
            logger.info(f"Authorization response: {authorization_response}")
            
            # Load client secrets
            with open(self.credentials_file, 'r') as f:
                client_config = json.load(f)
            
            # Create flow for web application
            flow = Flow.from_client_config(
                client_config,
                scopes=self.SCOPES,
                redirect_uri='http://localhost:8000/auth/callback'
            )
            
            # For local development, we need to handle the insecure transport error
            # by manually setting the request object to allow HTTP
            import os
            os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'
            
            # Get the code verifier from storage
            code_verifier = self._get_verifier(user_id)
            if not code_verifier:
                logger.error("No code verifier found for user")
                return False
            
            # Fetch credentials with PKCE verifier
            logger.info("Fetching OAuth token...")
            flow.fetch_token(
                authorization_response=authorization_response,
                code_verifier=code_verifier
            )
            
            logger.info("OAuth token fetched successfully")
            
            # Save credentials
            self.save_credentials(user_id, flow.credentials)
            
            # Clean up verifier
            self._clear_verifier(user_id)
            
            logger.info(f"Credentials saved successfully for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error handling OAuth callback for user {user_id}: {e}")
            logger.error(f"Full error details: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return False
    
    def get_classroom_service(self, user_id: str) -> Optional[Any]:
        """
        Build and return Google Classroom service.
        
        Args:
            user_id: User identifier
            
        Returns:
            Google Classroom service object or None if authentication failed
        """
        creds = self.get_credentials(user_id)
        if not creds:
            return None
            
        try:
            # Silence the discovery cache warning by setting static_discovery=False
            service = build('classroom', 'v1', credentials=creds, static_discovery=False)
            return service
        except Exception as e:
            logger.error(f"Error building Classroom service for user {user_id}: {e}")
            return None
    
    async def sync_courses(self, user_id: str, force_refresh: bool = False) -> List[Dict]:
        """
        Sync user's Google Classroom courses with local caching.
        """
        db = await get_vector_db()
        
        # 1. Try to get from cache first (if not forcing refresh)
        if not force_refresh:
            cached_data = await db.get_cached_classroom_data(user_id, "all", "courses")
            if cached_data:
                logger.info(f"Returning {len(cached_data)} cached courses for user {user_id}")
                return cached_data

        # 2. If not in cache, fetch from service
        service = self.get_classroom_service(user_id)
        if not service:
            return []
        
        try:
            # Get courses
            results = service.courses().list(pageSize=100).execute()
            courses = results.get('courses', [])
            
            course_list = []
            for course in courses:
                course_info = {
                    'id': course.get('id'),
                    'name': course.get('name'),
                    'section': course.get('section'),
                    'description': course.get('descriptionHeading'),
                    'room': course.get('room'),
                    'owner_id': course.get('ownerId'),
                    'creation_time': course.get('creationTime'),
                    'enrollment_code': course.get('enrollmentCode'),
                    'course_state': course.get('courseState'),
                    'alternate_link': course.get('alternateLink')
                }
                course_list.append(course_info)
            
            # 3. Update cache
            await db.cache_classroom_data(user_id, "all", "courses", course_list)
            
            logger.info(f"Synced and cached {len(course_list)} courses for user {user_id}")
            return course_list
            
        except HttpError as e:
            logger.error(f"Error syncing courses for user {user_id}: {e}")
            return []
    
    async def sync_course_materials(self, user_id: str, course_id: str, force_refresh: bool = False) -> List[Dict]:
        """
        Sync materials for a specific course with local caching.
        """
        db = await get_vector_db()
        
        # 1. Try Cache
        if not force_refresh:
            cached_data = await db.get_cached_classroom_data(user_id, course_id, "materials")
            if cached_data:
                return cached_data

        service = self.get_classroom_service(user_id)
        if not service:
            return []
        
        try:
            # Get course materials
            results = service.courses().courseWorkMaterials().list(
                courseId=course_id,
                pageSize=100
            ).execute()
            
            materials = results.get('courseWorkMaterial', [])
            material_list = []
            
            for material in materials:
                material_info = {
                    'id': material.get('id'),
                    'course_id': course_id,
                    'title': material.get('title'),
                    'description': material.get('description'),
                    'state': material.get('state'),
                    'creation_time': material.get('creationTime'),
                    'update_time': material.get('updateTime'),
                    'materials': material.get('materials', []),
                    'alternate_link': material.get('alternateLink'),
                    'view_url': self._extract_view_url(material.get('materials', []))
                }
                material_list.append(material_info)
            
            # 2. Update Cache
            await db.cache_classroom_data(user_id, course_id, "materials", material_list)
            
            logger.info(f"Synced and cached {len(material_list)} materials for course {course_id}")
            return material_list
            
        except HttpError as e:
            logger.error(f"Error syncing materials for course {course_id}: {e}")
            return []
    
    async def sync_announcements(self, user_id: str, course_id: str) -> List[Dict]:
        """
        Sync announcements for a specific course.
        
        Args:
            user_id: User identifier
            course_id: Google Classroom course ID
            
        Returns:
            List of announcements
        """
        service = self.get_classroom_service(user_id)
        if not service:
            return []
        
        try:
            # Get announcements
            results = service.courses().announcements().list(
                courseId=course_id,
                pageSize=100
            ).execute()
            
            announcements = results.get('announcements', [])
            announcement_list = []
            
            for announcement in announcements:
                announcement_info = {
                    'id': announcement.get('id'),
                    'course_id': course_id,
                    'text': announcement.get('text'),
                    'state': announcement.get('state'),
                    'creation_time': announcement.get('creationTime'),
                    'update_time': announcement.get('updateTime'),
                    'materials': announcement.get('materials', []),
                    'alternate_link': announcement.get('alternateLink'),
                    'view_url': self._extract_view_url(announcement.get('materials', []))
                }
                announcement_list.append(announcement_info)
            
            logger.info(f"Synced {len(announcement_list)} announcements for course {course_id}")
            return announcement_list
            
        except HttpError as e:
            logger.error(f"Error syncing announcements for course {course_id}: {e}")
            return []
    
    async def sync_assignments(self, user_id: str, course_id: str, force_refresh: bool = False) -> List[Dict]:
        """
        Sync assignments for a specific course with local caching and status logic.
        """
        db = await get_vector_db()
        
        # 1. Try Cache first
        if not force_refresh:
            cached_data = await db.get_cached_classroom_data(user_id, course_id, "assignments")
            if cached_data:
                return cached_data

        service = self.get_classroom_service(user_id)
        if not service:
            return []
        
        try:
            # Get course work (assignments)
            results = service.courses().courseWork().list(
                courseId=course_id,
                pageSize=100
            ).execute()
            
            course_work = results.get('courseWork', [])
            
            # Fetch student submissions to check completion status
            submissions_results = service.courses().courseWork().studentSubmissions().list(
                courseId=course_id,
                courseWorkId='-', # All coursework
                userId='me'
            ).execute()
            submissions = {s['courseWorkId']: s for s in submissions_results.get('studentSubmissions', [])}
            
            assignment_list = []
            now = datetime.utcnow()
            
            for work in course_work:
                # 1. Determine Due Date
                due_dt = None
                due_date = work.get('dueDate')
                if due_date:
                    due_time = work.get('dueTime', {'hours': 23, 'minutes': 59})
                    due_dt = datetime(
                        due_date.get('year'), 
                        due_date.get('month'), 
                        due_date.get('day'),
                        due_time.get('hours', 0),
                        due_time.get('minutes', 0)
                    )
                
                # 2. Determine Status 
                # Values: "Completed", "Incomplete", "Approaching"
                submission = submissions.get(work['id'], {})
                sub_state = submission.get('state') # TURNED_IN, RETURNED, GRADED, NEW, RECLAIMED_BY_STUDENT
                
                is_done = sub_state in ('TURNED_IN', 'RETURNED', 'GRADED')
                
                if is_done:
                    status = "Completed"
                elif due_dt and due_dt < now:
                    status = "Incomplete"
                else:
                    status = "Approaching"

                assignment_info = {
                    'id': work.get('id'),
                    'course_id': course_id,
                    'title': work.get('title'),
                    'description': work.get('description'),
                    'state': status, # Using our calculated status
                    'original_state': work.get('state'),
                    'due_date': work.get('dueDate'),
                    'due_time': work.get('dueTime'),
                    'due_datetime': due_dt.isoformat() if due_dt else None,
                    'creation_time': work.get('creationTime'),
                    'update_time': work.get('updateTime'),
                    'materials': work.get('materials', []),
                    'work_type': work.get('workType'),
                    'max_points': work.get('maxPoints'),
                    'alternate_link': work.get('alternateLink'),
                    'view_url': self._extract_view_url(work.get('materials', []))
                }
                assignment_list.append(assignment_info)
            
            # 3. Prioritize by due date (earliest first)
            assignment_list.sort(key=lambda x: x['due_datetime'] or '9999-12-31')

            # 4. Update Cache
            await db.cache_classroom_data(user_id, course_id, "assignments", assignment_list)
            
            logger.info(f"Synced and cached {len(assignment_list)} assignments for course {course_id}")
            return assignment_list
            
        except HttpError as e:
            logger.error(f"Error syncing assignments for course {course_id}: {e}")
            return []
    
    async def process_classroom_materials(self, user_id: str, course_id: str) -> Dict:
        """
        Process all materials from a Google Classroom course.
        
        Args:
            user_id: User identifier
            course_id: Google Classroom course ID
            
        Returns:
            Processing results summary
        """
        db = await get_vector_db()
        await db.set_processing_status(user_id, course_id, "processing")
        
        total_processed = 0
        errors = []
        
        # Sync materials
        materials = await self.sync_course_materials(user_id, course_id)
        for material in materials:
            try:
                # Process each material's files
                for material_item in material.get('materials', []):
                    drive_file = material_item.get('driveFile', {})
                    if drive_file:
                        file_info = drive_file.get('driveFile', {})
                        file_id = file_info.get('id')
                        title = file_info.get('title')
                        
                        if file_id:
                            # Download and process the file
                            processed = await self._process_drive_file(
                                user_id, file_id, title, material['title']
                            )
                            if processed:
                                total_processed += 1
                            else:
                                errors.append(f"Failed to process material: {title}")
            except Exception as e:
                errors.append(f"Error processing material {material.get('title')}: {str(e)}")
        
        # Sync assignments
        assignments = await self.sync_assignments(user_id, course_id)
        for assignment in assignments:
            try:
                for material_item in assignment.get('materials', []):
                    drive_file = material_item.get('driveFile', {})
                    if drive_file:
                        file_info = drive_file.get('driveFile', {})
                        file_id = file_info.get('id')
                        title = file_info.get('title')
                        
                        if file_id:
                            processed = await self._process_drive_file(
                                user_id, file_id, title, assignment['title']
                            )
                            if processed:
                                total_processed += 1
                            else:
                                errors.append(f"Failed to process assignment: {title}")
            except Exception as e:
                errors.append(f"Error processing assignment {assignment.get('title')}: {str(e)}")
        
        # Sync announcements
        announcements = await self.sync_announcements(user_id, course_id)
        for announcement in announcements:
            try:
                for material_item in announcement.get('materials', []):
                    drive_file = material_item.get('driveFile', {})
                    if drive_file:
                        file_info = drive_file.get('driveFile', {})
                        file_id = file_info.get('id')
                        title = file_info.get('title')
                        
                        if file_id:
                            # Use the announcement text as context, truncated if it's too long
                            context = announcement.get('text', 'Announcement')[:100]
                            processed = await self._process_drive_file(
                                user_id, file_id, title, context, course_id
                            )
                            if processed:
                                total_processed += 1
                            else:
                                errors.append(f"Failed to process announcement material: {title}")
            except Exception as e:
                # Provide a fallback string if 'text' is None
                err_context = str(announcement.get('text', 'Announcement'))[:50]
                errors.append(f"Error processing announcement {err_context}: {str(e)}")
        
        result = {
            'total_processed': total_processed,
            'errors': errors,
            'materials_synced': len(materials),
            'assignments_synced': len(assignments),
            'announcements_synced': len(announcements)
        }
        
        await db.set_processing_status(user_id, course_id, "completed")
        return result

    async def process_single_material(self, user_id: str, material_id: str, material_type: str, course_id: str) -> Dict:
        """
        Process a specific Classroom material or assignment.
        material_type: 'material' or 'assignment'
        """
        service = self.get_classroom_service(user_id)
        if not service:
            return {"success": False, "error": "Authentication failed"}
            
        try:
            item = None
            if material_type == 'material':
                item = service.courses().courseWorkMaterials().get(
                    courseId=course_id, id=material_id
                ).execute()
            else:
                item = service.courses().courseWork().get(
                    courseId=course_id, id=material_id
                ).execute()
                
            if not item:
                return {"success": False, "error": "Item not found"}
                
            total_processed = 0
            materials_list = item.get('materials', [])
            
            for material_item in materials_list:
                drive_file = material_item.get('driveFile', {})
                if drive_file:
                    file_info = drive_file.get('driveFile', {})
                    file_id = file_info.get('id')
                    title = file_info.get('title')
                    
                    if file_id:
                        success = await self._process_drive_file(
                            user_id, file_id, title, item.get('title', 'Classroom Item'), course_id
                        )
                        if success:
                            total_processed += 1
                            
            return {
                "success": True, 
                "total_processed": total_processed,
                "item_title": item.get('title')
            }
            
        except Exception as e:
            logger.error(f"Error processing single material: {str(e)}")
            return {"success": False, "error": str(e)}
    
    async def _process_drive_file(self, user_id: str, file_id: str, title: str, context: str, course_id: str = None) -> bool:
        """
        Process a Google Drive file.
        
        Args:
            user_id: User identifier
            file_id: Google Drive file ID
            title: File title
            context: Context (material or assignment title)
            course_id: Course identifier
            
        Returns:
            True if processed successfully, False otherwise
        """
        try:
            # Get Drive service
            creds = self.get_credentials(user_id)
            if not creds:
                return False
                
            drive_service = build('drive', 'v3', credentials=creds)
            
            # Get file metadata
            file_metadata = drive_service.files().get(fileId=file_id).execute()
            mime_type = file_metadata.get('mimeType', '')
            
            # Check if file is a supported document type
            supported_types = [
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/plain'
            ]
            
            if mime_type not in supported_types:
                logger.info(f"Skipping unsupported file type: {mime_type}")
                return True  # Not an error, just unsupported
            
            # Download file content
            request = drive_service.files().get_media(fileId=file_id)
            file_content = request.execute()
            
            # Create a mock file-like object for the document processor
            from io import BytesIO
            from fastapi import UploadFile
            
            # Create a mock UploadFile object
            file_obj = BytesIO(file_content)
            mock_upload_file = UploadFile(
                filename=title,
                file=file_obj
            )
            
            # Process the document
            doc_proc = DocumentProcessor()
            success = await doc_proc.process_document(
                mock_upload_file, user_id, f"drive_{file_id}", title, course_id
            )
            return success
            
        except Exception as e:
            logger.error(f"Error processing drive file {file_id}: {e}")
            return False

    def _extract_view_url(self, materials: List[Dict]) -> Optional[str]:
        """
        Extract the most relevant viewing URL from a list of Google Classroom materials.
        
        Priority:
        1. Drive File alternateLink
        2. External Link URL
        3. YouTube Video alternateLink
        """
        if not materials:
            return None
            
        for material in materials:
            # Check for Drive File
            drive_file = material.get('driveFile')
            if drive_file and drive_file.get('driveFile', {}).get('alternateLink'):
                return drive_file.get('driveFile').get('alternateLink')
                
            # Check for Link
            link = material.get('link')
            if link and link.get('url'):
                return link.get('url')
                
            # Check for YouTube Video
            yt = material.get('youtubeVideo')
            if yt and yt.get('alternateLink'):
                return yt.get('alternateLink')
                
        return None
    
    def revoke_credentials(self, user_id: str) -> bool:
        """
        Revoke user's Google credentials.
        
        Args:
            user_id: User identifier
            
        Returns:
            True if successful, False otherwise
        """
        try:
            token_file = f"token_{user_id}.pickle"
            if os.path.exists(token_file):
                os.remove(token_file)
                logger.info(f"Revoked credentials for user {user_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"Error revoking credentials for user {user_id}: {e}")
            return False