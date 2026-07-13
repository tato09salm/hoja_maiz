
import os
import shutil
from sklearn.model_selection import train_test_split

# Rutas
BASE_DIR = r'c:\Users\LENOVO\Downloads\17. sistema\hoja_maiz'
DATASET_SOURCE = os.path.join(BASE_DIR, 'dataset', 'color')
DATA_TARGET = os.path.join(BASE_DIR, 'Data')

# Clases de maíz que necesitamos
MAIZE_CLASSES = [
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
    'Corn_(maize)___Common_rust_',
    'Corn_(maize)___healthy',
    'Corn_(maize)___Northern_Leaf_Blight'
]

# Mapeo de nombres de carpetas a nombres para la app (como en el código original)
CLASS_MAP = {
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot': 'Corn_(maize)___Gray_Leaf_Spot',
    'Corn_(maize)___Common_rust_': 'Corn_(maize)___Common_rust_',
    'Corn_(maize)___healthy': 'Corn_(maize)___healthy',
    'Corn_(maize)___Northern_Leaf_Blight': 'Corn_(maize)___Northern_Leaf_Blight'
}

def prepare_dataset():
    # Crear directorios target
    train_dir = os.path.join(DATA_TARGET, 'train')
    val_dir = os.path.join(DATA_TARGET, 'val')
    
    os.makedirs(train_dir, exist_ok=True)
    os.makedirs(val_dir, exist_ok=True)
    
    for source_class in MAIZE_CLASSES:
        target_class = CLASS_MAP[source_class]
        source_path = os.path.join(DATASET_SOURCE, source_class)
        train_target = os.path.join(train_dir, target_class)
        val_target = os.path.join(val_dir, target_class)
        
        os.makedirs(train_target, exist_ok=True)
        os.makedirs(val_target, exist_ok=True)
        
        # Obtener todas las imágenes
        images = [f for f in os.listdir(source_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        
        # Dividir en train (80%) y val (20%)
        train_images, val_images = train_test_split(images, test_size=0.2, random_state=42)
        
        # Copiar archivos
        print(f"Clase {target_class}: {len(train_images)} train, {len(val_images)} val")
        
        for img in train_images:
            shutil.copy2(
                os.path.join(source_path, img),
                os.path.join(train_target, img)
            )
        
        for img in val_images:
            shutil.copy2(
                os.path.join(source_path, img),
                os.path.join(val_target, img)
            )
    
    print("\n✅ Dataset organizado correctamente!")
    print(f"   - Carpeta train: {train_dir}")
    print(f"   - Carpeta val: {val_dir}")

if __name__ == "__main__":
    prepare_dataset()
