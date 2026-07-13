
# Guía de Mejoramiento del Modelo de Detección de Enfermedades en Maíz

## Resumen
Este proyecto implementa un modelo de deep learning mejorado para detectar enfermedades en hojas de maíz, utilizando el dataset segmentado y técnicas avanzadas de machine learning.

## Estructura del Proyecto
```
hoja_maiz/
├── dataset/
│   └── segmented/          # Dataset con imágenes segmentadas (fondo eliminado)
├── Models/                 # Carpeta para guardar modelos entrenados
├── Reports2/               # Reportes y gráficos generados
├── mejorar_modelo.py       # Script principal de entrenamiento
└── inferencia_mejorada.py  # Script de inferencia (generado automáticamente)
```

## Características del Modelo Mejorado

### 1. Análisis del Dataset
- Análisis de distribución de clases
- Detección de desbalance
- Validación de calidad de datos

### 2. Preprocesamiento y Aumento de Datos
- Normalización de imágenes
- Rotación (±40°)
- Zoom (±20%)
- Desplazamiento horizontal y vertical
- Flip horizontal y vertical
- Ajuste de brillo
- Cambio de canales de color

### 3. Arquitectura del Modelo
- Base: MobileNetV2 preentrenado en ImageNet
- Fine-tuning a partir de la capa 100
- Capas densas con:
  - Batch Normalization
  - Dropout (50% y 30%)
  - Regularización L2 implícita

### 4. Entrenamiento
- Validación cruzada estratificada (5 folds)
- Optimizador Adam con learning rate reducido en plateau
- Early stopping con restauración de mejores pesos
- Checkpoints para guardar el mejor modelo

### 5. Evaluación
- Matriz de confusión
- Reporte de clasificación (precision, recall, F1)
- Curvas de entrenamiento (accuracy y loss)

## Instrucciones de Uso

### 1. Requisitos
- Python 3.8+
- TensorFlow 2.x
- scikit-learn
- matplotlib
- seaborn
- Pillow
- numpy

Instalar dependencias:
```bash
pip install tensorflow scikit-learn matplotlib seaborn pillow numpy
```

### 2. Entrenamiento del Modelo
Ejecutar el script de entrenamiento:
```bash
python mejorar_modelo.py
```

El script hará lo siguiente automáticamente:
1. Analizar el dataset
2. Entrenar 5 folds con validación cruzada
3. Guardar el mejor modelo en `Models/MobileNetV2_mejorado.h5`
4. Generar reportes en la carpeta `Reports2/`
5. Crear el script de inferencia

### 3. Uso del Script de Inferencia
Una vez entrenado, usa el script generado para clasificar nuevas imágenes:
```bash
python inferencia_mejorada.py ruta/a/tu/imagen.jpg
```

### 4. Integración con el Backend
Para usar el modelo mejorado en tu aplicación FastAPI:
1. Copia `Models/MobileNetV2_mejorado.h5` a la carpeta Models/
2. Actualiza `backend/main.py` para cargar el nuevo modelo:
   ```python
   MODEL_PATH = os.path.join(BASE_DIR, 'Models', 'MobileNetV2_mejorado.h5')
   ```

## Reportes Generados
- `distribucion_clases.png`: Gráfico de balance de clases
- `historia_foldX.png`: Curvas de entrenamiento para cada fold
- `matriz_confusion_mejorado.png`: Matriz de confusión
- `reporte_mejorado.txt`: Reporte detallado de métricas

## Clasificación de Enfermedades
El modelo clasifica 4 categorías:
1. **Common Rust** (Roya común)
2. **Gray Leaf Spot** (Mancha gris)
3. **Northern Leaf Blight** (Tizón del norte)
4. **Healthy** (Sana)

## Rendimiento Esperado
El modelo mejorado debería alcanzar:
- Accuracy > 95% (dependiendo del dataset)
- Buena generalización gracias a la regularización y validación cruzada

## Notas Importantes
- Asegúrate de que el dataset segmentado esté en `dataset/segmented/`
- Las imágenes deben estar en subcarpetas con los nombres de las clases
- El entrenamiento puede tardar bastante dependiendo de tu GPU/CPU
