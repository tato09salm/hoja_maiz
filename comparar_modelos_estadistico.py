import os
import numpy as np
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as mobilenet_pre
from tensorflow.keras.applications.resnet50 import preprocess_input as resnet_pre
from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_pre
from scipy import stats

# Configuración de Rutas (ajustada para el espacio de trabajo actual)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'dataset_dividido')
val_dir = os.path.join(DATA_DIR, 'val')
MODELS_DIR = os.path.join(BASE_DIR, 'Models')

# Configuración de imágenes
img_size = 224
batch_size = 8

# Modelos a evaluar
models_config = [
    ("MobileNetV2", mobilenet_pre),
    ("ResNet50", resnet_pre),
    ("EfficientNetB0", efficientnet_pre)
]

def obtener_predicciones(model_name, preprocess_fn):
    model_path = os.path.join(MODELS_DIR, f"{model_name}.h5")
    if not os.path.exists(model_path):
        print(f"Modelo {model_name} no encontrado en {model_path}")
        return None, None
    
    print(f"\nCargando y evaluando {model_name}...")
    model = load_model(model_path)
    
    val_gen = ImageDataGenerator(preprocessing_function=preprocess_fn)
    val_data = val_gen.flow_from_directory(
        val_dir,
        target_size=(img_size, img_size),
        batch_size=batch_size,
        class_mode='categorical',
        shuffle=False
    )
    
    # Obtener probabilidades crudas
    y_prob = model.predict(val_data, verbose=0)
    y_pred = np.argmax(y_prob, axis=1)
    y_true = val_data.classes
    
    return y_prob, y_pred, y_true

def main():
    if not os.path.exists(val_dir):
        print(f"Directorio de validación no encontrado en {val_dir}. Asegúrese de haber dividido el dataset.")
        return

    predictions_data = {}
    
    for name, prep in models_config:
        probs, preds, targets = obtener_predicciones(name, prep)
        if probs is not None:
            predictions_data[name] = {
                "probs": probs,
                "preds": preds,
                "targets": targets
            }
            
    if len(predictions_data) < 2:
        print("\nSe necesitan al menos 2 modelos cargados para realizar las comparaciones estadísticas.")
        return
        
    model_names = list(predictions_data.keys())
    
    print("\n" + "="*80)
    print("ANÁLISIS ESTADÍSTICO DE VALIDACIÓN DE MODELOS")
    print("="*80)
    
    # 1. Comparación de Distribución de Confianzas (Prueba Kolmogorov-Smirnov)
    print("\n1. Prueba de Kolmogorov-Smirnov (Estabilidad de la Confianza)")
    print("   Determina si la distribución de probabilidad del diagnóstico difiere significativamente.")
    for i in range(len(model_names)):
        for j in range(i + 1, len(model_names)):
            m1, m2 = model_names[i], model_names[j]
            # Extraer las probabilidades del diagnóstico asignado (confianza de la predicción)
            conf_m1 = np.max(predictions_data[m1]["probs"], axis=1)
            conf_m2 = np.max(predictions_data[m2]["probs"], axis=1)
            
            stat, p_val = stats.ks_2samp(conf_m1, conf_m2)
            print(f"   * {m1} vs {m2}:")
            print(f"     Estadístico KS: {stat:.4f} | p-valor: {p_val:.4e}")
            if p_val < 0.05:
                print("     Resultado: Significativamente diferente (las confianzas tienen perfiles distintos).")
            else:
                print("     Resultado: No hay diferencia significativa (comportamiento de confianza estable).")

    # 2. Comparación de Aciertos/Errores por Lotes (Prueba de Mann-Whitney U)
    print("\n2. Prueba de Mann-Whitney U (Significancia de Rendimiento)")
    print("   Compara si el rendimiento (aciertos binarios) es significativamente superior entre modelos.")
    for i in range(len(model_names)):
        for j in range(i + 1, len(model_names)):
            m1, m2 = model_names[i], model_names[j]
            # Vector binario de aciertos (1 = acierto, 0 = error)
            acc_m1 = (predictions_data[m1]["preds"] == predictions_data[m1]["targets"]).astype(int)
            acc_m2 = (predictions_data[m2]["preds"] == predictions_data[m2]["targets"]).astype(int)
            
            stat, p_val = stats.mannwhitneyu(acc_m1, acc_m2, alternative='two-sided')
            print(f"   * {m1} vs {m2}:")
            print(f"     Estadístico U: {stat:.1f} | p-valor: {p_val:.4f}")
            if p_val < 0.05:
                print("     Resultado: Existe diferencia estadísticamente significativa en el rendimiento.")
            else:
                print("     Resultado: No hay diferencia significativa. El rendimiento es equivalente.")

    # 3. Prueba de Levene (Igualdad de Varianzas de los Errores)
    print("\n3. Prueba de Levene (Homogeneidad de Varianzas / Estabilidad de Errores)")
    print("   Evalúa si la dispersión de los errores absolutos es equivalente (Robustez ante outliers).")
    for i in range(len(model_names)):
        for j in range(i + 1, len(model_names)):
            m1, m2 = model_names[i], model_names[j]
            # Errores absolutos (1 - probabilidad del target correcto)
            targets_idx = predictions_data[m1]["targets"]
            err_m1 = 1.0 - predictions_data[m1]["probs"][np.arange(len(targets_idx)), targets_idx]
            err_m2 = 1.0 - predictions_data[m2]["probs"][np.arange(len(targets_idx)), targets_idx]
            
            stat, p_val = stats.levene(err_m1, err_m2)
            print(f"   * {m1} vs {m2}:")
            print(f"     Estadístico Levene: {stat:.4f} | p-valor: {p_val:.4f}")
            if p_val < 0.05:
                print("     Resultado: Las variaciones de error difieren significativamente (comportamiento inestable).")
            else:
                print("     Resultado: Varianzas de error equivalentes. Se prefiere el modelo más ligero/simple.")

if __name__ == '__main__':
    main()
