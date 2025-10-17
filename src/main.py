from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
import uuid
from datetime import datetime
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import ffmpeg
import whisper
from tqdm import tqdm
import uvicorn



app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://0.0.0.0:8000", 
        "http://localhost:3000",
        "http://127.0.0.1:5500",  
        "http://localhost:5500"],    
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def load_whisper_model(): #loading model at startup
    global WHISPER_MODEL
    print("Loading Whisper model... This may take a moment.")
    WHISPER_MODEL = whisper.load_model("base")
    print("Whisper model loaded successfully!")



LANGUAGE_CODES = {
    "english": "en", "spanish": "es", "french": "fr", "german": "de",
    "italian": "it", "portuguese": "pt", "russian": "ru",
    "japanese": "ja", "chinese": "zh", "korean": "ko",
    "arabic": "ar", "hindi": "hi"
}


TEMP_DIR = "./subtitles_temp"
WHISPER_MODEL = None
os.makedirs(TEMP_DIR, exist_ok=True)

JOBS ={}


ALLOWED_EXTENSIONS = {'.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.webm'}
MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB in bytes

def validate_file(file: UploadFile) -> tuple[bool, str]: #validation for file uploaded
    # check file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return False, f"Invalid file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
    
    # check file size 
    file.file.seek(0, 2)  
    file_size = file.file.tell()
    file.file.seek(0)  # reset to beginning
    
    if file_size > MAX_FILE_SIZE:
        return False, f"File too large. Max size: {MAX_FILE_SIZE / (1024*1024):.0f}MB"
    
    if file_size == 0:
        return False, "File is empty"
    
    return True, "Valid"

def extract_audio(video_path, temp_dir):
    """Extracts audio from a video."""
    audio_path = os.path.join(temp_dir, "audio.wav")
    ffmpeg.input(video_path).output(audio_path, acodec='pcm_s16le', ar=16000, ac=1).run(overwrite_output=True)
    return audio_path




def transcribe_to_languages(audio_path, languages, output_dir):
    """Transcribes audio into multiple languages."""
    global WHISPER_MODEL
    

    if WHISPER_MODEL is None:
        raise RuntimeError("model not loaded. server may not be started properly.")

    results = {}

    for lang in tqdm(languages, desc="Transcribing"):
        result = WHISPER_MODEL.transcribe(audio_path, language=lang, task="transcribe")
        results[lang] = result


    return results




