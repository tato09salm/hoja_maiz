
"""
Script para mejorar el modelo de detección de enfermedades en maíz
Utilizando el dataset segmentado y técnicas avanzadas de ML
"""

import os
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import tensorflow as tf
from tensorflow.keras import layers, models, optimizers, callbacks
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator

# Configuración inicial
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, 'dataset', 'segmented')
MODELS_DIR = os.path.join(BASE_DIR, 'Models')
REPORTS_DIR = os.path.join(BASE_DIR, 'Reports2')

for dir_path in [MODELS_DIR, REPORTS_DIR]:
    os.makedirs(dir_path, exist_ok=True)

# Parámetros
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 50
LEARNING_RATE = 0.0001
NUM_FOLDS = 5

# Mapeo de nombres de clases a etiquetas amigables
CLASS_NAME_MAPPING = {
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": "Mancha gris",
    "Corn_(maize)___Common_rust_": "Roña común", 
    "Corn_(maize)___Northern_Leaf_Blight": "Tizón del norte",
    "Corn_(maize)___healthy": "Sano"
}

# 1. Análisis y exploración del dataset
def analizar_dataset():
    """Analiza la estructura y balance del dataset"""
    print("\n" + "="*60)
    print("ANÁLISIS DEL DATASET SEGMENTADO")
    print("="*60)
    
    classes = sorted([d for d in os.listdir(DATASET_DIR) if os.path.isdir(os.path.join(DATASET_DIR, d))])
    friendly_classes = [CLASS_NAME_MAPPING.get(c, c) for c in classes]
    print(f"\nClases encontradas: {friendly_classes}")
    
    class_counts = {}
    for cls in classes:
        cls_dir = os.path.join(DATASET_DIR, cls)
        count = len([f for f in os.listdir(cls_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
        class_counts[CLASS_NAME_MAPPING.get(cls, cls)] = count
        print(f"  {CLASS_NAME_MAPPING.get(cls, cls)}: {count} imágenes")
    
    # Visualizar balance
    plt.figure(figsize=(12, 6))
    colors = ['#2d5016', '#4a7c23', '#6ab04c', '#a8e6cf']
    plt.bar(class_counts.keys(), class_counts.values(), color=colors)
    plt.title('Distribución de imágenes por clase')
    plt.xticks(rotation=45, ha='right')
    plt.ylabel('Número de imágenes')
    plt.tight_layout()
    plt.savefig(os.path.join(REPORTS_DIR, 'distribucion_clases.png'), dpi=300)
    plt.close()
    
    print(f"\nDistribución guardada en {REPORTS_DIR}/distribucion_clases.png")
    return classes

# 2. Preprocesamiento y aumento de datos
def crear_generadores():
    """Crea generadores de datos con aumento específico para hojas de maíz"""
    # Aumento de datos para entrenamiento
    train_datagen = ImageDataGenerator(
        preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input,
        rotation_range=40,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        vertical_flip=True,
        brightness_range=[0.7, 1.3],
        channel_shift_range=20,
        fill_mode='nearest',
        validation_split=0.2  # 20% para validación
    )
    
    # Solo preprocesamiento para validación/test
    val_datagen = ImageDataGenerator(
        preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input,
        validation_split=0.2
    )
    
    return train_datagen, val_datagen

# 3. Crear modelo mejorado
def crear_modelo_mejorado(num_classes):
    """Crea un modelo MobileNetV2 mejorado con regularización"""
    # Cargar base model preentrenada
    base_model = MobileNetV2(
        input_shape=(224, 224, 3),
        include_top=False,
        weights='imagenet'
    )
    
    # Descongelar algunas capas para fine-tuning
    base_model.trainable = True
    fine_tune_at = 100
    for layer in base_model.layers[:fine_tune_at]:
        layer.trainable = False
    
    # Construir el modelo completo
    inputs = layers.Input(shape=(224, 224, 3))
    x = base_model(inputs, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(512, activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.5)(x)
    x = layers.Dense(256, activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(num_classes, activation='softmax')(x)
    
    model = models.Model(inputs, outputs)
    
    # Compilar el modelo
    model.compile(
        optimizer=optimizers.Adam(learning_rate=LEARNING_RATE),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model

# 4. Entrenamiento con validación cruzada
def entrenar_modelo():
    """Entrena el modelo usando validación cruzada estratificada"""
    classes = analizar_dataset()
    num_classes = len(classes)
    
    # Crear generadores
    train_datagen, val_datagen = crear_generadores()
    
    # Generador completo para obtener todas las rutas y etiquetas
    full_generator = train_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMG_SIZE,
        batch_size=1,
        class_mode='categorical',
        shuffle=False
    )
    
    # Obtener rutas y etiquetas
    file_paths = full_generator.filepaths
    labels = full_generator.labels
    
    # Validación cruzada estratificada
    skf = StratifiedKFold(n_splits=NUM_FOLDS, shuffle=True, random_state=42)
    
    fold_results = []
    best_accuracy = 0
    best_model = None
    
    print("\n" + "="*60)
    print(f"INICIO DE ENTRENAMIENTO CON {NUM_FOLDS}-FOLD CROSS VALIDATION")
    print("="*60)
    
    for fold, (train_idx, val_idx) in enumerate(skf.split(file_paths, labels)):
        print(f"\n--- Fold {fold + 1}/{NUM_FOLDS} ---")
        
        # Crear generadores para este fold
        train_filenames = [file_paths[i] for i in train_idx]
        val_filenames = [file_paths[i] for i in val_idx]
        
        train_labels = labels[train_idx]
        val_labels = labels[val_idx]
        
        # Dataframes temporales (simplificado)
        # Usaremos flow_from_directory con subsets alternativos
        train_generator = train_datagen.flow_from_directory(
            DATASET_DIR,
            target_size=IMG_SIZE,
            batch_size=BATCH_SIZE,
            class_mode='categorical',
            subset='training',
            seed=fold
        )
        
        val_generator = val_datagen.flow_from_directory(
            DATASET_DIR,
            target_size=IMG_SIZE,
            batch_size=BATCH_SIZE,
            class_mode='categorical',
            subset='validation',
            seed=fold,
            shuffle=False
        )
        
        # Crear modelo
        model = crear_modelo_mejorado(num_classes)
        
        # Callbacks
        early_stopping = callbacks.EarlyStopping(
            monitor='val_loss',
            patience=10,
            restore_best_weights=True,
            verbose=1
        )
        
        reduce_lr = callbacks.ReduceLROnPlateau(
            monitor='val_loss',
            factor=0.5,
            patience=5,
            min_lr=1e-7,
            verbose=1
        )
        
        checkpoint = callbacks.ModelCheckpoint(
            os.path.join(MODELS_DIR, f'best_model_fold{fold+1}.h5'),
            monitor='val_accuracy',
            save_best_only=True,
            verbose=1
        )
        
        # Entrenar
        history = model.fit(
            train_generator,
            epochs=EPOCHS,
            validation_data=val_generator,
            callbacks=[early_stopping, reduce_lr, checkpoint],
            verbose=1
        )
        
        # Evaluar
        val_loss, val_acc = model.evaluate(val_generator, verbose=0)
        fold_results.append(val_acc)
        
        print(f"\nFold {fold+1} - Validation Accuracy: {val_acc:.4f}")
        
        # Guardar el mejor modelo global
        if val_acc &gt; best_accuracy:
            best_accuracy = val_acc
            best_model = model
            model.save(os.path.join(MODELS_DIR, 'MobileNetV2_mejorado.h5'))
            print(f"Nuevo mejor modelo guardado con accuracy: {best_accuracy:.4f}")
        
        # Plot training history
        plt.figure(figsize=(12, 4))
        plt.subplot(1, 2, 1)
        plt.plot(history.history['accuracy'], label='Training Accuracy')
        plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
        plt.title(f'Fold {fold+1} - Accuracy')
        plt.legend()
        plt.subplot(1, 2, 2)
        plt.plot(history.history['loss'], label='Training Loss')
        plt.plot(history.history['val_loss'], label='Validation Loss')
        plt.title(f'Fold {fold+1} - Loss')
        plt.legend()
        plt.savefig(os.path.join(REPORTS_DIR, f'historia_fold{fold+1}.png'), dpi=150)
        plt.close()
    
    # Resultados de la validación cruzada
    print("\n" + "="*60)
    print("RESULTADOS DE VALIDACIÓN CRUZADA")
    print("="*60)
    print(f"Accuracy por fold: {[f'{acc:.4f}' for acc in fold_results]}")
    print(f"Accuracy promedio: {np.mean(fold_results):.4f} (+/- {np.std(fold_results):.4f})")
    print(f"Mejor accuracy: {best_accuracy:.4f}")
    
    return best_model, classes

# 5. Evaluación final y reportes
def evaluar_y_generar_reportes(model, classes):
    """Genera reportes detallados de evaluación"""
    print("\n" + "="*60)
    print("GENERANDO REPORTES FINALES")
    print("="*60)
    
    friendly_classes = [CLASS_NAME_MAPPING.get(c, c) for c in classes]
    
    val_datagen = ImageDataGenerator(
        preprocessing_function=tf.keras.applications.mobilenet_v2.preprocess_input,
        validation_split=0.2
    )
    
    val_generator = val_datagen.flow_from_directory(
        DATASET_DIR,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='validation',
        shuffle=False
    )
    
    # Predicciones
    y_pred_prob = model.predict(val_generator, verbose=1)
    y_pred = np.argmax(y_pred_prob, axis=1)
    y_true = val_generator.classes
    
    # Matriz de confusión
    cm = confusion_matrix(y_true, y_pred)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Greens', 
                xticklabels=friendly_classes, yticklabels=friendly_classes)
    plt.title('Matriz de Confusión')
    plt.xlabel('Predicha')
    plt.ylabel('Real')
    plt.savefig(os.path.join(REPORTS_DIR, 'matriz_confusion_mejorado.png'), dpi=300)
    plt.close()
    print(f"Matriz de confusión guardada en {REPORTS_DIR}")
    
    # Classification report
    report = classification_report(y_true, y_pred, target_names=friendly_classes, output_dict=True)
    print("\nReporte de Clasificación:")
    print(classification_report(y_true, y_pred, target_names=friendly_classes))
    
    # Guardar reporte en texto
    with open(os.path.join(REPORTS_DIR, 'reporte_mejorado.txt'), 'w', encoding='utf-8') as f:
        f.write("="*60 + "\n")
        f.write("REPORTE DEL MODELO MEJORADO\n")
        f.write("="*60 + "\n\n")
        f.write(classification_report(y_true, y_pred, target_names=friendly_classes))
        f.write(f"\nAccuracy General: {accuracy_score(y_true, y_pred):.4f}\n")
    
    print(f"Reporte guardado en {REPORTS_DIR}/reporte_mejorado.txt")
    
    return friendly_classes

# 6. Script de inferencia
def crear_script_inferencia(classes, friendly_classes):
    """Crea un script de inferencia optimizado"""
    script_content = f'''"""
Script de Inferencia para Modelo Mejorado de Detección de Enfermedades en Maíz
Uso: python inferencia_mejorada.py ruta/a/imagen.jpg
"""

import os
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

# Configuración
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'Models', 'MobileNetV2_mejorado.h5')
IMG_SIZE = (224, 224)
CLASSES = {friendly_classes}
RAW_CLASSES = {classes}
CLASS_MAP = {{raw: friendly for raw, friendly in zip(RAW_CLASSES, CLASSES)}}

# Cargar modelo
print("Cargando modelo...")
model = load_model(MODEL_PATH)
print("Modelo cargado exitosamente!")

def predecir_imagen(img_path):
    """Realiza la predicción en una imagen"""
    # Cargar y preprocesar imagen
    img = image.load_img(img_path, target_size=IMG_SIZE)
    img_array = image.img_to_array(img)
    img_batch = np.expand_dims(img_array, axis=0)
    img_preprocessed = preprocess_input(img_batch)
    
    # Predicción
    predictions = model.predict(img_preprocessed, verbose=0)
    pred_idx = np.argmax(predictions[0])
    pred_class = CLASSES[pred_idx]
    confidence = predictions[0][pred_idx] * 100
    
    # Resultados
    print("\\n" + "="*60)
    print(f"Resultado de la Predicción:")
    print("="*60)
    print(f"Clase: {{pred_class}}")
    print(f"Confianza: {{confidence:.2f}}%")
    print("\\nProbabilidades por clase:")
    for i, cls in enumerate(CLASSES):
        print(f"  {{cls}}: {{predictions[0][i]*100:.2f}}%")
    
    return pred_class, confidence

if __name__ == "__main__":
    import sys
    if len(sys.argv) &gt; 1:
        img_path = sys.argv[1]
        if os.path.exists(img_path):
            predecir_imagen(img_path)
        else:
            print(f"Error: El archivo {{img_path}} no existe")
    else:
        print("Uso: python inferencia_mejorada.py ruta/a/imagen.jpg")
'''
    
    with open(os.path.join(BASE_DIR, 'inferencia_mejorada.py'), 'w', encoding='utf-8') as f:
        f.write(script_content)
    
    print(f"Script de inferencia creado en: {BASE_DIR}/inferencia_mejorada.py")

# Función principal
def main():
    print("\n" + "="*60)
    print("SISTEMA DE MEJORAMIENTO DE DETECCIÓN DE ENFERMEDADES EN MAÍZ")
    print("="*60)
    
    # Entrenar
    model, classes = entrenar_modelo()
    
    # Evaluar y generar reportes
    friendly_classes = evaluar_y_generar_reportes(model, classes)
    
    # Crear script de inferencia
    crear_script_inferencia(classes, friendly_classes)
    
    print("\n" + "="*60)
    print("PROCESO COMPLETADO EXITOSAMENTE!")
    print("="*60)

if __name__ == "__main__":
    main()

