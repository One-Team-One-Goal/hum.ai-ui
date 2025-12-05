const API_BASE_URL = "http://localhost:8000";

export interface AnalysisResult {
  grade: string | null;
  headRicePercent: string;
  brokenPercent: string;
  discoloredPercent: string;
  foreignObjects: number;
  totalGrains: number;
  counts: {
    whole: number;
    broken: number;
    discolored: number;
    foreign: number;
  };
  timestamp?: string;
  modelVersion?: string;
  filename?: string;
  error?: string;
}

/**
 * Convert a data URL (base64) to a File object
 */
function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : "image/png";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

/**
 * Analyze a rice grain image by sending it to the backend API.
 * Accepts either a File object or a data URL string (for camera captures).
 */
export async function analyzeImage(
  imageInput: File | string,
  filename: string = "image.png"
): Promise<AnalysisResult> {
  const formData = new FormData();

  if (typeof imageInput === "string") {
    // It's a data URL from camera capture
    const file = dataURLtoFile(imageInput, filename);
    formData.append("image", file);
  } else {
    // It's already a File object
    formData.append("image", imageInput);
  }

  const response = await fetch(`${API_BASE_URL}/api/analyze/physical`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error: ${response.status}`);
  }

  return response.json();
}

/**
 * Interface for annotated image detection results
 */
export interface Detection {
  id: number;
  label: string;
  confidence: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
    x2: number;
    y2: number;
  };
}

export interface AnnotatedImageResult {
  imageWidth: number;
  imageHeight: number;
  totalDetections: number;
  detections: Detection[];
  timestamp?: string;
  filename?: string;
}

/**
 * Get annotated image with bounding box coordinates for detected grains.
 * Accepts either a File object or a data URL string (for camera captures).
 */
export async function getAnnotatedImage(
  imageInput: File | string,
  filename: string = "image.png"
): Promise<AnnotatedImageResult> {
  const formData = new FormData();

  if (typeof imageInput === "string") {
    // It's a data URL from camera capture
    const file = dataURLtoFile(imageInput, filename);
    formData.append("image", file);
  } else {
    // It's already a File object
    formData.append("image", imageInput);
  }

  const response = await fetch(`${API_BASE_URL}/api/analyze/physical/annotated`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error: ${response.status}`);
  }

  return response.json();
}

/**
 * Check if the backend API is healthy
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
