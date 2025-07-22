
# importing packages
from pytubefix import YouTube 
import os
import sys
import json
import tempfile
import re
import shutil

try:
    url = sys.argv[1]
    
    # url input from user 
    yt = YouTube(url) 
    
    # Create expected filename
    base_filename = yt.title.lower().replace('- ', '').replace(' ', '_')
    # Remove special characters that might cause issues
    base_with_underscores = re.sub(r'[^\w_\/\.]', '', base_filename)
    expected_file = f"/var/www/html/downloads/{base_with_underscores}.mp3"

    # Check if file already exists
    if os.path.exists(expected_file):
        # Use relative path for original_file (use the same cleaned filename)
        relative_path = f"downloads/{base_with_underscores}.mp3"
        response = {
            "status": "success",
            "title": yt.title,
            "original_file": relative_path,
            "final_file": expected_file,
            "url": url,
            "already_downloaded": True
        }
        print(json.dumps(response))
    else:
        # extract only audio 
        video = yt.streams.filter(only_audio=True).first() 
        
        # Use downloads directory which is accessible via HTTP
        destination = '/var/www/html/downloads'
        
        # Create directory if it doesn't exist
        os.makedirs(destination, exist_ok=True)
        
        # download the file 
        out_file = video.download(output_path=destination) 
        
        # save the file with proper naming
        base, ext = os.path.splitext(out_file)
        # Keep the full destination path and convert to lowercase with underscores
        base_with_underscores = base.lower().replace('- ', '').replace(' ', '_')
        # Remove special characters (no dashes allowed)
        base_with_underscores = re.sub(r'[^\w_\/\.]', '', base_with_underscores)
        new_file = base_with_underscores + '.mp3'
        
        # Move/rename the file using shutil.move (works across filesystems)
        shutil.move(out_file, new_file)
        
        # Return JSON response
        # Use relative path for original_file (now pointing to the renamed file)
        relative_original = os.path.relpath(new_file, '/var/www/html')
        response = {
            "status": "success",
            "title": yt.title,
            "original_file": relative_original,
            "final_file": new_file,
            "url": url,
            "already_downloaded": False
        }
        print(json.dumps(response))
    
except Exception as e:
    error_response = {
        "status": "error",
        "message": str(e)
    }
    print(json.dumps(error_response))