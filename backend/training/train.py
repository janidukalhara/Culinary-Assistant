from __future__ import annotations

import argparse
from pathlib import Path

from ultralytics import YOLO


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train a custom YOLOv8 fridge-ingredient detector."
    )
    parser.add_argument(
        "--data",
        default="training/dataset.yaml",
        help="Path to a YOLO dataset YAML file.",
    )
    parser.add_argument(
        "--model",
        default="yolov8n.pt",
        help="Starting Ultralytics YOLO weights.",
    )
    parser.add_argument("--epochs", type=int, default=50)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=8)
    parser.add_argument("--device", default="cpu")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    data_path = Path(args.data)

    if not data_path.exists():
        raise FileNotFoundError(
            f"Dataset config not found: {data_path}. "
            "Copy dataset.yaml.example to dataset.yaml and update its paths."
        )

    model = YOLO(args.model)
    results = model.train(
        data=str(data_path),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        device=args.device,
        project="runs",
        name="fridge-ingredients",
    )

    print("Training completed.")
    print(f"Results directory: {results.save_dir}")
    print("Use runs/fridge-ingredients/weights/best.pt as YOLO_MODEL_PATH.")


if __name__ == "__main__":
    main()
