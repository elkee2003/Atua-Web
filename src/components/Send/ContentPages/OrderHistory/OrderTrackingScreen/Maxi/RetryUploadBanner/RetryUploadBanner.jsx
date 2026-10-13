import React, { useState } from "react";
import { uploadEvidence } from "../../../../../../../../utils/uploadEvidence";
import "./RetryUploadBanner.css";

const RetryUploadBanner = ({ order }) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const retryUpload = async () => {
    if (loading) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const photos =
        order?.senderPreTransferLocalPhotos?.map((uri) => ({ uri })) || [];

      const video = order?.senderPreTransferLocalVideo
        ? { uri: order.senderPreTransferLocalVideo }
        : null;

      await uploadEvidence(order, photos, video);
    } catch (error) {
      console.error("Retry upload failed:", error);
      setErrorMessage("Upload failed again. Please try once more.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="retry-upload-banner" role="status">
      <p className="retry-upload-text">
        {errorMessage || "Upload failed. Please retry."}
      </p>

      <button
        type="button"
        className="retry-upload-button"
        onClick={retryUpload}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="retry-upload-spinner" />
            Retrying...
          </>
        ) : (
          "Retry Upload"
        )}
      </button>
    </div>
  );
};

export default RetryUploadBanner;
