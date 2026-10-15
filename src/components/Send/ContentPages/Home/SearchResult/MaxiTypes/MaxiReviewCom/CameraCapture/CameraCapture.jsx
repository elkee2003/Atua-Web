import { useCallback, useEffect, useRef, useState } from "react";
import "./CameraCapture.css";

function CameraIcon({ name, className = "" }) {
  const paths = {
    close: <path d="m6 6 12 12M18 6 6 18" />,
    flash: <path d="m13 2-9 12h7l-1 8 10-12h-7l1-8Z" />,
    camera: (
      <>
        <path d="M14 4h-4L8 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-4l-2-3Z" />
        <circle cx="12" cy="14" r="4" />
      </>
    ),
    pause: (
      <>
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
      </>
    ),
    play: <path d="m7 4 14 8-14 8V4Z" />,
  };

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export default function CameraCapture({
  mode,
  onPhotoCaptured,
  onVideoCaptured,
  onClose,
}) {
  const cameraRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);
  const elapsedBeforeStartRef = useRef(0);
  const elapsedBeforePauseRef = useRef(0);
  const facingRef = useRef("environment");
  const flashRef = useRef(false);
  const mountedRef = useRef(true);

  const [permissionState, setPermissionState] = useState("requesting");
  const [permissionError, setPermissionError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [facing, setFacing] = useState("environment");
  const [flash, setFlash] = useState(false);
  const [error, setError] = useState("");

  const formatTime = (seconds) => {
    const total = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(total / 60);
    const secs = total % 60;

    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (cameraRef.current) {
      cameraRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionState("denied");
      setPermissionError(
        "Camera access is unavailable. Open this page using HTTPS or localhost in a supported browser.",
      );
      return;
    }

    setPermissionState("requesting");
    setPermissionError("");
    setError("");

    stopStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingRef.current },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: mode === "video",
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      if (cameraRef.current) {
        cameraRef.current.srcObject = stream;
        await cameraRef.current.play().catch(() => {});
      }

      setPermissionState("ready");
    } catch (err) {
      if (!mountedRef.current) return;

      setPermissionState("denied");

      if (err.name === "NotAllowedError" || err.name === "SecurityError") {
        setPermissionError(
          mode === "video"
            ? "Allow camera and microphone access in your browser settings, then try again."
            : "Allow camera access in your browser settings, then try again.",
        );
      } else if (err.name === "NotFoundError") {
        setPermissionError("No compatible camera or microphone was found.");
      } else if (err.name === "NotReadableError") {
        setPermissionError(
          "The camera could not be opened. It may already be in use by another application.",
        );
      } else {
        setPermissionError(
          err.message || "Unable to access the camera. Please try again.",
        );
      }
    }
  }, [mode, stopStream]);

  useEffect(() => {
    mountedRef.current = true;
    startCamera();

    return () => {
      mountedRef.current = false;

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }

      stopStream();
    };
  }, [startCamera, stopStream]);

  useEffect(() => {
    if (!isRecording || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      return undefined;
    }

    timerRef.current = setInterval(() => {
      const elapsed =
        elapsedBeforePauseRef.current +
        Math.floor((Date.now() - startTimeRef.current) / 1000);

      setRecordDuration(elapsed);

      if (elapsed >= 30) {
        if (recorderRef.current?.state === "recording") {
          recorderRef.current.stop();
        }
      }
    }, 250);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording, isPaused]);

  const toggleFlash = async () => {
    const track = streamRef.current?.getVideoTracks()[0];

    if (!track) return;

    const capabilities = track.getCapabilities?.();

    if (!capabilities?.torch) {
      setError("Flash is not supported by this camera or browser.");
      return;
    }

    const nextFlash = !flashRef.current;

    try {
      await track.applyConstraints({
        advanced: [{ torch: nextFlash }],
      });

      flashRef.current = nextFlash;
      setFlash(nextFlash);
      setError("");
    } catch {
      setError("Unable to change the camera flash setting.");
    }
  };

  const flipCamera = async () => {
    if (isRecording || loading) return;

    facingRef.current =
      facingRef.current === "environment" ? "user" : "environment";

    setFacing(facingRef.current);
    setFlash(false);
    flashRef.current = false;

    await startCamera();
  };

  const takePhoto = async () => {
    const video = cameraRef.current;

    if (!video || !streamRef.current || loading) return;

    if (!video.videoWidth || !video.videoHeight) {
      setError("The camera is not ready yet. Please try again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Unable to capture the photo.");
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const photoBlob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Unable to create the photo."));
          },
          "image/jpeg",
          0.7,
        );
      });

      const uri = URL.createObjectURL(photoBlob);

      onPhotoCaptured?.({
        uri,
        blob: photoBlob,
        recordedAt: new Date().toISOString(),
        width: canvas.width,
        height: canvas.height,
        type: "photo",
      });

      stopStream();
      onClose?.();
    } catch (err) {
      setError(err.message || "Unable to take the photo.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  const startRecording = async () => {
    const stream = streamRef.current;

    if (!stream || isRecording || loading) return;

    if (!window.MediaRecorder) {
      setError("Video recording is not supported by this browser.");
      return;
    }

    try {
      setError("");
      chunksRef.current = [];

      const mimeType = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type));

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
      setRecordDuration(0);

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setError("An error occurred while recording the video.");
      };

      recorder.onstop = () => {
        const finalDuration = Math.min(
          30,
          elapsedBeforePauseRef.current +
            (isPaused
              ? 0
              : Math.floor((Date.now() - startTimeRef.current) / 1000)),
        );

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "video/webm",
        });

        if (blob.size > 0) {
          const uri = URL.createObjectURL(blob);

          onVideoCaptured?.({
            uri,
            blob,
            mimeType: blob.type,
            recordedAt: new Date().toISOString(),
            duration: Math.min(30, recordDuration || finalDuration),
            type: "video",
          });
        }

        setIsRecording(false);
        setIsPaused(false);
        setRecordDuration(0);
        elapsedBeforePauseRef.current = 0;
        elapsedBeforeStartRef.current = 0;

        if (mountedRef.current) {
          stopStream();
          onClose?.();
        }
      };

      recorder.start(250);
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      setError(err.message || "Unable to start video recording.");
    }
  };

  const stopRecording = () => {
    const recorder = recorderRef.current;

    if (
      recorder &&
      (recorder.state === "recording" || recorder.state === "paused")
    ) {
      if (recorder.state === "recording") {
        elapsedBeforePauseRef.current += Math.floor(
          (Date.now() - startTimeRef.current) / 1000,
        );
      }

      recorder.stop();
    }
  };

  const togglePauseRecording = () => {
    const recorder = recorderRef.current;

    if (!recorder) return;

    if (recorder.state === "recording") {
      elapsedBeforePauseRef.current += Math.floor(
        (Date.now() - startTimeRef.current) / 1000,
      );

      recorder.pause();
      setIsPaused(true);
    } else if (recorder.state === "paused") {
      startTimeRef.current = Date.now();
      recorder.resume();
      setIsPaused(false);
    }
  };

  if (permissionState !== "ready") {
    return (
      <div className="cameraCapturePermissionContainer">
        <div className="cameraCapturePermissionContent">
          <CameraIcon name="camera" className="cameraCapturePermissionIcon" />

          <h2 className="cameraCapturePermissionTitle">
            Camera {mode === "video" ? "& Microphone " : ""}Access Needed
          </h2>

          <p className="cameraCapturePermissionSubtitle">
            Atua needs access to your camera
            {mode === "video" ? " and microphone" : ""} to{" "}
            {mode === "video" ? "record videos." : "take photos."}
            {permissionError ? ` ${permissionError}` : ""}
          </p>

          <button
            type="button"
            className="cameraCapturePermissionButton"
            onClick={startCamera}
            disabled={permissionState === "requesting"}
          >
            {permissionState === "requesting"
              ? "Opening camera..."
              : "Grant Permission"}
          </button>

          <button
            type="button"
            className="cameraCapturePermissionButton"
            onClick={onClose}
            style={{ marginTop: 12, background: "#e5e7eb", color: "#111" }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cameraCaptureContainer">
      <video
        ref={cameraRef}
        className="cameraCaptureCamera"
        autoPlay
        muted
        playsInline
      />

      <div className="cameraCaptureTopBar">
        <button
          type="button"
          className="cameraCaptureTopIcon"
          onClick={() => {
            if (isRecording) stopRecording();
            else {
              stopStream();
              onClose?.();
            }
          }}
          aria-label="Close camera"
          title="Close"
        >
          <CameraIcon name="close" />
        </button>

        {mode === "video" && isRecording && (
          <div className="cameraCaptureRecordingBadge">
            <span className="cameraCaptureRedDot" />
            {isPaused ? "PAUSED" : "REC"}
          </div>
        )}

        {mode === "video" && isRecording && (
          <span className="cameraCaptureTimerText">
            {formatTime(recordDuration)}
          </span>
        )}

        <div className="cameraCaptureTopControls">
          <button
            type="button"
            className="cameraCaptureTopIcon"
            onClick={toggleFlash}
            disabled={isRecording}
            aria-label={flash ? "Turn flash off" : "Turn flash on"}
            title="Flash"
          >
            <CameraIcon name="flash" />
          </button>

          <button
            type="button"
            className="cameraCaptureTopIcon"
            onClick={flipCamera}
            disabled={isRecording || loading}
            aria-label="Switch camera"
            title="Switch camera"
          >
            <CameraIcon name="camera" />
          </button>
        </div>
      </div>

      {error && (
        <p className="cameraCaptureError" role="alert">
          {error}
        </p>
      )}

      <div className="cameraCaptureBottomBar">
        {mode === "photo" ? (
          <button
            type="button"
            className="cameraCaptureCaptureButton"
            onClick={takePhoto}
            disabled={loading}
            aria-label="Take photo"
          >
            {loading ? (
              <span aria-label="Capturing">...</span>
            ) : (
              <span className="cameraCaptureInnerCircle" />
            )}
          </button>
        ) : (
          <div className="cameraCaptureBottomControls">
            {!isRecording ? (
              <button
                type="button"
                className="cameraCaptureCaptureButton"
                onClick={startRecording}
                aria-label="Start recording"
              >
                <span className="cameraCaptureRecordCircle" />
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="cameraCaptureCaptureButton cameraCaptureRecordingButton"
                  onClick={stopRecording}
                  aria-label="Stop recording"
                >
                  <span className="cameraCaptureStopSquare" />
                </button>

                <button
                  type="button"
                  className="cameraCapturePauseButton"
                  onClick={togglePauseRecording}
                  aria-label={isPaused ? "Resume recording" : "Pause recording"}
                >
                  <CameraIcon name={isPaused ? "play" : "pause"} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
