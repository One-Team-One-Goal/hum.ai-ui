import React, { useState, useEffect, useRef } from "react";
import { Button } from "./Button";
import { GridLoader } from "react-spinners";

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
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function getDevices() {
      try {
        // Request permission to access camera to get device labels
        await navigator.mediaDevices.getUserMedia({ video: true });
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = allDevices
          .filter((device) => device.kind === "videoinput")
          .map((device, index) => ({
            deviceId: device.deviceId,
            label: device.label || `Camera ${index + 1}`,
          }));
        setDevices(videoDevices);
        if (videoDevices.length > 0 && !selectedDevice) {
          setSelectedDevice(videoDevices[0].deviceId);
        }
        setCameraEnabled(true);
      } catch (err) {
        console.error("Error accessing camera devices:", err);
        setCameraEnabled(false);
      }
    }
    if (cameraEnabled === false && devices.length === 0) {
      // Don't auto-request on mount, wait for user action
    }
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
      onPreview(null);
      return;
    }
    const file = input.files[0];
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    onPreview(url);
  }

  function analyzeMock() {
    setLoading(true);
    setTimeout(() => {
      // Generate realistic mock data based on PNS/BAFS-290:2019 standards
      const scenarios = [
        {
          grade: "Premium",
          headRicePercent: (97 + Math.random() * 2).toFixed(1), // 97-99%
          brokenPercent: (0.5 + Math.random() * 1.5).toFixed(1), // 0.5-2%
          chalkinessPercent: (0.5 + Math.random() * 1.5).toFixed(1), // 0.5-2%
          damagedPercent: (0.1 + Math.random() * 0.4).toFixed(1), // 0.1-0.5%
          discoloredPercent: (0.1 + Math.random() * 0.4).toFixed(1), // 0.1-0.5%
          moisture: (13.5 + Math.random() * 0.5).toFixed(1), // 13.5-14%
          confidence: (98 + Math.random() * 2).toFixed(1), // 98-100%
          modelVersion: "CNN-NIR-v1.2.3",
          notes:
            "Premium grade rice meeting highest PNS/BAFS 290:2019 standards. RGB+NIR imaging confirms minimal defects and optimal grain integrity.",
        },
        {
          grade: "Grade 1",
          headRicePercent: (92 + Math.random() * 4).toFixed(1), // 92-96%
          brokenPercent: (2 + Math.random() * 3).toFixed(1), // 2-5%
          chalkinessPercent: (1 + Math.random() * 2).toFixed(1), // 1-3%
          damagedPercent: (0.2 + Math.random() * 0.8).toFixed(1), // 0.2-1%
          discoloredPercent: (0.2 + Math.random() * 0.8).toFixed(1), // 0.2-1%
          moisture: (13.5 + Math.random() * 0.7).toFixed(1), // 13.5-14.2%
          confidence: (95 + Math.random() * 3).toFixed(1), // 95-98%
          modelVersion: "CNN-NIR-v1.2.3",
          notes:
            "Grade 1 classification per PNS/BAFS 290:2019. Acceptable grain quality with minor defects detected via NIR analysis.",
        },
        {
          grade: "Grade 2",
          headRicePercent: (85 + Math.random() * 7).toFixed(1), // 85-92%
          brokenPercent: (5 + Math.random() * 5).toFixed(1), // 5-10%
          chalkinessPercent: (2 + Math.random() * 4).toFixed(1), // 2-6%
          damagedPercent: (0.5 + Math.random() * 1.5).toFixed(1), // 0.5-2%
          discoloredPercent: (0.5 + Math.random() * 1.5).toFixed(1), // 0.5-2%
          moisture: (13.5 + Math.random() * 1).toFixed(1), // 13.5-14.5%
          confidence: (90 + Math.random() * 5).toFixed(1), // 90-95%
          modelVersion: "CNN-NIR-v1.2.3",
          notes:
            "Grade 2 per PNS/BAFS 290:2019. Moderate defects identified. CNN model detected increased broken kernels and chalkiness.",
        },
        {
          grade: "Substandard",
          headRicePercent: (65 + Math.random() * 15).toFixed(1), // 65-80%
          brokenPercent: (10 + Math.random() * 10).toFixed(1), // 10-20%
          chalkinessPercent: (5 + Math.random() * 10).toFixed(1), // 5-15%
          damagedPercent: (2 + Math.random() * 3).toFixed(1), // 2-5%
          discoloredPercent: (2 + Math.random() * 3).toFixed(1), // 2-5%
          moisture: (14 + Math.random() * 1.5).toFixed(1), // 14-15.5%
          confidence: (80 + Math.random() * 10).toFixed(1), // 80-90%
          modelVersion: "CNN-NIR-v1.2.3",
          notes:
            "Substandard classification - below PNS/BAFS 290:2019 minimum requirements. Significant defects detected via RGB+NIR imaging.",
        },
      ];

      const selectedScenario =
        scenarios[Math.floor(Math.random() * scenarios.length)];
      const res = {
        ...selectedScenario,
        timestamp: new Date().toISOString(),
      };

      setLoading(false);
      onAnalyze(res);
    }, 1200);
  }

  const canAnalyze = Boolean(preview || fileName) && !loading;

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="bg-primary/10 border-2 border-primary/10 rounded-xl">
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="sr-only"
            onInput={handleFile}
          />
          <div className="flex flex-col bg-secondary-foreground rounded-xl min-h-111 h-full">
            <div className="border-b border-primary-foreground/30 w-full text-secondary p-3 px-4 font-semibold text-xs flex items-center gap-2 justify-between">
              <div className="flex gap-4 items-center">
                <div>
                  <span className="pr-1">DEVICE INPUT: </span>
                  {cameraEnabled ? (
                    <select
                      value={selectedDevice}
                      onChange={(e) =>
                        setSelectedDevice((e.target as HTMLSelectElement).value)
                      }
                      className="bg-primary text-secondary px-2 py-1 rounded-xl text-xs font-medium border border-secondary cursor-pointer max-w-26"
                    >
                      {devices.length === 0 ? (
                        <option value="">No cameras found</option>
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
                      className="bg-primary text-secondary px-2 py-1 rounded-xl text-xs font-medium border border-secondary cursor-pointer hover:bg-primary/80"
                    >
                      Enable Camera
                    </button>
                  )}
                </div>
                <div>
                  <span className="pr-1">UPLOAD: </span>
                  <label
                    htmlFor="file-upload"
                    className="bg-primary text-secondary px-2 py-1 rounded-xl text-xs font-medium border border-secondary cursor-pointer hover:bg-primary/80"
                  >
                    Choose File
                  </label>
                </div>
              </div>
              <div className="text-secondary/50 font-normal text-center">
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
          <div className="flex justify-between">
            <div className="p-4 text-xs text-primary/60 items-center">
              Accuracy may vary based on image quality and lighting, ensure
              quality input for best results.
            </div>
            <div className="flex gap-3 p-3 justify-end">
              <Button
                variant="default"
                className="flex-1 bg-secondary border border-primary text-primary rounded-full text-xs"
                onClick={() => {
                  setFileName(null);
                  onPreview(null);
                }}
              >
                REMOVE
              </Button>
              <Button
                variant="default"
                className="flex-1 bg-primary border border-secondary text-secondary rounded-full text-xs"
                onClick={analyzeMock}
                disabled={!canAnalyze}
              >
                {loading ? "Analyzing..." : "ANALYZE"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-primary/10 border-2 border-primary/10 rounded-xl">
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
                className="sr-only"
                onInput={handleFile}
              />
              <div className="flex flex-col bg-secondary-foreground rounded-xl min-h-111 h-full">
                <div className="border-b border-primary-foreground/30 w-full text-secondary p-3 px-4 font-semibold text-xs flex items-center gap-2 justify-between">
                  <div className="flex gap-4 items-center">
                    <div>
                      <span className="pr-1">DEVICE INPUT: </span>
                      {cameraEnabled ? (
                        <select
                          value={selectedDevice}
                          onChange={(e) =>
                            setSelectedDevice(
                              (e.target as HTMLSelectElement).value
                            )
                          }
                          className="bg-primary text-secondary px-2 py-1 rounded-xl text-xs font-medium border border-secondary cursor-pointer max-w-26"
                        >
                          {devices.length === 0 ? (
                            <option value="">No cameras found</option>
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
                          className="bg-primary text-secondary px-2 py-1 rounded-xl text-xs font-medium border border-secondary cursor-pointer hover:bg-primary/80"
                        >
                          Enable Camera
                        </button>
                      )}
                    </div>
                    <div>
                      <span className="pr-1">UPLOAD: </span>
                      <label
                        htmlFor="file-upload"
                        className="bg-primary text-secondary px-2 py-1 rounded-xl text-xs font-medium border border-secondary cursor-pointer hover:bg-primary/80"
                      >
                        Choose File
                      </label>
                    </div>
                  </div>
                  <div className="text-secondary/50 font-normal text-center">
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
                        Image preview will show here
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
          <div className="flex justify-between">
            <div className="p-4 text-xs text-primary/60 items-center">
              Accuracy may vary based on image quality and lighting, ensure
              quality input for best results.
            </div>
            <div className="flex gap-3 p-3 justify-end">
              <Button
                variant="default"
                className="flex-1 bg-secondary border border-primary text-primary rounded-full text-xs"
                onClick={analyzeMock}
              >
                <label htmlFor="file-upload">
                  {loading ? "Uploading..." : "UPLOAD"}
                </label>
              </Button>
              <Button
                variant="default"
                className="flex-1 bg-primary border border-secondary text-secondary rounded-full text-xs"
                onClick={analyzeMock}
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
