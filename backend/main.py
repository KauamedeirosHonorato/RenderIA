from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import uuid
import os
import shutil
from typing import Dict, Optional
from hunyuan_wrapper import HunyuanManager

app = FastAPI(title="Nexa 3D Gen API")

# CORS Setup
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup
UPLOAD_DIR = "uploads"
MODELS_DIR = "models"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# State Store (In-memory for simplicity)
tasks: Dict[str, Dict] = {}

# Initialize AI Manager
# Note: Models are lazy loaded on first request unless explicitly loaded
ai_manager = HunyuanManager(output_dir=MODELS_DIR)

def process_generation(task_id: str, image_path: str, settings: Dict):
    try:
        tasks[task_id]["status"] = "processing"
        
        # Call AI Wrapper
        model_filename = ai_manager.generate(image_path, task_id, settings)
        
        if model_filename:
            tasks[task_id]["status"] = "completed"
            tasks[task_id]["model_url"] = f"/models/{model_filename}"
        else:
            tasks[task_id]["status"] = "failed"
            print(f"Task {task_id} failed: Generation returned None")
    except Exception as e:
        print(f"Task {task_id} failed: {e}")
        tasks[task_id]["status"] = "failed"

@app.post("/generate")
async def generate_model(
    background_tasks: BackgroundTasks, 
    image: UploadFile = File(...),
    steps: int = Form(30),
    seed: int = Form(-1),
    guidance_scale: float = Form(7.5)
):
    task_id = str(uuid.uuid4())
    
    # Save uploaded image
    file_extension = image.filename.split(".")[-1]
    image_path = os.path.join(UPLOAD_DIR, f"{task_id}.{file_extension}")
    
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    
    # Initialize task state
    tasks[task_id] = {
        "status": "pending",
        "model_url": None,
        "settings": {
            "steps": steps,
            "seed": seed,
            "guidance_scale": guidance_scale
        }
    }
    
    # Parse settings
    gen_settings = {
        "steps": steps,
        "seed": seed if seed != -1 else None,
        "guidance_scale": guidance_scale
    }
    
    # Start background processing
    background_tasks.add_task(process_generation, task_id, image_path, gen_settings)
    
    return {"task_id": task_id}

@app.get("/status/{task_id}")
async def get_status(task_id: str):
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return tasks[task_id]

@app.post("/system/load_models")
async def load_models_endpoint():
    try:
        ai_manager.load_models()
        return {"status": "success", "message": "Models loaded into memory"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/system/unload_models")
async def unload_models_endpoint():
    ai_manager.unload_models()
    return {"status": "success", "message": "Models unloaded from memory"}

# Serve Static Models
app.mount("/models", StaticFiles(directory=MODELS_DIR), name="models")
