import os
import numpy as np
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as mobilenet_pre
from tensorflow.keras.applications.resnet50 import preprocess_input as resnet_pre
from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_pre
from sklearn.metrics import classification_report

# Rutas
BASE_DIR = r'c:\Users\LENOVO\Downloads\17. sistema\hoja_maiz'
DATA_DIR = os.path.join(BASE_DIR, 'dataset_dividido')
val_dir = os.path.join(DATA_DIR, 'val')
MODELS_DIR = os.path.join(BASE_DIR, 'Models')

# Configuración
img_size = 224
batch_size = 8

# Cargar nombres de clases
temp_gen = ImageDataGenerator(preprocessing_function=mobilenet_pre)
temp_data = temp_gen.flow_from_directory(val_dir, target_size=(img_size, img_size))
class_names = list(temp_data.class_indices.keys())

# Modelos a evaluar
models = [
    ("MobileNetV2", mobilenet_pre),
    ("ResNet50", resnet_pre),
    ("EfficientNetB0", efficientnet_pre)
]

print("\n" + "="*80)
print("RESUMEN DE COMPARACIÓN DE MODELOS")
print("="*80)

results = {}

for model_name, preprocess_fn in models:
    print(f"\n--- {model_name} ---")
    
    # Cargar modelo
    model = load_model(os.path.join(MODELS_DIR, f"{model_name}.h5"))
    
    # Preparar datos
    val_gen = ImageDataGenerator(preprocessing_function=preprocess_fn)
    val_data = val_gen.flow_from_directory(
        val_dir,
        target_size=(img_size, img_size),
        batch_size=batch_size,
        class_mode='categorical',
        shuffle=False
    )
    
    # Evaluar
    loss, accuracy = model.evaluate(val_data, verbose=0)
    
    # Predicciones
    y_pred = np.argmax(model.predict(val_data, verbose=0), axis=1)
    y_true = val_data.classes
    
    # Reporte
    cr = classification_report(y_true, y_pred, target_names=class_names, output_dict=True)
    
    # Almacenar resultados
    results[model_name] = {
        "accuracy": accuracy,
        "loss": loss,
        "precision_macro": cr['macro avg']['precision'],
        "recall_macro": cr['macro avg']['recall'],
        "f1_macro": cr['macro avg']['f1-score']
    }
    
    print(f"Precisión (accuracy): {accuracy:.4f}")
    print(f"Pérdida (loss): {loss:.4f}")
    print(f"F1-score promedio: {cr['macro avg']['f1-score']:.4f}")

# Ordenar por accuracy
sorted_models = sorted(results.items(), key=lambda x: x[1]['accuracy'], reverse=True)

print("\n" + "="*80)
print("RANKING DE MODELOS (por precisión):")
print("="*80)
for i, (name, metrics) in enumerate(sorted_models, 1):
    print(f"{i}. {name}")
    print(f"   Precisión: {metrics['accuracy']:.4f}")
    print(f"   F1-score: {metrics['f1_macro']:.4f}")
