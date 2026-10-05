from __future__ import annotations

import argparse
from pathlib import Path

from ultralytics import YOLO


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Evaluate a trained fridge-ingredient YOLO model.")
    parser.add_argument("--data", default="training/dataset.yaml")
    parser.add_argument("--model", default="models/best.pt")
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--device", default="cpu")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    data_path = Path(args.data)
    model_path = Path(args.model)

    if not data_path.exists():
        raise FileNotFoundError(f"Dataset YAML not found: {data_path}")
    if not model_path.exists():
        raise FileNotFoundError(f"Model weights not found: {model_path}")

    model = YOLO(str(model_path))
    metrics = model.val(data=str(data_path), imgsz=args.imgsz, device=args.device)

    print("\n=== YOLO validation metrics ===")
    print(f"Precision:  {metrics.box.mp:.4f}")
    print(f"Recall:     {metrics.box.mr:.4f}")
    print(f"mAP@50:     {metrics.box.map50:.4f}")
    print(f"mAP@50-95:  {metrics.box.map:.4f}")


if __name__ == "__main__":
    main()
