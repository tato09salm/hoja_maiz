import os
import json
import numpy as np
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as mobilenet_pre
from tensorflow.keras.applications.resnet50 import preprocess_input as resnet_pre
from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_pre
from scipy import stats
from sklearn.metrics import classification_report

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'dataset_dividido')
val_dir = os.path.join(DATA_DIR, 'val')
MODELS_DIR = os.path.join(BASE_DIR, 'Models')
OUTPUT_FILE = os.path.join(BASE_DIR, 'backend', 'stats_cache.json')

img_size = 224
batch_size = 8

models_config = [
    ("MobileNetV2", mobilenet_pre),
    ("ResNet50", resnet_pre),
    ("EfficientNetB0", efficientnet_pre)
]

def main():
    if not os.path.exists(val_dir):
        print(f"Validation directory not found at {val_dir}")
        return

    predictions_data = {}
    summary_metrics = {}

    # Get class names
    temp_gen = ImageDataGenerator(preprocessing_function=mobilenet_pre)
    temp_data = temp_gen.flow_from_directory(val_dir, target_size=(img_size, img_size), batch_size=batch_size, shuffle=False)
    class_names = list(temp_data.class_indices.keys())

    for name, prep in models_config:
        model_path = os.path.join(MODELS_DIR, f"{name}.h5")
        if not os.path.exists(model_path):
            print(f"Model {name} not found.")
            continue
            
        print(f"Evaluating {name}...")
        model = load_model(model_path)
        
        val_gen = ImageDataGenerator(preprocessing_function=prep)
        val_data = val_gen.flow_from_directory(
            val_dir,
            target_size=(img_size, img_size),
            batch_size=batch_size,
            class_mode='categorical',
            shuffle=False
        )
        
        loss, accuracy = model.evaluate(val_data, verbose=0)
        probs = model.predict(val_data, verbose=0)
        preds = np.argmax(probs, axis=1)
        targets = val_data.classes
        
        cr = classification_report(targets, preds, target_names=class_names, output_dict=True)
        
        predictions_data[name] = {
            "probs": probs,
            "preds": preds,
            "targets": targets
        }
        
        summary_metrics[name] = {
            "accuracy": float(accuracy),
            "loss": float(loss),
            "precision_macro": float(cr['macro avg']['precision']),
            "recall_macro": float(cr['macro avg']['recall']),
            "f1_macro": float(cr['macro avg']['f1-score'])
        }

    # Perform statistical tests
    model_names = list(predictions_data.keys())
    ks_results = []
    mw_results = []
    levene_results = []

    # Kolmogorov-Smirnov
    for i in range(len(model_names)):
        for j in range(i + 1, len(model_names)):
            m1, m2 = model_names[i], model_names[j]
            conf_m1 = np.max(predictions_data[m1]["probs"], axis=1)
            conf_m2 = np.max(predictions_data[m2]["probs"], axis=1)
            stat, p_val = stats.ks_2samp(conf_m1, conf_m2)
            
            ks_results.append({
                "model_1": m1,
                "model_2": m2,
                "statistic": float(stat),
                "p_value": float(p_val),
                "significant": bool(p_val < 0.05),
                "interpretation": (
                    "Las confianzas de predicción difieren significativamente en sus distribuciones de probabilidad."
                    if p_val < 0.05 else
                    "No hay diferencia significativa en los perfiles de confianza de predicción."
                )
            })

    # Mann-Whitney U
    for i in range(len(model_names)):
        for j in range(i + 1, len(model_names)):
            m1, m2 = model_names[i], model_names[j]
            acc_m1 = (predictions_data[m1]["preds"] == predictions_data[m1]["targets"]).astype(int)
            acc_m2 = (predictions_data[m2]["preds"] == predictions_data[m2]["targets"]).astype(int)
            stat, p_val = stats.mannwhitneyu(acc_m1, acc_m2, alternative='two-sided')
            
            mw_results.append({
                "model_1": m1,
                "model_2": m2,
                "statistic": float(stat),
                "p_value": float(p_val),
                "significant": bool(p_val < 0.05),
                "interpretation": (
                    "Existe diferencia estadísticamente significativa en el rendimiento global de los modelos."
                    if p_val < 0.05 else
                    "El rendimiento de ambos modelos es estadísticamente equivalente."
                )
            })

    # Levene
    for i in range(len(model_names)):
        for j in range(i + 1, len(model_names)):
            m1, m2 = model_names[i], model_names[j]
            targets_idx = predictions_data[m1]["targets"]
            err_m1 = 1.0 - predictions_data[m1]["probs"][np.arange(len(targets_idx)), targets_idx]
            err_m2 = 1.0 - predictions_data[m2]["probs"][np.arange(len(targets_idx)), targets_idx]
            stat, p_val = stats.levene(err_m1, err_m2)
            
            levene_results.append({
                "model_1": m1,
                "model_2": m2,
                "statistic": float(stat),
                "p_value": float(p_val),
                "significant": bool(p_val < 0.05),
                "interpretation": (
                    "La dispersión de los errores de predicción difiere significativamente (comportamiento de error inestable)."
                    if p_val < 0.05 else
                    "Las variaciones de error son equivalentes. Se sugiere preferir el modelo más liviano y simple."
                )
            })

    output_data = {
        "metrics": summary_metrics,
        "kolmogorov_smirnov": ks_results,
        "mann_whitney": mw_results,
        "levene": levene_results
    }

    # Save to file
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=4, ensure_ascii=False)
        
    print(f"Stats cache JSON saved successfully to {OUTPUT_FILE}")

if __name__ == '__main__':
    main()
