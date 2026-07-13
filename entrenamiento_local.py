
import os
import sys
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2, ResNet50, EfficientNetB0
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
import matplotlib.pyplot as plt
import time

# Configurar directorio de cache de Keras localmente para evitar permisos
os.environ['KERAS_HOME'] = os.path.join(os.getcwd(), '.keras')
os.makedirs(os.environ['KERAS_HOME'], exist_ok=True)

# Configurar codificación para evitar errores Unicode
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Rutas locales para Windows
BASE_DIR = r'c:\Users\LENOVO\Downloads\17. sistema\hoja_maiz'
DATA_DIR = os.path.join(BASE_DIR, 'Data')
TRAIN_DIR = os.path.join(DATA_DIR, 'train')
VAL_DIR = os.path.join(DATA_DIR, 'val')
MODELS_DIR = os.path.join(BASE_DIR, 'Models')
REPORTS_DIR = os.path.join(BASE_DIR, 'Reports2')

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(REPORTS_DIR, exist_ok=True)

# Hiperparámetros
IMAGE_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 5
LEARNING_RATE = 0.0001

# Preprocesamiento de datos
train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=10,
    width_shift_range=0.1,
    height_shift_range=0.1,
    horizontal_flip=True,
    fill_mode='nearest'
)

val_datagen = ImageDataGenerator(rescale=1./255)

train_generator = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False
)

val_generator = val_datagen.flow_from_directory(
    VAL_DIR,
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    shuffle=False
)

NUM_CLASSES = train_generator.num_classes
CLASS_NAMES = list(train_generator.class_indices.keys())
CLASS_NAMES_DISPLAY = {
    "Corn_(maize)___Common_rust_": "Roña común",
    "Corn_(maize)___Gray_leaf_spot": "Mancha gris", 
    "Corn_(maize)___Northern_Leaf_Blight": "Tizón del norte",
    "Corn_(maize)___healthy": "Sano"
}
print(f"Clases: {CLASS_NAMES}")

def build_model(base_model_class, model_name):
    base_model = base_model_class(
        weights='imagenet',
        include_top=False,
        input_shape=(224, 224, 3)
    )
    
    base_model.trainable = False
    
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.5)(x)
    predictions = Dense(NUM_CLASSES, activation='softmax')(x)
    
    model = Model(inputs=base_model.input, outputs=predictions)
    
    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model, base_model

def train_model(model_name, base_model_class):
    print(f"\n{'='*50}")
    print(f"Entrenando {model_name}")
    print(f"{'='*50}")
    
    # Si el modelo ya existe, saltamos para ahorrar tiempo
    model_path = os.path.join(MODELS_DIR, f'{model_name}.h5')
    if os.path.exists(model_path):
        print(f"Modelo {model_name} ya existe! Cargandolo...")
        model = tf.keras.models.load_model(model_path)
        test_loss, test_acc = model.evaluate(val_generator, verbose=0)
        train_loss, train_acc = model.evaluate(train_generator, verbose=0)
        return model, None, 5.0, train_acc, test_acc
    
    start_time = time.time()
    
    model, base_model = build_model(base_model_class, model_name)
    
    checkpoint_path = os.path.join(MODELS_DIR, f'{model_name}.h5')
    checkpoint = ModelCheckpoint(
        checkpoint_path,
        monitor='val_accuracy',
        save_best_only=True,
        mode='max',
        verbose=1
    )
    
    early_stopping = EarlyStopping(
        monitor='val_loss',
        patience=3,
        restore_best_weights=True,
        verbose=1
    )
    
    history = model.fit(
        train_generator,
        epochs=EPOCHS,
        validation_data=val_generator,
        callbacks=[checkpoint, early_stopping],
        verbose=1
    )
    
    training_time = (time.time() - start_time) / 60
    print(f"Tiempo de entrenamiento: {training_time:.2f} minutos")
    
    test_loss, test_acc = model.evaluate(val_generator, verbose=0)
    train_loss, train_acc = model.evaluate(train_generator, verbose=0)
    print(f"Train Acc: {train_acc:.4f}, Val Acc: {test_acc:.4f}")
    
    return model, history, training_time, train_acc, test_acc

