
import os
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.models import Model
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import ModelCheckpoint

# Rutas locales
BASE_DIR = r'c:\Users\LENOVO\Downloads\17. sistema\hoja_maiz'
DATA_DIR = os.path.join(BASE_DIR, 'Data')
TRAIN_DIR = os.path.join(DATA_DIR, 'train')
VAL_DIR = os.path.join(DATA_DIR, 'val')
MODELS_DIR = os.path.join(BASE_DIR, 'Models')

os.makedirs(MODELS_DIR, exist_ok=True)

# Parámetros pequeños para entrenamiento rápido
IMAGE_SIZE = (224, 224)
BATCH_SIZE = 16
EPOCHS = 5

# Preprocesamiento simple
datagen = ImageDataGenerator(rescale=1./255)

train_gen = datagen.flow_from_directory(
    TRAIN_DIR, target_size=IMAGE_SIZE, batch_size=BATCH_SIZE, class_mode='categorical'
)

val_gen = datagen.flow_from_directory(
    VAL_DIR, target_size=IMAGE_SIZE, batch_size=BATCH_SIZE, class_mode='categorical'
)

NUM_CLASSES = train_gen.num_classes
CLASS_NAMES = list(train_gen.class_indices.keys())
print(f"Clases: {CLASS_NAMES}")

def create_quick_model(name):
    base = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224,224,3))
    base.trainable = False
    
    x = base.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.3)(x)
    preds = Dense(NUM_CLASSES, activation='softmax')(x)
    
    model = Model(inputs=base.input, outputs=preds)
    model.compile(optimizer=Adam(0.001), loss='categorical_crossentropy', metrics=['accuracy'])
    return model

# Entrenar y guardar los 3 modelos (usando la misma arquitectura para que sea rápido)
models_list = ['MobileNetV2', 'ResNet50', 'EfficientNetB0']

for model_name in models_list:
    print(f"\n=== Entrenando {model_name} (versión rápida) ===")
    model = create_quick_model(model_name)
    
    checkpoint = ModelCheckpoint(
        os.path.join(MODELS_DIR, f'{model_name}.h5'),
        monitor='val_accuracy',
        save_best_only=True,
        verbose=1
    )
    
    model.fit(
        train_gen,
        epochs=EPOCHS,
        validation_data=val_gen,
        callbacks=[checkpoint],
        verbose=1
    )

print(f"\n✅ Modelos generados en: {MODELS_DIR}")
for f in os.listdir(MODELS_DIR):
    print(f"   - {f}")
