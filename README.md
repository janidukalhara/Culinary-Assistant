# Culinary Assistant – YOLO-Based Fridge Ingredient Detection & Recipe Recommendation

A full-stack Computer Vision project that detects food ingredients in refrigerator images with **YOLO + OpenCV**, serves inference through a **FastAPI REST API**, and sends the detected ingredient list to **Gemini** to generate practical recipe recommendations.

## What changed from the original project

The original Culinary Assistant sent the uploaded fridge image directly to Gemini for image understanding. This version changes the core workflow to:

```text
Fridge image
   ↓
React upload UI
   ↓
FastAPI /api/detect
   ↓
YOLO object detection
   ↓
OpenCV annotated image + bounding boxes + confidence scores
   ↓
Detected ingredient names
   ↓
Gemini recipe generation
   ↓
Recipes / dietary filters / favorites / shopping list / cooking assistant
```

The results view displays the YOLO annotated image, detected object labels, confidence scores, model name, detection mode, and inference time alongside recipe suggestions.

## Tech stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS
- **Computer Vision:** Ultralytics YOLO, YOLO-World / YOLOv8, OpenCV
- **Backend:** Python, FastAPI, Uvicorn, REST API
- **Generative AI:** Gemini API
- **Training:** Ultralytics YOLO custom-dataset training pipeline
- **Testing / demo:** FastAPI Swagger UI, health endpoint, Python smoke-test script

## Frontend design

The kitchen interface uses a cream and forest-green palette, a locally rendered SVG fridge illustration, floating accents, staged scan feedback, and animated recipe cards. It adapts to desktop, tablet, and mobile and honours `prefers-reduced-motion`.

- Preview, replace, or remove a JPG/PNG/WebP photo before starting a scan (10 MB frontend limit).
- Open saved recipes and the shopping list directly from the navigation.
- Inspect real YOLO bounding boxes, ingredients, inference time, and expandable confidence details.
- Keep detection results if recipe generation fails, then retry recipes without repeating detection.
- Use keyboard-accessible upload controls, recipe actions, dietary checkboxes, and collection tabs.
- Styles and the illustration are bundled locally; there is no Tailwind CDN or external image dependency.

To update an existing laptop checkout, run these commands from the project folder (commit or stash your own changes first if Git reports a conflict):

```powershell
git pull --ff-only origin main
npm ci
npm run dev
```

Keep the FastAPI backend running in its separate terminal. Existing `.env.local` and `backend/.env` settings still apply. Without a Gemini key, the frontend can open and show YOLO results, but recipe generation needs the key.

Frontend validation:

```powershell
npm run typecheck
npm run build
```

## YOLO modes

The backend supports three modes through `backend/.env`:

| Mode | Purpose | Default model |
| --- | --- | --- |
| `world` | Quick fridge demo with food prompts and bounding boxes | `yolov8s-worldv2.pt` |
| `standard` | Standard COCO YOLOv8 demo with limited food classes | `yolov8n.pt` |
| `custom` | Your own trained fridge-ingredient dataset | `backend/models/best.pt` |

For an interview where you are asked about **your dataset and training results**, use **custom mode** after training your own dataset. Do not claim custom-training metrics until you have actually trained and evaluated the model.

## Project structure

```text
Culinary-Assistant/
├── App.tsx
├── components/
│   ├── DetectionResults.tsx
│   ├── ImageUploader.tsx
│   └── ...
├── services/
│   ├── geminiService.ts
│   └── yoloService.ts
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── models/
│   └── training/
│       ├── train.py
│       ├── evaluate.py
│       └── dataset.yaml.example
├── .env.example
└── package.json
```

# Run locally on Windows

## 1. Prerequisites

Install:

- **Node.js 20 or 22**
- **Python 3.10 or 3.11**
- Git
- A Gemini API key

CPU inference works. A CUDA GPU is optional and mainly useful for faster custom training.

## 2. Clone and open the project

```powershell
git clone https://github.com/janidukalhara/Culinary-Assistant.git
cd Culinary-Assistant
```

If the YOLO upgrade is still on the feature branch:

```powershell
git checkout feature/yolo-fridge-detection
```

## 3. Set up the FastAPI + YOLO backend

From the project root:

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```

The default `backend/.env` uses YOLO-World:

```env
YOLO_MODE=world
YOLO_CONFIDENCE=0.25
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

Start FastAPI:

```powershell
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

On the first YOLO run, Ultralytics may download the selected pretrained weights.

Open:

- API docs: `http://localhost:8000/docs`
- Health: `http://localhost:8000/health`

Keep this terminal running.

## 4. Set up the React frontend

Open a second PowerShell terminal in the project root:

```powershell
npm install
Copy-Item .env.example .env.local
```

Edit `.env.local`:

```env
GEMINI_API_KEY=YOUR_REAL_GEMINI_API_KEY
VITE_YOLO_API_URL=http://localhost:8000
```

Run the frontend:

```powershell
npm run dev
```

Open:

`http://localhost:3000`

## 5. Demo workflow

1. Choose or drop a refrigerator image, preview it, then select **Find my recipes**.
2. React sends the image as `multipart/form-data` to `POST /api/detect`.
3. FastAPI decodes the image with OpenCV.
4. YOLO performs object detection.
5. The API returns:
   - class label
   - confidence score
   - bounding-box coordinates
   - unique ingredient names
   - annotated image
   - inference time
