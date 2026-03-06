from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import uuid
import os
import shutil
import asyncio
from contextlib import asynccontextmanager
from typing import Dict, Optional, Tuple, Any
from hunyuan_wrapper import HunyuanManager

# Global Processing Queue
task_queue = asyncio.Queue()

# Setup Directories
UPLOAD_DIR = "uploads"
MODELS_DIR = "models"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# State Store (In-memory for simplicity)
tasks: Dict[str, Dict] = {}

# Initialize AI Manager
ai_manager = HunyuanManager(output_dir=MODELS_DIR)

def process_generation_sync(task_id: str, image_path: str, settings: Dict):
    """Synchronous function that runs the AI models"""
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

async def queue_worker():
    """Background worker that processes one task at a time from the queue"""
    print("Background worker started. Waiting for tasks...")
    while True:
        task_id, image_path, settings = await task_queue.get()
        print(f"Worker picked up task: {task_id}")
        try:
            # Run the heavy generation in a separate thread so we don't block FastAPI
            await asyncio.to_thread(process_generation_sync, task_id, image_path, settings)
        except Exception as e:
            print(f"Error processing task {task_id} in worker: {e}")
        finally:
            task_queue.task_done()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the background worker
    worker_task = asyncio.create_task(queue_worker())
    yield
    # Cancel the worker on shutdown
    worker_task.cancel()

app = FastAPI(title="Nexa 3D Gen API", lifespan=lifespan)

# CORS Setup
# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://render-ia-two.vercel.app",
        "https://renderia.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/generate")
async def generate_model(
    image: Optional[UploadFile] = File(None),
    text_prompt: Optional[str] = Form(None),
    steps: int = Form(30),
    seed: int = Form(-1),
    guidance_scale: float = Form(7.5),
    dual_guidance_scale: float = Form(10.5),
    octree_resolution: int = Form(384),
    max_faces: int = Form(80000),
    export_format: str = Form("glb"),
    remove_bg: bool = Form(True),
    turbo_texture: bool = Form(False),
    remove_floaters: bool = Form(True),
    remove_degenerate_faces: bool = Form(True),
    use_flash_vdm: bool = Form(True),
    generate_variations: bool = Form(False)
):
    task_id = str(uuid.uuid4())
    
    # Save uploaded image
    file_extension = image.filename.split(".")[-1]
    image_path = os.path.join(UPLOAD_DIR, f"{task_id}.{file_extension}")
    
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    
    # Parse settings
    gen_settings = {
        "text_prompt": text_prompt,
        "steps": steps,
        "seed": seed if seed != -1 else None,
        "guidance_scale": guidance_scale,
        "dual_guidance_scale": dual_guidance_scale,
        "octree_resolution": octree_resolution,
        "max_faces": max_faces,
        "export_format": export_format,
        "remove_bg": remove_bg,
        "turbo_texture": turbo_texture,
        "remove_floaters": remove_floaters,
        "remove_degenerate_faces": remove_degenerate_faces,
        "use_flash_vdm": use_flash_vdm,
        "generate_variations": generate_variations
    }
    
    tasks[task_id] = {
        "status": "queued",
        "model_url": None,
        "settings": gen_settings
    }
    
    # Add to global queue
    await task_queue.put((task_id, image_path, gen_settings))
    print(f"Task {task_id} added to queue. Queue size: {task_queue.qsize()}")
    
    return {"task_id": task_id}

@app.get("/status/{task_id}")
async def get_status(task_id: str):
    if task_id not in tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Inject queue position if the task is queued
    response_data = tasks[task_id].copy()
    if response_data["status"] == "queued":
        # Rough estimate, technically not perfect because we don't peek inside the queue natively,
        # but good enough for UI feedback 
        response_data["queue_position"] = task_queue.qsize()
        
    return response_data

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
