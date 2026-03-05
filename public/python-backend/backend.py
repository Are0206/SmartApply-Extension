"""
SmartApply - Backend Python (Flask)
POC: Extension de navegador para autocompletar formularios

Ejecutar:
  pip install flask flask-cors
  python backend.py
  -> http://localhost:5000
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import copy

app = Flask(__name__)
CORS(app)

# --- Datos en memoria ---

DEFAULT_PROFILE = {
    "id": "usr_001",
    "nombre": "Carlos",
    "apellido": "Martinez",
    "email": "carlos.martinez@email.com",
    "telefono": "+506 8888-1234",
    "linkedin": "linkedin.com/in/carlosmartinez",
    "portfolio": "carlosmartinez.dev",
    "ubicacion": "San Jose, Costa Rica",
    "titulo_profesional": "Ingeniero de Software",
    "resumen": "Ingeniero de software con 3 anos de experiencia en React, Node.js y Python.",
    "habilidades": ["JavaScript", "Python", "React", "Node.js", "SQL", "Git"],
    "createdAt": datetime.now().isoformat(),
    "updatedAt": datetime.now().isoformat(),
}

profile = copy.deepcopy(DEFAULT_PROFILE)
logs = []
log_id = 0


# --- Rutas ---

@app.route("/api/profile", methods=["GET"])
def get_profile():
    return jsonify({"success": True, "data": profile})


@app.route("/api/profile", methods=["PUT"])
def update_profile():
    global profile
    data = request.get_json()
    for k, v in data.items():
        if k in profile:
            profile[k] = v
    profile["updatedAt"] = datetime.now().isoformat()
    return jsonify({"success": True, "data": profile})


@app.route("/api/logs", methods=["GET"])
def get_logs():
    return jsonify({"success": True, "data": sorted(logs, key=lambda x: x["timestamp"], reverse=True)})


@app.route("/api/logs", methods=["POST"])
def add_log():
    global log_id
    data = request.get_json()
    if data.get("action") == "clear":
        logs.clear()
        return jsonify({"success": True})
    log_id += 1
    entry = {
        "id": f"log_{log_id:03d}",
        "action": data.get("action", ""),
        "details": data.get("details", ""),
        "fields": data.get("fields", []),
        "timestamp": datetime.now().isoformat(),
        "status": data.get("status", "completado"),
    }
    logs.append(entry)
    return jsonify({"success": True, "data": entry})


if __name__ == "__main__":
    print("SmartApply Backend -> http://localhost:5000")
    app.run(debug=True, port=5000)
