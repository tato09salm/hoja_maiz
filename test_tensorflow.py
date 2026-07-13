import sys
print(f"Python version: {sys.version}")
print(f"Python executable: {sys.executable}")

try:
    import tensorflow as tf
    print(f"TensorFlow version: {tf.__version__}")
    print("TensorFlow importado correctamente!")
except Exception as e:
    print(f"Error importando TensorFlow: {e}")
    import traceback
    traceback.print_exc()
