# Guia de Treinamento e Fine-Tuning - Hunyuan3D 2.0

Este guia explica como proceder para treinar ou realizar "fine-tuning" (ajuste fino) no modelo Hunyuan3D para melhorar suas funções ou ensinar novos estilos.

> [!WARNING]
> **Aviso de Hardware**: O treinamento de modelos 3D requer GPUs extremamente potentes (NVIDIA A100 ou H100 com 80GB VRAM são recomendadas). Para usuários domésticos com GPUs menores (RTX 3090/4090), recomenda-se usar serviços de nuvem ou apenas inferência.

## 1. Obtendo o Código de Treinamento

A versão atual instalada no seu projeto (`Hunyuan3D-2`) é focada em **inferência** (geração). Os scripts de treinamento completos estão disponíveis no repositório oficial da Tencent.

Você precisa clonar o repositório completo:
```bash
git clone https://github.com/Tencent/Hunyuan3D-2
cd Hunyuan3D-2
```

## 2. Preparação do Dataset

Para treinar a IA, você precisa de um conjunto de dados contendo modelos 3D e suas visualizações.
A estrutura típica exigida é:

- **Modelos 3D**: Arquivos `.glb` ou `.obj` de alta qualidade.
- **Renderizações**: Imagens (`.png`, `.jpg`) mostrando o modelo de vários ângulos.
- **Legendas (Captions)**: Arquivos de texto descrevendo o objeto (ex: "uma cadeira de madeira antiga").

## 3. Processo de Treinamento

O treinamento é dividido em dois estágios:

### Estágio 1: Shape (Forma)
Treina o modelo `DiT` (Diffusion Transformer) para gerar a geometria correta.
Comando exemplo (baseado na documentação oficial):

```bash
python3 train_dit.py \
    --config configs/train_dit.yaml \
    --data_path /caminho/para/seu/dataset \
    --output_dir /caminho/para/salvar/modelo
```

### Estágio 2: Texture (Textura)
Treina o modelo de pintura para colorir os objetos.

```bash
python3 train_paint.py \
    --config configs/train_paint.yaml \
    ...
```

## 4. Dicas para Melhorar Resultados

1.  **Imagens Claras**: Use imagens com fundo branco ou transparente para o treino.
2.  **Variação**: Tenha centenas ou milhares de objetos se quiser generalizar.
3.  **LoRA**: Se possível, procure por scripts de treinamento LoRA (Low-Rank Adaptation), que são mais leves e rodam em GPUs de consumo (24GB VRAM).

## 5. Integrando ao Projeto

Após treinar, você terá novos arquivos de pesos (`.pt` ou `.safetensors`).
Para usar no seu projeto atual:
1.  Copie os novos pesos para a pasta `Hunyuan3D-2/weights/`.
2.  O sistema carregará automaticamente o novo modelo se você substituir os arquivos originais ou apontar o caminho correto no `hunyuan_wrapper.py`.
