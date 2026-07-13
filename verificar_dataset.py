
"""
Script para verificar la estructura y calidad del dataset segmentado
"""

import os
from PIL import Image

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, 'dataset', 'segmented')

def verificar_dataset():
    print("="*60)
    print("VERIFICACIÓN DEL DATASET SEGMENTADO")
    print("="*60)
    
    if not os.path.exists(DATASET_DIR):
        print(f"ERROR: No se encontró el directorio {DATASET_DIR}")
        print("Por favor, asegúrate de que el dataset esté en la carpeta correcta.")
        return False
    
    # Listar subcarpetas (clases)
    classes = [d for d in os.listdir(DATASET_DIR) if os.path.isdir(os.path.join(DATASET_DIR, d))]
    
    if len(classes) == 0:
        print("ERROR: No se encontraron subcarpetas con clases en el dataset")
        return False
    
    print(f"\nClases encontradas: {len(classes)}")
    total_imagenes = 0
    errores = []
    
    for cls in sorted(classes):
        cls_dir = os.path.join(DATASET_DIR, cls)
        imagenes = [f for f in os.listdir(cls_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        count = len(imagenes)
        total_imagenes += count
        
        print(f"\n  {cls}:")
        print(f"    Imágenes: {count}")
        
        # Verificar algunas imágenes al azar
        for img_name in imagenes[:5]:  # Verificar las primeras 5 de cada clase
            img_path = os.path.join(cls_dir, img_name)
            try:
                with Image.open(img_path) as img:
                    # Verificar que se pueda abrir y tenga dimensiones válidas
                    width, height = img.size
                    if width < 100 or height < 100:
                        errores.append(f"Imagen pequeña: {img_path} ({width}x{height})")
            except Exception as e:
                errores.append(f"Error al abrir {img_path}: {str(e)}")
    
    print("\n" + "="*60)
    print("RESUMEN")
    print("="*60)
    print(f"Total de clases: {len(classes)}")
    print(f"Total de imágenes: {total_imagenes}")
    
    if len(errores) > 0:
        print(f"\nADVERTENCIAS: {len(errores)} problemas encontrados")
        for err in errores[:10]:  # Mostrar solo los primeros 10
            print(f"  - {err}")
        if len(errores) > 10:
            print(f"  ... y {len(errores)-10} más")
    else:
        print("\n✅ Dataset verificado exitosamente!")
        print("Estructura correcta y todas las imágenes parecen válidas.")
    
    return True

if __name__ == "__main__":
    verificar_dataset()