6. The frontend retains the detection result and advances to recipe generation.
7. The detected ingredient names are sent to Gemini.
8. The results view displays the detections and recipe suggestions (or a retry message if recipe generation fails).
9. Existing features such as dietary filtering, favorites, shopping list, translation, cook-time help, and chatbot remain available.

## REST API example

### Health

```http
GET /health
```

Example:

```json
{
  "status": "ok",
  "mode": "world",
  "model": "yolov8s-worldv2.pt",
  "modelLoaded": false
}
```

### Detect ingredients

```http
POST /api/detect
Content-Type: multipart/form-data
file=<image>
```

Example response shape:

```json
{
  "model": "yolov8s-worldv2.pt",
  "mode": "world",
  "confidenceThreshold": 0.25,
  "inferenceMs": 188.54,
  "detections": [
    {
      "className": "tomato",
      "confidence": 0.91,
      "box": [120.4, 86.8, 252.2, 220.1]
    }
  ],
  "ingredients": ["tomato"],
  "annotatedImage": "data:image/jpeg;base64,..."
}
```

# Train a custom fridge-ingredient YOLOv8 model

A custom model is the strongest version for an AI Engineer interview because you can explain your own dataset, class distribution, annotation process, training parameters, validation metrics, and failure cases.

## 1. Prepare a YOLO-format dataset

Recommended classes for a first version:

```text
egg
milk
cheese
tomato
potato
onion
apple
banana
carrot
broccoli
bell_pepper
chicken
```

Recommended minimum goal for a 7-day prototype:

- 12 classes
- roughly 50–100 labelled instances per class if possible
- separate train and validation images
- varied lighting, fridge shelves, object sizes, occlusion, packaging, and camera angles

Use your own photos plus a legally usable public dataset. Annotate every target object with a bounding box.

Folder structure:

```text
backend/datasets/fridge/
├── images/
│   ├── train/
│   └── val/
└── labels/
    ├── train/
    └── val/
```

Copy the example config:

```powershell
cd backend
Copy-Item training\dataset.yaml.example training\dataset.yaml
```

Update paths/classes if needed.

## 2. Train

CPU example:

```powershell
python training/train.py --data training/dataset.yaml --model yolov8n.pt --epochs 50 --imgsz 640 --batch 8 --device cpu
```

NVIDIA GPU example:

```powershell
python training/train.py --data training/dataset.yaml --model yolov8n.pt --epochs 50 --imgsz 640 --batch 16 --device 0
```

The best weights are normally generated under:

```text
backend/runs/fridge-ingredients/weights/best.pt
```

Copy them:

```powershell
Copy-Item runs\fridge-ingredients\weights\best.pt models\best.pt
```

## 3. Evaluate and record real metrics

```powershell
python training/evaluate.py --data training/dataset.yaml --model models/best.pt
```

Record the actual values printed by the script:

- Precision
- Recall
- mAP@50
- mAP@50–95

Use those real numbers in your CV/interview. Do not invent them.

## 4. Switch the API to your trained model

Edit `backend/.env`:

```env
YOLO_MODE=custom
YOLO_MODEL_PATH=models/best.pt
YOLO_CONFIDENCE=0.25
```

Restart Uvicorn.

# Interview demonstration

A clean live demo can be:

1. Show the dataset YAML and a few labelled training images.
2. Explain why YOLO was selected for real-time object detection.
3. Show the training command and saved `best.pt`.
4. Show your real validation metrics.
5. Start FastAPI and open `/docs`.
6. Upload a fridge image to `/api/detect`.
7. Show labels, confidence scores, boxes and inference time.
8. Open the React application and upload the same image.
9. Show the annotated YOLO output.
10. Explain how detected ingredients flow into Gemini recipe generation.
11. Mention failure cases such as occlusion, visually similar foods, packaging and low light.
12. Explain how you would improve the model with more labelled data, augmentation and class balancing.

# CV description

After you have actually trained, evaluated and tested the project, a truthful CV entry can be:

**Culinary Assistant – YOLO-Based Fridge Ingredient Detection & Recipe Recommendation**  
*Python, YOLOv8, OpenCV, FastAPI, Computer Vision, AI/ML, REST API, React, TypeScript*

- Developed a YOLO-based Computer Vision system to detect and identify food ingredients from refrigerator images.
- Used YOLOv8 and OpenCV for object detection, producing ingredient labels, bounding boxes and confidence scores.
- Integrated YOLO inference with a Python/FastAPI REST API for image upload and structured detection results.
- Connected detected ingredients to an AI-powered recipe recommendation workflow.
- Implemented an end-to-end flow from image upload → object detection → ingredient extraction → API processing → recipe generation.
- Evaluated the trained model using real validation metrics and tested the application using varied refrigerator images.

Replace the last bullet with your **actual dataset size, class count, mAP, precision and recall** once training is complete.

## Notes

- `world` mode is useful for a quick working prototype but is not proof that you trained your own YOLO dataset.
- `custom` mode is the recommended final interview version.
- Model weights, datasets, virtual environments and local secrets are intentionally ignored by Git.
