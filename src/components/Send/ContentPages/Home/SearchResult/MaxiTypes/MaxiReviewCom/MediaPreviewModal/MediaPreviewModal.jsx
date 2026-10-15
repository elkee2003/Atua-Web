import { useCallback, useEffect, useRef, useState } from "react";
import "./MediaPreviewModal.css";

export default function MediaPreviewModal({
  visible,
  mediaList = [],
  initialIndex = 0,
  onClose,
  onDelete,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const pagerRef = useRef(null);
  const videoRefs = useRef([]);

  useEffect(() => {
    setCurrentIndex(initialIndex);

    if (visible) {
      requestAnimationFrame(() => {
        if (pagerRef.current) {
          pagerRef.current.scrollTo({
            left: Math.max(0, initialIndex) * pagerRef.current.clientWidth,
            behavior: "auto",
          });
        }
      });
    }
  }, [initialIndex, visible, mediaList.length]);

  const scrollToIndex = useCallback(
    (index) => {
      const boundedIndex = Math.min(Math.max(index, 0), mediaList.length - 1);

      if (boundedIndex < 0 || !pagerRef.current) return;

      pagerRef.current.scrollTo({
        left: boundedIndex * pagerRef.current.clientWidth,
        behavior: "smooth",
      });

      setCurrentIndex(boundedIndex);
    },
    [mediaList.length],
  );

  useEffect(() => {
    if (!visible) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
      if (event.key === "ArrowRight") scrollToIndex(currentIndex + 1);
      if (event.key === "ArrowLeft") scrollToIndex(currentIndex - 1);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [visible, currentIndex, onClose, scrollToIndex]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentIndex) {
        video.pause();
      }
    });
  }, [currentIndex]);

  const handleDelete = () => {
    onDelete?.(currentIndex);
    onClose?.();
  };

  const handlePagerScroll = (event) => {
    const element = event.currentTarget;

    const nextIndex = Math.round(
      element.scrollLeft / Math.max(element.clientWidth, 1),
    );

    if (nextIndex !== currentIndex) {
      setCurrentIndex(nextIndex);
    }
  };

  if (!visible) return null;

  return (
    <div
      className="mediaPreviewModalOverlay"
      role="dialog"
      aria-modal="true"
      aria-label="Media preview"
    >
      <div className="mediaPreviewModalContainer">
        <div className="mediaPreviewModalTopBar">
          <button
            type="button"
            className="mediaPreviewModalIconButton mediaPreviewModalDeleteButton"
            onClick={handleDelete}
            aria-label="Delete current media"
            title="Delete"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 6h18M8 6V4h8v2m-11 0 1 14h12l1-14M10 10v6m4-6v6" />
            </svg>
          </button>

          <button
            type="button"
            className="mediaPreviewModalIconButton mediaPreviewModalCloseButton"
            onClick={onClose}
            aria-label="Close media preview"
            title="Close"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div
          className="mediaPreviewModalPager"
          ref={pagerRef}
          onScroll={handlePagerScroll}
          aria-live="polite"
        >
          {mediaList.map((item, index) => (
            <div
              className="mediaPreviewModalPage"
              key={`${item.uri ?? "media"}-${index}`}
            >
              {item.type === "photo" ? (
                <img
                  className="mediaPreviewModalFullImage"
                  src={item.uri}
                  alt={`Media preview ${index + 1}`}
                  draggable="false"
                />
              ) : (
                <video
                  ref={(element) => {
                    videoRefs.current[index] = element;
                  }}
                  className="mediaPreviewModalFullVideo"
                  src={item.uri}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label={`Video preview ${index + 1}`}
                />
              )}
            </div>
          ))}
        </div>

        {mediaList.length > 1 && (
          <div className="mediaPreviewModalCounter">
            {currentIndex + 1} / {mediaList.length}
          </div>
        )}
      </div>
    </div>
  );
}
