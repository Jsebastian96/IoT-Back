import cv2
import numpy as np
import time
import urllib.request
import base64
import requests

# URL de la cámara IP Webcam para capturar snapshots
camera_ip = 'http://100.80.135.214:8080/shot.jpg'
server_url = 'https://iot-back-production.up.railway.app/image'  # URL del servidor para recibir imágenes

latitude = None
longitude = None

def get_gps_location():
    global latitude, longitude
    try:
        response = requests.get('http://<tu_proyecto_railway>.railway.app/gps')  # URL para obtener la última localización
        data = response.json()
        latitude = data['latitude']
        longitude = data['longitude']
    except Exception as e:
        print(f"Error al obtener la localización: {e}")

def detect_pothole(frame):
    """Detectar huecos en la vía en el frame proporcionado."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)

    contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    for contour in contours:
        area = cv2.contourArea(contour)
        print(f"Área detectada: {area}")
        if area > 500:
            x, y, w, h = cv2.boundingRect(contour)
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            return True, frame

    return False, frame

def capture_and_process_image():
    while True:
        try:
            with urllib.request.urlopen(camera_ip) as url:
                img_arr = np.array(bytearray(url.read()), dtype=np.uint8)
                frame = cv2.imdecode(img_arr, -1)

            detected, processed_frame = detect_pothole(frame)
            if detected:
                timestamp = time.strftime("%Y%m%d_%H%M%S")
                image_filename = f"pothole_{timestamp}.jpg"
                cv2.imwrite(image_filename, processed_frame)
                print(f"Hueco detectado. Imagen guardada como: {image_filename}")

                get_gps_location()

                if latitude and longitude:
                    with open(image_filename, 'rb') as img_file:
                        image_base64 = base64.b64encode(img_file.read()).decode('utf-8')
                        data = {
                            'latitude': latitude,
                            'longitude': longitude,
                            'image': image_base64
                        }
                        response = requests.post(server_url, json=data)
                        print(response.status_code, response.text)

            else:
                print("No se detectó ningún hueco")

            time.sleep(10)

        except Exception as e:
            print(f"Error al capturar la imagen: {e}")
            time.sleep(2)

if __name__ == "__main__":
    capture_and_process_image()
