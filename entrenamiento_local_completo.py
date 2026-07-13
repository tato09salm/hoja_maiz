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
from tensorflow.keras.models import Model
from tensorflow.keras.layers import GlobalAveragePooling2D, Dense, Dropout
from tensorflow.keras.applications import MobileNetV2, ResNet50, EfficientNetB0
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as mobilenet_pre
from tensorflow.keras.applications.resnet50 import preprocess_input as resnet_pre
from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_pre
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

# ------------------------
# 📂 Rutas locales
# ------------------------
BASE_DIR = r'c:\Users\LENOVO\Downloads\17. sistema\hoja_maiz'
DATA_DIR = os.path.join(BASE_DIR, 'dataset_dividido')
train_dir = os.path.join(DATA_DIR, 'train')
val_dir = os.path.join(DATA_DIR, 'val')
REPORTS_DIR = os.path.join(BASE_DIR, 'Reports')
MODELS_DIR = os.path.join(BASE_DIR, 'Models')
os.makedirs(REPORTS_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# ------------------------
# ⚙️ Configuración
# ------------------------
img_size = 224  # Tamaño de imagen según la memoria del proyecto
batch_size = 8
epochs = 5

# Cargar nombres de clases
temp_gen = ImageDataGenerator(preprocessing_function=mobilenet_pre)
temp_data = temp_gen.flow_from_directory(train_dir, target_size=(img_size, img_size))
class_names = list(temp_data.class_indices.keys())
num_classes = len(class_names)
print(f"Clases detectadas: {class_names}")

# ------------------------
# 🔄 Generadores de datos
# ------------------------
def get_data_generators(preprocess_fn):
    train_gen = ImageDataGenerator(
        preprocessing_function=preprocess_fn,
        rotation_range=20,
        zoom_range=0.2,
        shear_range=0.2,
        horizontal_flip=True,
        brightness_range=(0.8, 1.2),
        fill_mode='nearest'
    )
    val_gen = ImageDataGenerator(preprocessing_function=preprocess_fn)

    train_data = train_gen.flow_from_directory(
        train_dir, 
        target_size=(img_size, img_size), 
        batch_size=batch_size, 
        class_mode='categorical'
    )
    val_data = val_gen.flow_from_directory(
        val_dir, 
        target_size=(img_size, img_size), 
        batch_size=batch_size, 
        class_mode='categorical', 
        shuffle=False
    )

    return train_data, val_data

# ------------------------
# ⚖️ Construcción de modelos
# ------------------------
def build_model(base_model_fn, preprocess_fn, name):
    base_model = base_model_fn(include_top=False, input_shape=(img_size, img_size, 3), weights='imagenet')
    x = GlobalAveragePooling2D()(base_model.output)
    x = Dropout(0.3)(x)
    output = Dense(num_classes, activation='softmax')(x)
    model = Model(inputs=base_model.input, outputs=output, name=name)
    return model

# ------------------------
# 🔢 Entrenamiento y evaluación
# ------------------------
all_training_results = {}

def train_and_evaluate(model_fn, preprocess_fn, model_name):
    print(f"\n{'='*60}")
    print(f"Entrenando {model_name}")
    print(f"{'='*60}")
    
    model = build_model(model_fn, preprocess_fn, model_name)
    model.compile(optimizer=Adam(1e-4), loss='categorical_crossentropy', metrics=['accuracy'])

    train_data, val_data = get_data_generators(preprocess_fn)

    callbacks = [
        EarlyStopping(patience=5, restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(patience=3, factor=0.3, verbose=1)
    ]

    start = time.time()
    history = model.fit(
        train_data,
        validation_data=val_data,
        epochs=epochs,
        callbacks=callbacks,
        verbose=1
    )
    duration = time.time() - start
    print(f"\nTiempo de entrenamiento: {duration:.2f} segundos ({duration/60:.2f} minutos)")

    # Guardar modelo
    model.save(os.path.join(MODELS_DIR, f"{model_name}.h5"))
    print(f"Modelo guardado en {MODELS_DIR}/{model_name}.h5")

    # Evaluación
    val_data.reset()
    preds = model.predict(val_data, verbose=1)
    y_pred = np.argmax(preds, axis=1)
    y_true = val_data.classes

    # Generar métricas
    report = classification_report(y_true, y_pred, target_names=class_names, output_dict=True)
    conf_matrix = confusion_matrix(y_true, y_pred)

    # Guardar resultados
    all_training_results[model_name] = {
        'history': history.history,
        'duration': duration,
        'classification_report': report,
        'confusion_matrix': conf_matrix,
        'class_names': class_names,
        'y_true': y_true,
        'y_pred': y_pred
    }

    # Guardar reporte de texto
    with open(os.path.join(REPORTS_DIR, f"{model_name}_reporte.txt"), "w", encoding='utf-8') as f:
        f.write(f"REPORTE DE ENTRENAMIENTO: {model_name}\n")
        f.write("="*60 + "\n\n")
        f.write(f"Tiempo de entrenamiento: {duration:.2f} segundos ({duration/60:.2f} min)\n\n")
        f.write("Reporte de clasificación:\n")
        f.write(classification_report(y_true, y_pred, target_names=class_names))

    # Guardar matriz de confusión
    plt.figure(figsize=(10, 8))
    sns.heatmap(conf_matrix, annot=True, fmt="d", xticklabels=class_names, yticklabels=class_names, cmap="Blues")
    plt.title(f"Matriz de Confusión - {model_name}")
    plt.ylabel("Etiqueta Real")
    plt.xlabel("Etiqueta Predicha")
    plt.tight_layout()
    plt.savefig(os.path.join(REPORTS_DIR, f"{model_name}_matriz_confusion.png"))
    plt.close()
    print(f"Matriz de confusión guardada para {model_name}")

    # Guardar curvas de entrenamiento
    plt.figure(figsize=(12, 5))
    
    # Accuracy
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='Train Accuracy')
    plt.plot(history.history['val_accuracy'], label='Val Accuracy')
    plt.title(f'{model_name} - Accuracy')
    plt.xlabel('Época')
    plt.ylabel('Accuracy')
    plt.legend()
    
    # Loss
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Train Loss')
    plt.plot(history.history['val_loss'], label='Val Loss')
    plt.title(f'{model_name} - Loss')
    plt.xlabel('Época')
    plt.ylabel('Loss')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig(os.path.join(REPORTS_DIR, f"{model_name}_curvas_entrenamiento.png"))
    plt.close()
    print(f"Curvas de entrenamiento guardadas para {model_name}")

# ------------------------
# 📈 Entrenar todos los modelos
# ------------------------
modelos = [
    (MobileNetV2, mobilenet_pre, "MobileNetV2"),
    (ResNet50, resnet_pre, "ResNet50"),
    (EfficientNetB0, efficientnet_pre, "EfficientNetB0")
]

for model_fn, preprocess_fn, name in modelos:
    train_and_evaluate(model_fn, preprocess_fn, name)

# Guardar todos los resultados en un archivo pickle para generar reportes posteriormente
with open(os.path.join(REPORTS_DIR, 'resultados_entrenamiento.pkl'), 'wb') as f:
    pickle.dump(all_training_results, f)

print("\n" + "="*60)
print("Entrenamiento de todos los modelos completado!")
print("="*60)
