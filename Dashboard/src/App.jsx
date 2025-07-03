import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const App = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [popupData, setPopupData] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploadResponse, setUploadResponse] = useState([]);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamVideo();
      } catch (err) {
        console.error("Webcam access denied:", err);
      }
    };

    startCamera();
  }, []);

  const streamVideo = () => {
    const interval = setInterval(async () => {
      if (videoRef.current && canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        ctx.drawImage(videoRef.current, 0, 0, 640, 480);

        canvasRef.current.toBlob(async (blob) => {
          const formData = new FormData();
          formData.append("image", blob, "frame.jpg");

          try {
            const res = await axios.post("http://localhost:5000/detect", formData);
            const { objects, defect } = res.data;

            setPopupData({ objects, defect });
            setTimeout(() => setPopupData(null), 3000);
          } catch (err) {
            console.error("Detection error:", err);
          }
        }, "image/jpeg");
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files).slice(0, 10);
    setFiles(selected);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    const formData = new FormData();
    files.forEach((file, idx) => {
      formData.append("files", file);
    });

    try {
      const res = await axios.post("http://localhost:5000/upload", formData);
      setUploadResponse(res.data.results || []);
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex flex-col items-center justify-start p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 drop-shadow-lg">
        🎥 AI Video Monitoring System
      </h1>

      {/* Live Camera Stream */}
      <div className="relative bg-white bg-opacity-30 backdrop-blur-md border border-white/30 rounded-2xl shadow-2xl p-4">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          width="640"
          height="480"
          className="rounded-xl border-4 border-white shadow-md"
        />
      </div>

      <canvas ref={canvasRef} width="640" height="480" style={{ display: "none" }} />

      {/* File Upload Section */}
      <div className="bg-white p-4 rounded-xl shadow-md w-full max-w-xl">
        <h2 className="text-xl font-semibold mb-3">📤 Upload Videos/Images (max 10)</h2>
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileChange}
          className="mb-3"
        />
        <button
          onClick={handleUpload}
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg shadow-md transition"
        >
          Upload & Analyze
        </button>

        {/* File Preview */}
        {files.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            <strong>Selected Files:</strong>
            <ul className="list-disc ml-6">
              {files.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Popup from Live Detection */}
      {popupData && (
        <div className="fixed top-6 right-6 bg-white border border-rose-400 text-rose-700 shadow-lg rounded-xl p-5 z-50 animate-fade-in-up">
          <h2 className="font-semibold text-xl mb-2">🚨 Live Detection Alert</h2>
          <p><strong>Objects:</strong> {popupData.objects.join(", ") || "None"}</p>
          <p>
            <strong>Defect Detected:</strong>{" "}
            <span className={popupData.defect ? "text-red-600 font-bold" : "text-green-600"}>
              {popupData.defect ? "Yes" : "No"}
            </span>
          </p>
        </div>
      )}

      {/* Upload Results Display */}
      {uploadResponse.length > 0 && (
        <div className="w-full max-w-xl bg-white p-4 rounded-xl shadow-lg mt-6">
          <h2 className="text-xl font-semibold mb-3">📊 Upload Analysis Results</h2>
          {uploadResponse.map((res, index) => (
            <div key={index} className="mb-3 border-b pb-2">
              <p><strong>File {index + 1}:</strong> {res.filename}</p>
              <p><strong>Objects:</strong> {res.objects.join(", ") || "None"}</p>
              <p>
                <strong>Defect:</strong>{" "}
                <span className={res.defect ? "text-red-600 font-bold" : "text-green-600"}>
                  {res.defect ? "Yes" : "No"}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
