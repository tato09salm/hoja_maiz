import os
import time
import pickle
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import classification_report, confusion_matrix
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as mobilenet_pre
from tensorflow.keras.applications.resnet50 import preprocess_input as resnet_pre
from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_pre

# ------------------------
# 📂 Rutas locales
# ------------------------
BASE_DIR = r'c:\Users\LENOVO\Downloads\17. sistema\hoja_maiz'
DATA_DIR = os.path.join(BASE_DIR, 'dataset_dividido')
val_dir = os.path.join(DATA_DIR, 'val')
REPORTS_DIR = os.path.join(BASE_DIR, 'Reports')
MODELS_DIR = os.path.join(BASE_DIR, 'Models')
os.makedirs(REPORTS_DIR, exist_ok=True)

# ------------------------
# 📋 Configuración
# ------------------------
img_size = 224
batch_size = 8

# Cargar nombres de clases
temp_gen = ImageDataGenerator(preprocessing_function=mobilenet_pre)
temp_data = temp_gen.flow_from_directory(val_dir, target_size=(img_size, img_size))
class_names = list(temp_data.class_indices.keys())
num_classes = len(class_names)
print(f"Clases detectadas: {class_names}")

# ------------------------
# 📦 Diccionario de modelos
# ------------------------
models_info = [
    ("MobileNetV2", mobilenet_pre),
    ("ResNet50", resnet_pre),
    ("EfficientNetB0", efficientnet_pre)
]

all_results = {}

# ------------------------
# 🔍 Evaluar cada modelo
# ------------------------
for model_name, preprocess_fn in models_info:
    print(f"\n{'='*60}")
    print(f"Evaluando {model_name}")
    print(f"{'='*60}")
    
    # Cargar modelo
    model_path = os.path.join(MODELS_DIR, f"{model_name}.h5")
    model = load_model(model_path)
    print(f"✅ Modelo {model_name} cargado.")
    
    # Preparar generador de datos
    val_gen = ImageDataGenerator(preprocessing_function=preprocess_fn)
    val_data = val_gen.flow_from_directory(
        val_dir, 
        target_size=(img_size, img_size), 
        batch_size=batch_size, 
        class_mode='categorical',
        shuffle=False
    )
    
    # Evaluar
    start_time = time.time()
    loss, accuracy = model.evaluate(val_data, verbose=1)
    eval_time = time.time() - start_time
    
    # Obtener predicciones
    val_data.reset()
    preds = model.predict(val_data, verbose=1)
    y_pred = np.argmax(preds, axis=1)
    y_true = val_data.classes
    
    # Generar métricas
    cr = classification_report(y_true, y_pred, target_names=class_names, output_dict=True)
    cm = confusion_matrix(y_true, y_pred)
    
    # Guardar resultados
    all_results[model_name] = {
        'duration': eval_time,
        'classification_report': cr,
        'confusion_matrix': cm,
        'class_names': class_names,
        'y_true': y_true,
        'y_pred': y_pred,
        'accuracy': accuracy,
        'loss': loss
    }
    
    # Guardar reporte de texto
    with open(os.path.join(REPORTS_DIR, f"{model_name}_reporte.txt"), "w", encoding='utf-8') as f:
        f.write(f"REPORTE DE EVALUACIÓN: {model_name}\n")
        f.write("="*60 + "\n\n")
        f.write(f"Tiempo de evaluación: {eval_time:.2f} segundos\n")
        f.write(f"Precisión en validación: {accuracy:.4f}\n")
        f.write(f"Pérdida en validación: {loss:.4f}\n\n")
        f.write("Reporte de clasificación:\n")
        f.write(classification_report(y_true, y_pred, target_names=class_names))
    
    # Guardar matriz de confusión
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt="d", xticklabels=class_names, yticklabels=class_names, cmap="Blues")
    plt.title(f"Matriz de Confusión - {model_name}", fontsize=14)
    plt.ylabel("Etiqueta Real", fontsize=12)
    plt.xlabel("Etiqueta Predicha", fontsize=12)
    plt.tight_layout()
    plt.savefig(os.path.join(REPORTS_DIR, f"{model_name}_matriz_confusion.png"), dpi=300)
    plt.close()
    print(f"✅ Matriz de confusión guardada para {model_name}")

# Guardar todos los resultados
with open(os.path.join(REPORTS_DIR, 'resultados_entrenamiento.pkl'), 'wb') as f:
    pickle.dump(all_results, f)

print("\n" + "="*60)
print("✅ Evaluación de todos los modelos completada!")
print("="*60)
