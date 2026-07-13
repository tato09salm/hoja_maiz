
import os
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Flatten, Input

BASE_DIR = r'c:\Users\LENOVO\Downloads\17. sistema\hoja_maiz'
MODELS_DIR = os.path.join(BASE_DIR, 'Models')
os.makedirs(MODELS_DIR, exist_ok=True)

# Crear modelos simples que acepten la entrada correcta y tengan 4 salidas
for model_name in ['MobileNetV2', 'ResNet50', 'EfficientNetB0']:
    model = Sequential([
        Input(shape=(224, 224, 3)),
        Flatten(),
        Dense(128, activation='relu'),
        Dense(4, activation='softmax')
    ])
    
    model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
    
    # Guardar
    save_path = os.path.join(MODELS_DIR, f'{model_name}.h5')
    model.save(save_path)
    print(f"✅ Modelo temporal {model_name} guardado en {save_path}")

print("\nTodos los modelos temporales creados!")
