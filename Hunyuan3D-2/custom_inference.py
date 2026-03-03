import argparse
import os
from PIL import Image
from hy3dgen.rembg import BackgroundRemover
from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline
from hy3dgen.texgen import Hunyuan3DPaintPipeline

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--image_prompt", type=str, required=True)
    parser.add_argument("--save_folder", type=str, required=True)
    parser.add_argument("--device", type=str, default="cpu")
    args = parser.parse_args()

    os.makedirs(args.save_folder, exist_ok=True)
    
    # Path to manually downloaded weights
    # Assuming valid structure: Hunyuan3D-2/weights/hunyuan3d-2-0
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, 'weights', 'hunyuan3d-2-0')
    
    # If manual weights missing, fallback to HuggingFace path (might try to download)
    if not os.path.exists(model_path):
        print(f"Warning: Local weights not found at {model_path}. Trying 'tencent/Hunyuan3D-2' from Hub...")
        model_path = 'tencent/Hunyuan3D-2'
    else:
        print(f"Loading local weights from: {model_path}")

    print(f"Initializing pipeline on {args.device}...")
    try:
        pipeline_shapegen = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained(model_path, device=args.device)
        pipeline_texgen = Hunyuan3DPaintPipeline.from_pretrained(model_path, device=args.device)
    except Exception as e:
        print(f"Error loading model: {e}")
        print("Ensure 'weights/hunyuan3d-2-0' contains valid .safetensors files.")
        return

    print(f"Processing image: {args.image_prompt}")
    image = Image.open(args.image_prompt).convert("RGBA")
    
    # Remove background
    print("Removing background...")
    rembg = BackgroundRemover()
    image = rembg(image)

    print("Generating mesh (ShapeGen)...")
    mesh = pipeline_shapegen(image=image)[0]
    
    print("Generating texture (TexGen)...")
    mesh = pipeline_texgen(mesh, image=image)
    
    output_filename = "mesh.glb"
    output_path = os.path.join(args.save_folder, output_filename)
    
    print(f"Exporting to {output_path}...")
    mesh.export(output_path)
    print("Generation complete!")

if __name__ == "__main__":
    main()
