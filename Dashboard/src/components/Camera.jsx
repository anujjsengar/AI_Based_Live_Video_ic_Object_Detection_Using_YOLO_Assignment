import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

const Camera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [popupData, setPopupData] = useState(null);

  useEffect(() => {
    const getVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        streamVideoToBackend();
      } catch (err) {
        console.error("Error accessing webcam:", err);
      }
    };

    getVideo();
  }, []);

  const streamVideoToBackend = () => {
    const interval = setInterval(async () => {
      if (videoRef.current && canvasRef.current) {
        const context = canvasRef.current.getContext("2d");
        context.drawImage(videoRef.current, 0, 0, 640, 480);

        canvasRef.current.toBlob(async (blob) => {
          const formData = new FormData();
          formData.append("image", blob, "frame.jpg");

          try {
            const response = await axios.post(
              "http://localhost:5000/detect",
              formData
            );
            const { objects, defect } = response.data;
            setPopupData({ objects, defect });

            setTimeout(() => setPopupData(null), 3000);
          } catch (error) {
            console.error("Detection error:", error);
          }
        }, "image/jpeg");
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  return (
    <div className="flex flex-col items-center">
      <h1 className="text-xl font-bold mb-4">Live Camera Detection</h1>
      <video ref={videoRef} autoPlay playsInline width="640" height="480" className="rounded-xl shadow" />
      <canvas ref={canvasRef} width="640" height="480" style={{ display: "none" }} />

      {popupData && (
        <div className="fixed top-5 right-5 bg-white border shadow-xl rounded-xl p-4 z-50">
          <h2 className="font-semibold text-lg">Detection Result</h2>
          <p><strong>Objects:</strong> {popupData.objects.join(", ")}</p>
          <p><strong>Defect:</strong> {popupData.defect ? "Yes" : "No"}</p>
        </div>
      )}
    </div>
  );
};

export default Camera;
