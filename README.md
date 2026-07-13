🌽 Sistema de Detección de Enfermedades en Hojas de Maíz

📋 Descripción General

Este proyecto implementa un sistema inteligente de diagnóstico fitosanitario que utiliza Deep Learning para detectar automáticamente enfermedades en hojas de maíz. El sistema emplea tres modelos de redes neuronales convolucionales entrenados mediante transfer learning para proporcionar diagnósticos precisos y confiables.


El sistema utiliza tres modelos de Deep Learning entrenados independientemente:

1. MobileNetV2

2. ResNet50

3. EfficientNetB0


El sistema puede identificar 4 clases principales:

1. Sano: Hojas sin signos de enfermedad

2. Tizón del Norte: Lesiones alargadas causadas por Exserohilum turcicum

3. Roña Común: Pústulas rojizas por Puccinia sorghi

4. Mancha Gris: Manchas rectangulares por Cercospora zeae-maydis


------------------
venv\Scripts\activate

streamlit run app.py
----------------------------------
py -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

python -m streamlit run app.py
