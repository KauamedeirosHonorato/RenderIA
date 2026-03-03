"""
Nexa 3D Gen — Model Downloader
Downloads Hunyuan3D 2.0 weights from Hugging Face Hub.

Usage:
    pip install huggingface_hub
    python download_models.py
"""

import os
import sys

try:
    from huggingface_hub import snapshot_download
except ImportError:
    print("❌ 'huggingface_hub' não instalado.")
    print("   Execute: pip install huggingface_hub")
    sys.exit(1)

MODEL_ID = "Tencent/Hunyuan3D-2"
LOCAL_DIR = os.path.join(os.path.dirname(__file__), "Hunyuan3D-2", "weights")

def main():
    print("=" * 50)
    print("🧊 Nexa 3D Gen — Download de Modelos")
    print("=" * 50)
    print(f"📦 Modelo: {MODEL_ID}")
    print(f"📁 Destino: {os.path.abspath(LOCAL_DIR)}")
    print()

    os.makedirs(LOCAL_DIR, exist_ok=True)

    print("⏳ Baixando pesos do Hugging Face Hub...")
    print("   (Isso pode levar vários minutos dependendo da conexão)\n")

    try:
        snapshot_download(
            repo_id=MODEL_ID,
            local_dir=LOCAL_DIR,
            local_dir_use_symlinks=False,
        )
        print("\n✅ Modelos baixados com sucesso!")
        print(f"   Local: {os.path.abspath(LOCAL_DIR)}")
    except Exception as e:
        print(f"\n❌ Erro ao baixar modelos: {e}")
        print("\nDicas:")
        print("  • Verifique sua conexão com a internet")
        print("  • Certifique-se de ter espaço em disco (~15GB)")
        print("  • Se o modelo for privado, faça login: huggingface-cli login")
        sys.exit(1)

if __name__ == "__main__":
    main()
