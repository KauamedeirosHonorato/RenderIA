import os
import sys
import torch
import gc
from typing import Optional, Dict, Any

# --- CONFIGURAÇÃO ---
HUNYUAN_REPO_PATH = r"C:\Users\JayChouDev\OneDrive\Desktop\3DmD\Hunyuan3D-2"

# Adicionar o repo ao path do Python para imports
if HUNYUAN_REPO_PATH not in sys.path:
    sys.path.append(HUNYUAN_REPO_PATH)

try:
    from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline
    from hy3dgen.texgen import Hunyuan3DPaintPipeline
except ImportError:
    print("CRITICAL ERROR: Could not import 'hy3dgen'. Make sure all dependencies are installed.")

class HunyuanManager:
    _instance = None
    
    def __new__(cls, *args, **kwargs):
        if not cls._instance:
            cls._instance = super(HunyuanManager, cls).__new__(cls)
            cls._instance.initialized = False
        return cls._instance

    def __init__(self, output_dir="models", device="cuda" if torch.cuda.is_available() else "cpu"):
        if self.initialized:
            return
            
        self.output_dir = output_dir
        self.device = device
        self.shape_pipeline = None
        self.paint_pipeline = None
        self.models_loaded = False
        
        # Paths
        self.model_path = os.path.join(HUNYUAN_REPO_PATH, "weights", "hunyuan3d-2-0")
        
        os.makedirs(self.output_dir, exist_ok=True)
        self.initialized = True
        print(f"[HunyuanManager] Initialized. Device: {self.device}")

    def load_models(self):
        if self.models_loaded:
            return

        print("[HunyuanManager] Loading models into memory... (This may take a while)")
        try:
            # Load Shape Pipeline
            self.shape_pipeline = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained(
                self.model_path,
                subfolder="hunyuan3d-dit-v2-0",
            )
            self.shape_pipeline.to(self.device)
            
            # Load Paint Pipeline
            try:
                self.paint_pipeline = Hunyuan3DPaintPipeline.from_pretrained(
                    self.model_path,
                    subfolder="hunyuan3d-paint-v2-0", 
                )
                self.paint_pipeline.to(self.device)
            except Exception as e:
                print(f"[HunyuanManager] WARNING: Failed to load Paint Pipeline (Texture). Missing dependencies? {e}")
                self.paint_pipeline = None
            
            self.models_loaded = True
            print("[HunyuanManager] Models loaded successfully!")
        except Exception as e:
            print(f"[HunyuanManager] Failed to load models: {e}")
            raise e

    def unload_models(self):
        """Free up VRAM"""
        self.shape_pipeline = None
        self.paint_pipeline = None
        self.models_loaded = False
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        print("[HunyuanManager] Models unloaded.")

    def generate(self, image_path: str, task_id: str, settings: Dict[str, Any] = None) -> Optional[str]:
        if not self.models_loaded:
            self.load_models()

        if settings is None:
            settings = {}
            
        steps = settings.get("steps", 30) # Default changed to 30 for speed/quality balance
        guidance_scale = settings.get("guidance_scale", 7.5)
        seed = settings.get("seed", None)
        
        task_folder = os.path.join(self.output_dir, task_id)
        os.makedirs(task_folder, exist_ok=True)
        
        try:
            print(f"[{task_id}] Generating shape... Steps={steps}")
            
            # 1. Generate Shape
            # Note: The actual API of hy3dgen might vary slightly, adapting based on usage in minimal_demo.py
            # If seed provided, set it
            generator = None
            if seed is not None:
                generator = torch.Generator(device=self.device).manual_seed(int(seed))
                
            mesh = self.shape_pipeline(
                image=image_path,
                num_inference_steps=steps,
                guidance_scale=guidance_scale,
                generator=generator
            )[0]
            
            # 2. Generate Texture
            if self.paint_pipeline:
                 print(f"[{task_id}] Generating texture...")
                 try:
                     mesh = self.paint_pipeline(
                         mesh, 
                         image=image_path
                     )
                 except Exception as e:
                     print(f"[{task_id}] Texture generation failed (skipping): {e}")
            else:
                 print(f"[{task_id}] Skipping texture (Pipeline not loaded).")
            
            # 3. Export
            filename = f"{task_id}.glb"
            output_path = os.path.join(task_folder, filename)
            
            # Trimesh export
            mesh.export(output_path, file_type='glb')
            
            print(f"[{task_id}] Success! Saved to {output_path}")
            return f"{task_id}/{filename}".replace("\\", "/")
            
        except Exception as e:
            print(f"[{task_id}] Error during generation: {e}")
            import traceback
            traceback.print_exc()
            return None
