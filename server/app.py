from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
from ultralytics import YOLO
from pymongo import MongoClient
import os

app = Flask(__name__)
CORS(app)

# Load YOLOv8 model
yolo_model = YOLO("yolov8n.pt")


@app.route('/detect', methods=['POST'])
def object_and_defect_detect():
    try:
        # Check if image file is provided
        if 'image' not in request.files:
            return jsonify({"error": "No image provided"}), 400

        file = request.files['image']
        npimg = np.frombuffer(file.read(), np.uint8)
        frame = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({"error": "Invalid image"}), 400

        # Run YOLOv8 inference
        yolo_results = yolo_model.predict(frame, verbose=False)[0]

        # Extract object labels
        object_classes = yolo_results.boxes.cls.cpu().numpy()
        objects = list(set([yolo_results.names[int(cls)] for cls in object_classes]))

        # Defect detection logic
        defect_keywords = {"crack", "leak"}  # Can be extended
        defect_detected = any(obj in defect_keywords for obj in objects)

        return jsonify({
            "objects": objects,
            "defect": defect_detected
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route("/upload", methods=["POST"])
def upload_files():
    results = []
    files = request.files.getlist("files")
    for file in files[:10]:  # ensure max 10
        file_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        detections = yolo_model(img)
        labels = detections[0].names
        result_objects = [labels[int(cls)] for cls in detections[0].boxes.cls]
        defect = any(obj in ["crack", "defect", "broken"] for obj in result_objects)

        results.append({
            "filename": file.filename,
            "objects": result_objects,
            "defect": defect
        })

    return jsonify({"results": results})

if __name__ == '__main__':
    app.run(debug=True)
