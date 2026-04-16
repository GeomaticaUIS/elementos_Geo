import os
import json

# Ruta absoluta basada en el archivo .py
base_dir = os.path.dirname(os.path.abspath(__file__))
carpeta = os.path.join(base_dir, "360")

imagenes = [
    archivo for archivo in os.listdir(carpeta)
    if archivo.lower().endswith(".jpg")
]

imagenes.sort()

with open(os.path.join(base_dir, "imagenes.json"), "w") as f:
    json.dump(imagenes, f, indent=4)

print("✅ imagenes.json generado correctamente")