import cv2
import numpy as np
import time
import urllib.request
import serial
import base64
from pymongo import MongoClient

# URL de la cámara IP Webcam para capturar snapshots
camera_ip = 'http://192.168.100.121:8080/shot.jpg'
# Configuración del puerto serial para el ESP32
serial_port = 'COM3'  # Cambia esto al puerto correcto
baud_rate = 115200

# Configuración de MongoDB
MONGO_URL = "mongodb+srv://juanm:369@cluster0.ff92cnc.mongodb.net/?retryWrites=true&w=majority&appName=test"
client = MongoClient(MONGO_URL)
db = client['test']
collection = db['informes']

def detect_pothole(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)

    contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    for contour in contours:
        area = cv2.contourArea(contour)
        if area > 500:
            x, y, w, h = cv2.boundingRect(contour)
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            return True, frame

    return False, frame

def get_gps_coordinates(serial_conn):
    serial_conn.write(b"GET_GPS\n")
    time.sleep(5)  # Incrementamos el tiempo de espera
    if serial_conn.in_waiting > 0:
        data = serial_conn.read_until().decode('utf-8').strip()
        print(f"Datos recibidos del GPS: {data}")
        if "Latitud:" in data and "Longitud:" in data:
            lat = data.split(",")[0].split(":")[1].strip()
            lng = data.split(",")[1].split(":")[1].strip()
            return lat, lng
        else:
            print("GPS inválido o no disponible")
            return None, None
    else:
        print("No se recibió respuesta del GPS")
        return None, None

def capture_and_process_image():
    serial_conn = serial.Serial(serial_port, baud_rate, timeout=1)
    while True:
        try:
            with urllib.request.urlopen(camera_ip) as url:
                img_arr = np.array(bytearray(url.read()), dtype=np.uint8)
                frame = cv2.imdecode(img_arr, -1)

            detected, processed_frame = detect_pothole(frame)
            if detected:
                timestamp = time.strftime("%Y%m%d_%H%M%S")
                _, buffer = cv2.imencode('.jpg', processed_frame)
                image_base64 = base64.b64encode(buffer).decode('utf-8')
                print(f"Hueco detectado. Imagen guardada como base64")

                lat, lng = get_gps_coordinates(serial_conn)
                if lat and lng:
                    data = {
                        "timestamp": timestamp,
                        "image_base64": image_base64,
                        "latitude": lat,
                        "longitude": lng
                    }
                    collection.insert_one(data)
                    print(f"Datos guardados en MongoDB")
                else:
                    print("No se pudo obtener las coordenadas GPS")
            else:
                print("No se detectó ningún hueco")
            
            time.sleep(10)

        except Exception as e:
            print(f"Error al capturar la imagen: {e}")
            time.sleep(2)

if __name__ == "__main__":
    capture_and_process_image()