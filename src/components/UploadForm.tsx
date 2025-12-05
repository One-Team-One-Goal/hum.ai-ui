import React, { useState, useEffect, useRef } from "react";
import { Button } from "./Button";
import { GridLoader } from "react-spinners";
import { analyzeImage } from "../lib/api";

interface Props {
  preview?: string | null;
  onPreview: (src: string | null) => void;
  onAnalyze: (result: any) => void;
}

interface MediaDeviceInfo {
  deviceId: string;
  label: string;
}

const UploadForm: React.FC<Props> = ({
  preview = null,
  onPreview,
  onAnalyze,
}) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Camera device enumeration is handled in enableCamera function
    // This effect is kept for potential future use
  }, [cameraEnabled]);

  // Handle video stream when camera is enabled or device changes
  useEffect(() => {
    async function startStream() {
      if (cameraEnabled && selectedDevice && !preview) {
        try {
          // Stop existing stream if any
          if (stream) {
            stream.getTracks().forEach((track) => track.stop());
          }
          const constraints = {
            video: {
              deviceId: { exact: selectedDevice },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          };
          const newStream = await navigator.mediaDevices.getUserMedia(
            constraints
          );
          setStream(newStream);
          if (videoRef.current) {
            videoRef.current.srcObject = newStream;
          }
        } catch (err) {
          console.error("Error starting video stream:", err);
        }
      }
    }
    startStream();

    // Cleanup function to stop stream
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraEnabled, selectedDevice, preview]);

  // Stop stream when preview is set (image uploaded)
  useEffect(() => {
    if (preview && stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setCameraEnabled(false);
    }
  }, [preview, stream]);

  // Capture frame from video
  function captureFrame() {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        setFileName("camera-capture.png");
        setCapturedDataUrl(dataUrl);
        setSelectedFile(null);
        onPreview(dataUrl);
        // Stop the stream after capture
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
          setStream(null);
        }
      }
    }
  }

  async function enableCamera() {
    try {
      const constraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      };
      const initialStream = await navigator.mediaDevices.getUserMedia(
        constraints
      );
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices
        .filter((device) => device.kind === "videoinput")
        .map((device, index) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${index + 1}`,
        }));
      setDevices(videoDevices);

      // Use the initial stream directly instead of waiting for useEffect
      setStream(initialStream);
      if (videoRef.current) {
        videoRef.current.srcObject = initialStream;
      }

      if (videoDevices.length > 0) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
      setCameraEnabled(true);
    } catch (err) {
      console.error("Error accessing camera devices:", err);
    }
  }

  function handleFile(e: React.FormEvent<HTMLInputElement>) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      setFileName(null);
      setSelectedFile(null);
      setCapturedDataUrl(null);
      onPreview(null);
      return;
    }
    const file = input.files[0];
    setFileName(file.name);
    setSelectedFile(file);
    setCapturedDataUrl(null);
    const url = URL.createObjectURL(file);
    onPreview(url);
  }

  function handleDroppedFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please drop an image file");
      return;
    }
    setFileName(file.name);
    setSelectedFile(file);
    setCapturedDataUrl(null);
    setError(null);
    const url = URL.createObjectURL(file);
    onPreview(url);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging to false if we're leaving the drop zone entirely
    if (
      dropZoneRef.current &&
      !dropZoneRef.current.contains(e.relatedTarget as Node)
    ) {
      setIsDragging(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleDroppedFile(files[0]);
    }
  }

  async function handleAnalyze() {
    setLoading(true);
    setError(null);

    try {
      let result;
      if (capturedDataUrl) {
        // Camera capture - send as data URL
        result = await analyzeImage(
          capturedDataUrl,
          fileName || "camera-capture.png"
        );
      } else if (selectedFile) {
        // File upload
        result = await analyzeImage(selectedFile, fileName || "image.png");
      } else {
        throw new Error("No image selected");
      }

      // Add timestamp if not present
      if (!result.timestamp) {
        result.timestamp = new Date().toISOString();
      }

      onAnalyze(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      setError(message);
      console.error("Analysis error:", err);
    } finally {
      setLoading(false);
    }
  }

  const canAnalyze =
    Boolean((preview || fileName) && (selectedFile || capturedDataUrl)) &&
    !loading;

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}
      {preview ? (
        <div className="bg-primary/10 border-2 border-primary/10 rounded-xl">
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            accept="image/*"
            className="sr-only"
            onInput={handleFile}
          />
          <div className="flex flex-col bg-secondary-foreground rounded-xl min-h-111 h-full">
            <div className="border-b border-primary-foreground/30 w-full text-secondary p-2 sm:p-3 px-3 sm:px-4 font-semibold text-[10px] sm:text-xs flex flex-col md:flex-row items-start md:items-center gap-1.5 sm:gap-2 justify-between">
              <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-4 items-start md:items-center w-full md:w-auto">
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="pr-0.5 sm:pr-1 whitespace-nowrap text-[9px] sm:text-xs">
                    DEVICE:{" "}
                  </span>
                  {cameraEnabled ? (
                    <select
                      value={selectedDevice}
                      onChange={(e) =>
                        setSelectedDevice((e.target as HTMLSelectElement).value)
                      }
                      className="bg-primary text-secondary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-medium border border-secondary cursor-pointer max-w-[100px] sm:max-w-[150px]"
                    >
                      {devices.length === 0 ? (
                        <option value="">No cameras</option>
                      ) : (
                        devices.map((device) => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label}
                          </option>
                        ))
                      )}
                    </select>
                  ) : (
                    <button
                      type="button"
                      onClick={enableCamera}
                      className="bg-primary text-secondary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-medium border border-secondary cursor-pointer hover:bg-primary/80 whitespace-nowrap"
                    >
                      Enable
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <span className="pr-0.5 sm:pr-1 whitespace-nowrap text-[9px] sm:text-xs">
                    UPLOAD:{" "}
                  </span>
                  <label
                    htmlFor="file-upload"
                    className="bg-primary text-secondary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-medium border border-secondary cursor-pointer hover:bg-primary/80 whitespace-nowrap"
                  >
                    Choose
                  </label>
                </div>
              </div>
              <div className="text-secondary/50 font-normal w-full md:w-auto truncate text-[9px] sm:text-xs">
                {fileName ?? "Image loaded"}
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
              <img
                src={preview}
                alt="Preview"
                className="h-full w-4/5 object-cover rounded-lg"
                style={{ maxHeight: "100%", maxWidth: "100%" }}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2 p-3">
            <div className="text-[10px] sm:text-xs text-primary/60 px-1">
              Accuracy may vary based on image quality and lighting.
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="default"
                className="flex-1 sm:flex-none bg-secondary border border-primary text-primary rounded-full text-[10px] sm:text-xs px-3 py-1.5"
                onClick={() => {
                  setFileName(null);
                  setSelectedFile(null);
                  setCapturedDataUrl(null);
                  setError(null);
                  onPreview(null);
                }}
              >
                REMOVE
              </Button>
              <Button
                variant="default"
                className="flex-1 sm:flex-none bg-primary border border-secondary text-secondary rounded-full text-[10px] sm:text-xs px-3 py-1.5"
                onClick={handleAnalyze}
                disabled={!canAnalyze}
              >
                {loading ? "Analyzing..." : "ANALYZE"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          ref={dropZoneRef}
          className={`bg-primary/10 border-2 rounded-xl transition-colors ${
            isDragging
              ? "border-primary border-dashed bg-primary/20"
              : "border-primary/10"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <label
            htmlFor="file-upload"
            className="block text-sm font-medium text-slate-700 sr-only"
          >
            Upload image
          </label>

          <div>
            <div>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onInput={handleFile}
              />
              <div className="flex flex-col bg-secondary-foreground rounded-xl min-h-111 h-full">
                <div className="border-b border-primary-foreground/30 w-full text-secondary p-2 sm:p-3 px-3 sm:px-4 font-semibold text-[10px] sm:text-xs flex flex-col md:flex-row items-start md:items-center gap-1.5 sm:gap-2 justify-between">
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-4 items-start md:items-center w-full md:w-auto">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="pr-0.5 sm:pr-1 whitespace-nowrap text-[9px] sm:text-xs">
                        DEVICE:{" "}
                      </span>
                      {cameraEnabled ? (
                        <select
                          value={selectedDevice}
                          onChange={(e) =>
                            setSelectedDevice(
                              (e.target as HTMLSelectElement).value
                            )
                          }
                          className="bg-primary text-secondary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-medium border border-secondary cursor-pointer max-w-[100px] sm:max-w-[150px]"
                        >
                          {devices.length === 0 ? (
                            <option value="">No cameras</option>
                          ) : (
                            devices.map((device) => (
                              <option
                                key={device.deviceId}
                                value={device.deviceId}
                              >
                                {device.label}
                              </option>
                            ))
                          )}
                        </select>
                      ) : (
                        <button
                          type="button"
                          onClick={enableCamera}
                          className="bg-primary text-secondary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-medium border border-secondary cursor-pointer hover:bg-primary/80 whitespace-nowrap"
                        >
                          Enable
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="pr-0.5 sm:pr-1 whitespace-nowrap text-[9px] sm:text-xs">
                        UPLOAD:{" "}
                      </span>
                      <label
                        htmlFor="file-upload"
                        className="bg-primary text-secondary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-xl text-[10px] sm:text-xs font-medium border border-secondary cursor-pointer hover:bg-primary/80 whitespace-nowrap"
                      >
                        Choose
                      </label>
                    </div>
                  </div>
                  <div className="text-secondary/50 font-normal w-full md:w-auto truncate text-[9px] sm:text-xs">
                    {fileName ?? "No file selected"}
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-between overflow-hidden">
                  {cameraEnabled && stream ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      <div className="flex-1 flex items-center justify-center p-2 overflow-hidden">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="h-full w-4/5 object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex justify-center pb-2">
                        <button
                          type="button"
                          onClick={captureFrame}
                          className="bg-primary text-secondary px-4 py-1 rounded-xl text-xs font-medium border border-secondary cursor-pointer hover:bg-primary/80"
                        >
                          Capture Photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="file-upload"
                      className="flex-1 flex flex-col cursor-pointer justify-between"
                    >
                      <div className="text-xs p-4 text-secondary/60">
                        {isDragging
                          ? "Drop your image here..."
                          : "Drag & drop an image here, or click to upload"}
                      </div>

                      <div className="flex flex-col justify-end">
                        <div></div>
                        <div className="space-y-1">
                          <div className="flex text-sm text-primary-foreground">
                            <GridLoader
                              color="var(--secondary)"
                              size={6}
                              className="ml-4"
                            />
                            <span className="rounded-md font-medium text-secondary/60 bottom-0 p-4 text-xs">
                              Welcome to hum.ai...
                            </span>
                          </div>
                        </div>
                      </div>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-2 p-3">
            <div className="text-[10px] sm:text-xs text-primary/60 px-1">
              Accuracy may vary based on image quality and lighting.
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                variant="default"
                className="flex-1 sm:flex-none bg-secondary border border-primary text-primary rounded-full text-[10px] sm:text-xs px-3 py-1.5"
              >
                <label htmlFor="file-upload">UPLOAD</label>
              </Button>
              <Button
                variant="default"
                className="flex-1 sm:flex-none bg-primary border border-secondary text-secondary rounded-full text-[10px] sm:text-xs px-3 py-1.5"
                onClick={handleAnalyze}
                disabled={!canAnalyze}
              >
                {loading ? "Analyzing..." : "ANALYZE"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