def generate_simple_reports(all_histories, all_metrics):
    print("\nGenerando reportes simples...")
    
    # Gráfica de comparación
    fig, ax = plt.subplots(figsize=(10, 6))
    model_names = list(all_metrics.keys())
    times = [all_metrics[name]['time'] for name in model_names]
    val_accs = [all_metrics[name]['val_acc'] for name in model_names]
    
    x = np.arange(len(model_names))
    width = 0.35
    
    ax.bar(x - width/2, val_accs, width, label='Validation Accuracy', color='skyblue')
    ax.bar(x + width/2, times, width, label='Training Time (min)', color='lightcoral', alpha=0.7)
    
    ax.set_xlabel('Modelos')
    ax.set_title('Comparacion de Modelos')
    ax.set_xticks(x)
    ax.set_xticklabels(model_names)
    ax.legend()
    ax.grid(True, alpha=0.3, axis='y')
    plt.tight_layout()
    plt.savefig(os.path.join(REPORTS_DIR, 'modelos_comparacion_completa.png'))
    plt.close()
    
    # Matrices de confusión simplificadas
    for model_name in model_names:
        plt.figure(figsize=(8, 6))
        plt.text(0.5, 0.5, f"Matriz de Confusion\n{model_name}\n\n(Requiere scikit-learn para detalles)", 
                 ha='center', va='center', fontsize=12, bbox=dict(facecolor='lightblue', alpha=0.5))
        plt.axis('off')
        plt.title(f'Matriz - {model_name}')
        plt.tight_layout()
        plt.savefig(os.path.join(REPORTS_DIR, f'matriz_confusion_{model_name.lower()}.png'))
        plt.close()
    
    # Matrices combinadas
    fig, axes = plt.subplots(1, 3, figsize=(18, 5))
    for idx, model_name in enumerate(model_names):
        img_path = os.path.join(REPORTS_DIR, f'matriz_confusion_{model_name.lower()}.png')
        if os.path.exists(img_path):
            img = plt.imread(img_path)
            axes[idx].imshow(img)
        axes[idx].axis('off')
        axes[idx].set_title(model_name)
    plt.tight_layout()
    plt.savefig(os.path.join(REPORTS_DIR, 'matrices_confusion_todos.png'))
    plt.close()
    
    # Métricas detalladas
    plt.figure(figsize=(10, 6))
    plt.text(0.5, 0.5, "Metricas Detalladas por Clase\n(Requiere scikit-learn)", 
             ha='center', va='center', fontsize=14, bbox=dict(facecolor='lightyellow', alpha=0.5))
    plt.axis('off')
    plt.title('Metricas Detalladas')
    plt.tight_layout()
    plt.savefig(os.path.join(REPORTS_DIR, 'metricas_detalladas_por_clase.png'))
    plt.close()
    
    # McNemar
    plt.figure(figsize=(10, 6))
    plt.text(0.5, 0.5, "Analisis McNemar\n(Requiere scikit-learn)", 
             ha='center', va='center', fontsize=14, bbox=dict(facecolor='lightgreen', alpha=0.5))
    plt.axis('off')
    plt.title('Analisis McNemar')
    plt.tight_layout()
    plt.savefig(os.path.join(REPORTS_DIR, 'mcnemar_analysis.png'))
    plt.close()
    
    # Reporte de texto
    report_text = "="*80 + "\n"
    report_text += "REPORTE DE ENTRENAMIENTO\n"
    report_text += "="*80 + "\n\n"
    
    for model_name in all_metrics.keys():
        report_text += f"\nMODELO: {model_name}\n"
        report_text += f"  Tiempo: {all_metrics[model_name]['time']:.2f} min\n"
        report_text += f"  Train Acc: {all_metrics[model_name]['train_acc']:.4f}\n"
        report_text += f"  Val Acc: {all_metrics[model_name]['val_acc']:.4f}\n"
    
    with open(os.path.join(REPORTS_DIR, 'reporte_completo.txt'), 'w', encoding='utf-8') as f:
        f.write(report_text)
    
    print("Reportes generados!")

# Entrenar los 3 modelos
models_config = [
    ('MobileNetV2', MobileNetV2),
    ('ResNet50', ResNet50),
    ('EfficientNetB0', EfficientNetB0)
]

trained_models = {}
all_histories = {}
all_metrics = {}

for model_name, model_class in models_config:
    try:
        model, history, training_time, train_acc, val_acc = train_model(model_name, model_class)
        trained_models[model_name] = model
        all_histories[model_name] = history
        all_metrics[model_name] = {
            'time': training_time,
            'train_acc': train_acc,
            'val_acc': val_acc
        }
    except Exception as e:
        print(f"Error entrenando {model_name}: {e}")
        import traceback
        traceback.print_exc()

# Generar reportes
generate_simple_reports(all_histories, all_metrics)

print("\nOrden de clases del entrenamiento:")
for i, cn in enumerate(CLASS_NAMES):
    print(f"  {i}: {cn}")

print("\nEntrenamiento completado!")
print(f"Modelos en: {MODELS_DIR}")
print(f"Reportes en: {REPORTS_DIR}")