def format_time(seconds):
    """Formats time to SRT format."""
    hours, minutes, seconds = int(seconds // 3600), int((seconds % 3600) // 60), int(seconds % 60)
    milliseconds = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{milliseconds:03d}"




def write_srt_files(results, output_dir):
    """Writes SRT subtitle files."""
    for lang, result in results.items():
        output_path = os.path.join(output_dir, f"subtitles_{lang}.srt")
        with open(output_path, "w", encoding="utf-8") as f:
            for i, segment in enumerate(result["segments"], 1):
                start_time = format_time(segment["start"])
                end_time = format_time(segment["end"])
                f.write(f"{i}\n{start_time} --> {end_time}\n{segment['text'].strip()}\n\n")

def sanitize_filename(filename: str) -> str: #sanitisation to prevent path traversal attacks
    # remove any directory path separators
    filename = os.path.basename(filename)
    
    # remove any non-alphanumeric characters except dots, hyphens, and underscores
    import re
    filename = re.sub(r'[^\w\-.]', '_', filename)
    
    # Ensure it ends with .srt
    if not filename.endswith('.srt'):
        raise HTTPException(status_code=400, detail="Invalid file format")
    
    return filename

def process_video_background(job_id: str, video_path: str, languages_list: list, temp_dir: str):
    """Background task to process video and generate subtitles."""
    audio_path = None
    
    try:
        # update job status
        JOBS[job_id]["status"] = "extracting_audio"
        
        # extract audio
        audio_path = extract_audio(video_path, temp_dir)
        
        # update job status
        JOBS[job_id]["status"] = "transcribing"
        
        # transcribe
        results = transcribe_to_languages(audio_path, languages_list, temp_dir)
        
        # update job status
        JOBS[job_id]["status"] = "writing_subtitles"
        
        # write SRT files
        write_srt_files(results, temp_dir)
        
        # update job with results
        subtitle_files = [f"subtitles_{lang}.srt" for lang in languages_list]
        JOBS[job_id]["status"] = "completed"
        JOBS[job_id]["subtitles"] = [
            {"filename": filename, "download_url": f"/download/{filename}"} 
            for filename in subtitle_files
        ]
        JOBS[job_id]["completed_at"] = datetime.now().isoformat()
        print(f"✓ Job {job_id} completed with subtitles: {JOBS[job_id]['subtitles']}")
        
    except Exception as e:
        JOBS[job_id]["status"] = "failed"
        JOBS[job_id]["error"] = str(e)
        print(f"Error processing job {job_id}: {e}")
    
    finally:
        # cleanup temp files
        cleanup_temp_files(video_path, audio_path if audio_path else "")

def cleanup_temp_files(video_path: str, audio_path: str):
    """Cleans up temporary video and audio files after processing."""
    try:
        if os.path.exists(video_path):
            os.remove(video_path)
            print(f"✓ Deleted video: {video_path}")
        else:
            print(f"Video file not found: {video_path}")
    except Exception as e:
        print(f"Error deleting video file: {e}")
        
    
    try:
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
            print(f"✓ Deleted audio: {audio_path}")
        else:
            print(f"Audio file not found or empty: {audio_path}")
    except Exception as e:
        print(f"Error deleting audio file: {e}")
    
    # List remaining files in temp directory
    remaining = os.listdir(TEMP_DIR)
    print(f"Files remaining in {TEMP_DIR}: {remaining}")
    print(f"=== CLEANUP DONE ===\n")


@app.post("/upload/")
async def upload_video(background_tasks: BackgroundTasks, file: UploadFile = File(...), languages: str = Form(...)):

    is_valid, message = validate_file(file)
    if not is_valid:
        raise HTTPException(status_code=400, detail=message)
    
    # generate unique job ID
    job_id = str(uuid.uuid4())
    
    languages_list = [LANGUAGE_CODES.get(lang.strip().lower(), lang.strip()) for lang in languages.split(",")]
    temp_dir = TEMP_DIR

    # create unique filename to avoid collisions
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{job_id}{file_extension}"
    video_path = os.path.join(temp_dir, unique_filename)  # FIXED: use unique_filename

    # save uploaded file
    with open(video_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # init job tracking
    JOBS[job_id] = {
        "status": "queued",
        "created_at": datetime.now().isoformat(),
        "languages": languages_list,
        "subtitles": [],
        "error": None
    }

    #add background task
    background_tasks.add_task(process_video_background, job_id, video_path, languages_list, temp_dir)
    
    # return jobID
    return JSONResponse({
        "message": "Video uploaded successfully. Processing started.",
        "job_id": job_id,
        "status_url": f"/status/{job_id}"
    })

@app.get("/download/{filename}")
async def download_srt(filename: str):
    """Download the generated subtitle file."""

    try:
        safe_filename = sanitize_filename(filename)
    except HTTPException as e:
        raise e
    

    file_path = os.path.join(TEMP_DIR, safe_filename)

    # additional security check: ensure the resolved path is still within TEMP_DIR
    real_path = os.path.realpath(file_path)
    real_temp_dir = os.path.realpath(TEMP_DIR)

    if not real_path.startswith(real_temp_dir):
        raise HTTPException(status_code=403, detail="Access denied") 
                            
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="text/srt", filename=safe_filename)
    else:
        raise HTTPException(status_code=404, detail="File not found")




@app.get("/subtitles/")
async def list_subtitles():
    """Lists all available subtitle files."""
    files = os.listdir(TEMP_DIR)
    subtitles = [file for file in files if file.endswith(".srt")]
    return {"subtitles": [{"filename": f, "download_url": f"/download/{f}"} for f in subtitles]}




@app.delete("/cleanup/")
async def cleanup_files():
    """Deletes all subtitle files."""
    shutil.rmtree(TEMP_DIR, ignore_errors=True)
    os.makedirs(TEMP_DIR, exist_ok=True)
    return {"message": "Temporary subtitle files deleted"}

@app.get("/status/{job_id}")
async def get_job_status(job_id: str):
    """Get the status of a processing job."""
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return JSONResponse(JOBS[job_id])


if __name__ == "__main__":
    uvicorn.run("main:app" , host = "localhost" , port = 8000 , reload = True)