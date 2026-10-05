from __future__ import annotations

import base64
import os
import time
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

try:
    from ultralytics import YOLOWorld
except ImportError:  # Older Ultralytics releases may not expose YOLOWorld.
    YOLOWorld = None

load_dotenv()

app = FastAPI(
    title="Culinary Assistant YOLO API",
    description="YOLO-based fridge ingredient object detection API.",
    version="1.0.0",
)

allowed_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

INGREDIENT_CLASSES = [
    "egg carton",
    "milk carton",
    "cheese",
    "tomato",
    "potato",
    "onion",
    "garlic",
    "chicken",
    "fish",
    "apple",
    "banana",
    "orange",
    "carrot",
    "broccoli",
    "cucumber",
    "lettuce",
    "bell pepper",
    "chili pepper",
    "mushroom",
    "yogurt",
    "butter",
    "bread",
]

STANDARD_FOOD_CLASSES = {
    "banana",
    "apple",
    "sandwich",
    "orange",
    "broccoli",
    "carrot",
    "hot dog",
    "pizza",
    "donut",
    "cake",
}

NORMALIZED_INGREDIENT_NAMES = {
    "egg carton": "eggs",
    "milk carton": "milk",
    "bell pepper": "bell pepper",
    "chili pepper": "chili",
    "hot dog": "sausage",
}

_model: Any | None = None
_model_label = ""


def _model_settings() -> tuple[str, str]:
    mode = os.getenv("YOLO_MODE", "world").strip().lower()
    if mode not in {"world", "standard", "custom"}:
        raise RuntimeError("YOLO_MODE must be one of: world, standard, custom.")

    default_model = {
        "world": "yolov8s-worldv2.pt",
        "standard": "yolov8n.pt",
        "custom": "models/best.pt",
    }[mode]

    model_path = os.getenv("YOLO_MODEL_PATH", default_model).strip()
    return mode, model_path


def get_model() -> Any:
    global _model, _model_label

    if _model is not None:
        return _model

    mode, model_path = _model_settings()

    if mode == "custom":
        resolved = Path(model_path)
        if not resolved.is_absolute():
            resolved = Path(__file__).parent / resolved
        if not resolved.exists():
            raise RuntimeError(
                f"Custom YOLO weights were not found at {resolved}. "
                "Train a model or set YOLO_MODEL_PATH to a valid .pt file."
            )
        _model = YOLO(str(resolved))
        _model_label = resolved.name
        return _model

    if mode == "world":
        if YOLOWorld is None:
            raise RuntimeError(
                "YOLOWorld is not available in this Ultralytics version. "
                "Upgrade ultralytics or set YOLO_MODE=standard."
            )
        _model = YOLOWorld(model_path)
        _model.set_classes(INGREDIENT_CLASSES)
        _model_label = model_path
        return _model

    _model = YOLO(model_path)
    _model_label = model_path
    return _model


def _decode_image(data: bytes) -> np.ndarray:
    image_array = np.frombuffer(data, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid image.")
    return image


def _ingredient_from_class(class_name: str, mode: str) -> str | None:
    normalized_class = class_name.strip().lower()

    if mode == "standard" and normalized_class not in STANDARD_FOOD_CLASSES:
        return None

    return NORMALIZED_INGREDIENT_NAMES.get(normalized_class, normalized_class)


def run_detection(image: np.ndarray) -> dict[str, Any]:
    mode, _ = _model_settings()
    model = get_model()
    confidence_threshold = float(os.getenv("YOLO_CONFIDENCE", "0.25"))

    started = time.perf_counter()
    results = model.predict(
        source=image,
        conf=confidence_threshold,
        verbose=False,
    )
    inference_ms = (time.perf_counter() - started) * 1000

    if not results:
        raise HTTPException(status_code=500, detail="YOLO returned no inference result.")

    result = results[0]
    detections: list[dict[str, Any]] = []
    ingredients: list[str] = []

    for box in result.boxes:
        class_id = int(box.cls[0].item())
        confidence = float(box.conf[0].item())
        class_name = str(result.names[class_id])
        x1, y1, x2, y2 = [round(float(value), 2) for value in box.xyxy[0].tolist()]

        detections.append(
            {
                "className": class_name,
                "confidence": round(confidence, 4),
                "box": [x1, y1, x2, y2],
            }
        )

        ingredient = _ingredient_from_class(class_name, mode)
        if ingredient and ingredient not in ingredients:
            ingredients.append(ingredient)

    annotated = result.plot()
    success, encoded = cv2.imencode(".jpg", annotated)
    annotated_image = ""
    if success:
        encoded_base64 = base64.b64encode(encoded.tobytes()).decode("utf-8")
        annotated_image = f"data:image/jpeg;base64,{encoded_base64}"

    return {
        "model": _model_label,
        "mode": mode,
        "confidenceThreshold": confidence_threshold,
        "inferenceMs": round(inference_ms, 2),
        "detections": detections,
        "ingredients": ingredients,
        "annotatedImage": annotated_image,
    }


@app.get("/")
def root() -> dict[str, str]:
    return {
        "name": "Culinary Assistant YOLO API",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
def health() -> dict[str, Any]:
    mode, model_path = _model_settings()
    return {
        "status": "ok",
        "mode": mode,
        "model": model_path,
        "modelLoaded": _model is not None,
    }


@app.post("/api/detect")
async def detect(file: UploadFile = File(...)) -> dict[str, Any]:
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")

    try:
        image = _decode_image(data)
        return run_detection(image)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"YOLO detection failed: {exc}",
        ) from exc
