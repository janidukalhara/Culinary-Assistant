import { DetectionResult } from '../types';

const API_BASE_URL = (import.meta as any).env?.VITE_YOLO_API_URL || 'http://localhost:8000';

export const detectFridgeIngredients = async (image: File): Promise<DetectionResult> => {
  const formData = new FormData();
  formData.append('file', image);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/detect`, {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    throw new Error(
      'Could not connect to the YOLO FastAPI backend. Make sure it is running on http://localhost:8000.'
    );
  }

  if (!response.ok) {
    let message = 'YOLO object detection failed.';
    try {
      const body = await response.json();
      message = body?.detail || body?.message || message;
    } catch {
      // Keep the default message when the response is not JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<DetectionResult>;
};

export const getYoloHealth = async () => {
  const response = await fetch(`${API_BASE_URL}/health`);
  if (!response.ok) {
    throw new Error('YOLO backend health check failed.');
  }
  return response.json();
};
