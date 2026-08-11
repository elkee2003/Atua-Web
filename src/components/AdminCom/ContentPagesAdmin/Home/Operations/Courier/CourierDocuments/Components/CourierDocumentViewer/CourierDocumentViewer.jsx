import React, { useEffect } from "react";

import { FaTimes, FaExpand, FaDownload, FaFileImage } from "react-icons/fa";

import "./CourierDocumentViewer.css";

function CourierDocumentViewer({
  isOpen = false,
  imageUrl = null,
  title = "Document Viewer",
  description = "",
  imageAlt = "Document",
  onClose,
}) {
  /*
  ==========================================================
  CLOSE ON ESCAPE
  ==========================================================
  */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  /*
  ==========================================================
  PREVENT BODY SCROLL
  ==========================================================
  */

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  /*
  ==========================================================
  DO NOT RENDER
  ==========================================================
  */

  if (!isOpen) {
    return null;
  }

  /*
  ==========================================================
  CLOSE HANDLER
  ==========================================================
  */

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  /*
  ==========================================================
  DOWNLOAD
  ==========================================================
  */

  const handleDownload = async () => {
    if (!imageUrl) {
      return;
    }

    try {
      const response = await fetch(imageUrl);

      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = blobUrl;

      link.download = "courier-document";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Unable to download document:", error);

      /*
        ------------------------------------------------------
        Fallback: open the image directly.
        ------------------------------------------------------
        */

      window.open(imageUrl, "_blank", "noopener,noreferrer");
    }
  };

  /*
  ==========================================================
  OPEN IMAGE IN NEW TAB
  ==========================================================
  */

  const handleOpenOriginal = () => {
    if (!imageUrl) {
      return;
    }

    window.open(imageUrl, "_blank", "noopener,noreferrer");
  };

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <div
      className="courierDocumentViewer"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={handleOverlayClick}
    >
      {/* ==================================================
          TOP BAR
      ================================================== */}

      <div className="courierDocumentViewer-top">
        <div className="courierDocumentViewer-heading">
          <div className="courierDocumentViewer-headingIcon">
            <FaFileImage />
          </div>

          <div className="courierDocumentViewer-headingText">
            <h2>{title}</h2>

            {description && <p>{description}</p>}
          </div>
        </div>

        <div className="courierDocumentViewer-actions">
          {/* ==================================================
              OPEN ORIGINAL
          ================================================== */}

          {imageUrl && (
            <button
              type="button"
              className="courierDocumentViewer-actionButton"
              onClick={handleOpenOriginal}
              title="Open original image"
              aria-label="Open original image"
            >
              <FaExpand />

              <span>Open</span>
            </button>
          )}

          {/* ==================================================
              DOWNLOAD
          ================================================== */}

          {imageUrl && (
            <button
              type="button"
              className="courierDocumentViewer-actionButton"
              onClick={handleDownload}
              title="Download document"
              aria-label="Download document"
            >
              <FaDownload />

              <span>Download</span>
            </button>
          )}

          {/* ==================================================
              CLOSE
          ================================================== */}

          <button
            type="button"
            className="courierDocumentViewer-closeButton"
            onClick={onClose}
            title="Close document viewer"
            aria-label="Close document viewer"
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* ==================================================
          DOCUMENT AREA
      ================================================== */}

      <div className="courierDocumentViewer-content">
        {imageUrl ? (
          <div className="courierDocumentViewer-imageContainer">
            <img
              src={imageUrl}
              alt={imageAlt}
              className="courierDocumentViewer-image"
            />
          </div>
        ) : (
          <div className="courierDocumentViewer-empty">
            <div className="courierDocumentViewer-emptyIcon">
              <FaFileImage />
            </div>

            <h3>No Document Available</h3>

            <p>There is no document image available to display.</p>

            <button
              type="button"
              className="courierDocumentViewer-emptyButton"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* ==================================================
          BOTTOM INFORMATION
      ================================================== */}

      {imageUrl && (
        <div className="courierDocumentViewer-bottom">
          <span>
            Press <strong>ESC</strong> to close
          </span>

          <span>Click outside the document to close</span>
        </div>
      )}
    </div>
  );
}

export default CourierDocumentViewer;
