import os
import pickle
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

# ------------------------
# 📂 Rutas
# ------------------------
BASE_DIR = r'c:\Users\LENOVO\Downloads\17. sistema\hoja_maiz'
REPORTS_DIR = os.path.join(BASE_DIR, 'Reports')

# Cargar resultados
with open(os.path.join(REPORTS_DIR, 'resultados_entrenamiento.pkl'), 'rb') as f:
    all_results = pickle.load(f)

model_names = list(all_results.keys())

# ------------------------
# 📊 1. Reporte de texto completo
# ------------------------
report_text = "="*80 + "\n"
report_text += "REPORTE DE ENTRENAMIENTO Y COMPARACIÓN DE MODELOS\n"
report_text += "="*80 + "\n\n"

for model_name in model_names:
    res = all_results[model_name]
    report_text += f"\n{'-'*80}\n"
    report_text += f"MODELO: {model_name}\n"
    report_text += f"{'-'*80}\n"
    report_text += f"Tiempo de entrenamiento: {res['duration']:.2f} segundos ({res['duration']/60:.2f} minutos)\n"
    report_text += f"Épocas completadas: {len(res['history']['accuracy'])}\n"
    report_text += f"Mejor precisión en entrenamiento: {max(res['history']['accuracy']):.4f}\n"
    report_text += f"Mejor precisión en validación: {max(res['history']['val_accuracy']):.4f}\n\n"
    report_text += "Reporte de clasificación detallado:\n"
    
    # Agregar el classification report
    cr = res['classification_report']
    for class_name in res['class_names']:
        if class_name in cr:
            report_text += f"\nClase: {class_name}\n"
            report_text += f"  Precisión: {cr[class_name]['precision']:.4f}\n"
            report_text += f"  Recall: {cr[class_name]['recall']:.4f}\n"
            report_text += f"  F1-Score: {cr[class_name]['f1-score']:.4f}\n"
            report_text += f"  Soporte: {cr[class_name]['support']}\n"
    
    if 'accuracy' in cr:
        report_text += f"\nPrecisión general: {cr['accuracy']:.4f}\n"

# Guardar reporte de texto
with open(os.path.join(REPORTS_DIR, 'reporte_completo.txt'), 'w', encoding='utf-8') as f:
    f.write(report_text)

print("✅ Reporte de texto guardado.")

# ------------------------
# 📈 2. Gráfica de comparación de precisión
# ------------------------
plt.figure(figsize=(12, 6))
colors = ['#1f77b4', '#ff7f0e', '#2ca02c']

for i, model_name in enumerate(model_names):
    res = all_results[model_name]
    plt.plot(res['history']['val_accuracy'], label=f'{model_name} (val)', color=colors[i], linewidth=2)
    plt.plot(res['history']['accuracy'], label=f'{model_name} (train)', color=colors[i], linestyle='--', linewidth=1.5)

plt.title('Comparación de Precisión entre Modelos', fontsize=14)
plt.xlabel('Época', fontsize=12)
plt.ylabel('Precisión', fontsize=12)
plt.legend(fontsize=10)
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(os.path.join(REPORTS_DIR, 'comparacion_precision.png'), dpi=300)
plt.close()

print("✅ Gráfica de comparación de precisión guardada.")

# ------------------------
# 📊 3. Gráfica de comparación de pérdida
# ------------------------
plt.figure(figsize=(12, 6))

for i, model_name in enumerate(model_names):
    res = all_results[model_name]
    plt.plot(res['history']['val_loss'], label=f'{model_name} (val)', color=colors[i], linewidth=2)
    plt.plot(res['history']['loss'], label=f'{model_name} (train)', color=colors[i], linestyle='--', linewidth=1.5)

plt.title('Comparación de Pérdida entre Modelos', fontsize=14)
plt.xlabel('Época', fontsize=12)
plt.ylabel('Pérdida', fontsize=12)
plt.legend(fontsize=10)
plt.grid(True, alpha=0.3)
plt.tight_layout()
plt.savefig(os.path.join(REPORTS_DIR, 'comparacion_perdida.png'), dpi=300)
plt.close()

print("✅ Gráfica de comparación de pérdida guardada.")

# ------------------------
# 🏆 4. Gráfica de barras: Mejor precisión vs Tiempo
# ------------------------
best_val_acc = [max(all_results[m]['history']['val_accuracy']) for m in model_names]
train_times = [all_results[m]['duration']/60 for m in model_names]  # en minutos

x = np.arange(len(model_names))
width = 0.35

fig, ax1 = plt.subplots(figsize=(12, 6))

bar1 = ax1.bar(x - width/2, best_val_acc, width, label='Mejor Precisión (Validación)', color=colors, alpha=0.8)
ax1.set_xlabel('Modelos', fontsize=12)
ax1.set_ylabel('Precisión', fontsize=12, color='#1f77b4')
ax1.tick_params(axis='y', labelcolor='#1f77b4')
ax1.set_xticks(x)
ax1.set_xticklabels(model_names, rotation=0)
ax1.set_ylim([0, 1])

ax2 = ax1.twinx()
bar2 = ax2.bar(x + width/2, train_times, width, label='Tiempo de Entrenamiento (min)', color=['#aec7e8', '#ffbb78', '#98df8a'], alpha=0.6)
ax2.set_ylabel('Tiempo (minutos)', fontsize=12, color='#ff7f0e')
ax2.tick_params(axis='y', labelcolor='#ff7f0e')

plt.title('Comparación: Mejor Precisión vs Tiempo de Entrenamiento', fontsize=14)
fig.tight_layout()

# Agregar valores en las barras
def add_labels(bars, ax):
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2., height,
                f'{height:.4f}' if ax == ax1 else f'{height:.2f}',
                ha='center', va='bottom', fontsize=10)

add_labels(bar1, ax1)
add_labels(bar2, ax2)

plt.savefig(os.path.join(REPORTS_DIR, 'comparacion_precision_tiempo.png'), dpi=300)
plt.close()

print("✅ Gráfica de barras guardada.")

# ------------------------
# 📊 5. Matrices de confusión combinadas
# ------------------------
fig, axes = plt.subplots(1, 3, figsize=(18, 5))

for i, model_name in enumerate(model_names):
    res = all_results[model_name]
    cm = res['confusion_matrix']
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=res['class_names'], 
                yticklabels=res['class_names'],
                ax=axes[i])
    axes[i].set_title(f'Matriz de Confusión - {model_name}', fontsize=12)
    axes[i].set_xlabel('Predicho', fontsize=10)
    axes[i].set_ylabel('Real', fontsize=10)
    axes[i].tick_params(axis='x', rotation=45, labelsize=8)
    axes[i].tick_params(axis='y', rotation=0, labelsize=8)

plt.tight_layout()
plt.savefig(os.path.join(REPORTS_DIR, 'matrices_confusion_combinadas.png'), dpi=300, bbox_inches='tight')
plt.close()

print("✅ Matrices de confusión combinadas guardadas.")

print("\n🎉 Todos los reportes han sido generados exitosamente en la carpeta Reports!")
