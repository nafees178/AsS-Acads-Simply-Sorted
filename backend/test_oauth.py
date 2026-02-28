#!/usr/bin/env python3
"""
Test script for Google Classroom OAuth2 callback
Run this script to test the OAuth callback manually
"""

import sys
import os
import logging
from google_classroom_service import GoogleClassroomService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_oauth_callback():
    """Test the OAuth callback with the exact URL from Google"""
    
    # Your test user ID
    user_id = "1"
    
    # The exact callback URL from Google (copy from your browser)
    callback_url = "http://localhost:8000/auth/callback?state=1&iss=https://accounts.google.com&code=4/0AfrIepA2FQ34NQnRQL3dLZFrf63aKFTQt_UrrOkH05TGCb6DnBNMW7bYwiMaHLnM0IAI7Q&scope=https://www.googleapis.com/auth/drive.readonly%20https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly%20https://www.googleapis.com/auth/classroom.announcements.readonly%20https://www.googleapis.com/auth/classroom.student-submissions.me.readonly%20https://www.googleapis.com/auth/classroom.courses.readonly"
    
    print(f"Testing OAuth callback for user: {user_id}")
    print(f"Callback URL: {callback_url}")
    print("-" * 50)
    
    # Initialize the service
    classroom_service = GoogleClassroomService()
    
    # Test the callback
    try:
        success = classroom_service.handle_oauth_callback(user_id, callback_url)
        
        if success:
            print("✅ OAuth callback successful!")
            print("Credentials have been saved.")
            
            # Test if we can get the credentials
            creds = classroom_service.get_credentials(user_id)
            if creds:
                print("✅ Credentials loaded successfully")
                print(f"Token valid: {creds.valid}")
                print(f"Token expired: {creds.expired}")
            else:
                print("❌ Could not load credentials")
                
        else:
            print("❌ OAuth callback failed")
            
    except Exception as e:
        print(f"❌ Error during OAuth callback: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_oauth_callback()