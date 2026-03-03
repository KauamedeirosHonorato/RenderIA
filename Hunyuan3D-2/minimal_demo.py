import argparse
import os
from PIL import Image
from hy3dgen.rembg import BackgroundRemover
from hy3dgen.shapegen import Hunyuan3DDiTFlowMatchingPipeline

# Tentativa segura de importar o módulo de textura
try:
    from hy3dgen.texgen import Hunyuan3DPaintPipeline
    TEXGEN_AVAILABLE = True
except ImportError:
    print("Aviso: Módulo de textura não encontrado. Modo geometria apenas.")
    TEXGEN_AVAILABLE = False

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--image_prompt", type=str, required=True)
    parser.add_argument("--save_folder", type=str, required=True)
    parser.add_argument("--device", type=str, default="cpu")
    args = parser.parse_args()

    os.makedirs(args.save_folder, exist_ok=True)
    
    # Lógica de caminhos
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, 'weights', 'hunyuan3d-2-0')
    
    if not os.path.exists(model_path):
        print(f"Warning: Local weights not found at {model_path}. Trying 'tencent/Hunyuan3D-2' from Hub...")
        model_path = 'tencent/Hunyuan3D-2'
    else:
        print(f"Loading local weights from: {model_path}")

    print(f"Initializing ShapeGen on {args.device}...")
    
    # 1. Carrega o Escultor (ShapeGen) - Esse funciona na CPU!
    try:
        pipeline_shapegen = Hunyuan3DDiTFlowMatchingPipeline.from_pretrained(model_path, device=args.device)
    except Exception as e:
        print(f"Erro fatal ao carregar ShapeGen: {e}")
        return

    # 2. Tenta carregar o Pintor (TexGen) - Esse costuma falhar na AMD
    pipeline_texgen = None
    if TEXGEN_AVAILABLE:
        print("Initializing TexGen (Painting)...")
        try:
            # Carrega sem device primeiro
            pipeline_texgen = Hunyuan3DPaintPipeline.from_pretrained(model_path)
            pipeline_texgen.to(args.device)
        except Exception as e:
            print(f"⚠️ AVISO: O módulo de Pintura falhou (provavelmente falta NVIDIA).")
            print(f"Erro: {e}")
            print(">>> O sistema continuará e gerará apenas a geometria 3D (Branca).")
            pipeline_texgen = None

    print(f"Processing image: {args.image_prompt}")
    image = Image.open(args.image_prompt).convert("RGBA")
    
    # Remove background
    print("Removing background...")
    try:
        rembg = BackgroundRemover()
        image = rembg(image)
    except Exception as e:
        print(f"Aviso: Falha ao remover fundo ({e}). Usando imagem original.")

    print("Generating mesh (ShapeGen)...")
    # Gera a geometria
    mesh = pipeline_shapegen(image=image)[0]
    
    # Se o pintor estiver vivo, pinta. Se não, pula.
    if pipeline_texgen is not None:
        print("Generating texture (TexGen)...")
        try:
            mesh = pipeline_texgen(mesh, image=image)
        except Exception as e:
            print(f"Erro durante a pintura: {e}. Salvando apenas malha.")
    else:
        print("Skipping texture generation (Geometry Only Mode).")
    
    output_filename = "mesh.glb"
    output_path = os.path.join(args.save_folder, output_filename)
    
    print(f"Exporting to {output_path}...")
    mesh.export(output_path)
    print("Generation complete!")

if __name__ == "__main__":
    main()