import React, { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { DataStore } from "aws-amplify/datastore";
import { getUrl } from "aws-amplify/storage";

import { Courier } from "../../../../../../../../models";

import "./MaxiVehicleGallery.css";

export default function MaxiVehicleGallery() {
  const [searchParams] = useSearchParams();
  const vehicleClass = searchParams.get("vehicleClass");

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  const galleryRef = useRef(null);
  const thumbnailRefs = useRef([]);
  const activePageRef = useRef(0);

  const fetchCouriers = useCallback(
    async (isCancelled) => {
      try {
        setLoading(true);
        setImages([]);
        setActivePage(0);
        activePageRef.current = 0;
        setZoomed(false);

        if (!vehicleClass) {
          return;
        }

        const result = await DataStore.query(Courier, (c) =>
          c.vehicleClass.eq(vehicleClass),
        );

        if (isCancelled()) return;

        if (result.length === 0) {
          console.log("No courier found for:", vehicleClass);
          return;
        }

        // Preserve the native behavior: use images from the first
        // courier matching the selected vehicle class.
        const vehicleImages = result[0]?.maxiImages;

        if (!Array.isArray(vehicleImages) || vehicleImages.length === 0) {
          console.log("No images available for:", vehicleClass);
          return;
        }

        const urls = [];

        for (const key of vehicleImages) {
          if (!key || isCancelled()) continue;

          try {
            const result = await getUrl({
              path: key,
              options: {
                validateObjectExistence: true,
              },
            });

            if (isCancelled()) return;

            if (result?.url) {
              urls.push(result.url.toString());
            }
          } catch (imageError) {
            console.log("Could not load image:", key, imageError);
          }
        }

        if (!isCancelled()) {
          setImages(urls);
        }
      } catch (error) {
        if (!isCancelled()) {
          console.error("Error loading vehicles:", error);
          setImages([]);
        }
      } finally {
        if (!isCancelled()) {
          setLoading(false);
        }
      }
    },
    [vehicleClass],
  );

  useEffect(() => {
    let cancelled = false;

    fetchCouriers(() => cancelled);

    return () => {
      cancelled = true;
    };
  }, [fetchCouriers]);

  const handleGalleryScroll = (event) => {
    const element = event.currentTarget;
    const pageWidth = element.clientWidth;

    if (!pageWidth) return;

    const nextPage = Math.round(element.scrollLeft / pageWidth);

    if (nextPage !== activePageRef.current) {
      activePageRef.current = nextPage;
      setActivePage(nextPage);
      setZoomed(false);
    }
  };

  const goToImage = (index) => {
    const gallery = galleryRef.current;

    if (!gallery) return;

    gallery.scrollTo({
      left: index * gallery.clientWidth,
      behavior: "smooth",
    });

    setActivePage(index);
    activePageRef.current = index;
    setZoomed(false);
  };

  const handleImageKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setZoomed((current) => !current);
    }
  };

  const formattedVehicleClass = vehicleClass
    ? vehicleClass.replace(/_/g, " ")
    : "Vehicle";

  if (loading) {
    return (
      <main className="maxiGalleryPage maxiGalleryLoadingPage">
        <div className="maxiGalleryLoader" role="status" aria-live="polite">
          <span className="maxiGallerySpinner" aria-hidden="true" />
          <p>Loading vehicle gallery...</p>
        </div>
      </main>
    );
  }

  if (images.length === 0) {
    return (
      <main className="maxiGalleryPage maxiGalleryEmptyPage">
        <div className="maxiGalleryEmptyIcon" aria-hidden="true">
          🚚
        </div>

        <h1>No Vehicles Available</h1>

        <p>
          There are currently no available vehicles in the{" "}
          {formattedVehicleClass} category.
        </p>
      </main>
    );
  }

  return (
    <main className="maxiGalleryPage">
      {/* IMAGE GALLERY */}

      <section className="maxiGalleryHero">
        <div
          className="maxiGallerySlides"
          ref={galleryRef}
          onScroll={handleGalleryScroll}
          aria-label={`${formattedVehicleClass} image gallery`}
        >
          {images.map((image, index) => (
            <div className="maxiGallerySlide" key={`${image}-${index}`}>
              <img
                src={image}
                alt={`${formattedVehicleClass} vehicle ${index + 1}`}
                className={`maxiGalleryMainImage ${
                  zoomed && activePage === index ? "zoomed" : ""
                }`}
                onClick={() => {
                  if (activePage === index) {
                    setZoomed((current) => !current);
                  }
                }}
                onKeyDown={handleImageKeyDown}
                role="button"
                tabIndex={0}
                aria-label={`Toggle zoom for image ${index + 1}`}
                draggable={false}
              />
            </div>
          ))}
        </div>

        <div className="maxiGalleryGradient" />

        {images.length > 1 && (
          <>
            <button
              type="button"
              className="maxiGalleryArrow maxiGalleryArrowLeft"
              onClick={() => goToImage(Math.max(0, activePage - 1))}
              disabled={activePage === 0}
              aria-label="Previous image"
            >
              &#8249;
            </button>

            <button
              type="button"
              className="maxiGalleryArrow maxiGalleryArrowRight"
              onClick={() =>
                goToImage(Math.min(images.length - 1, activePage + 1))
              }
              disabled={activePage === images.length - 1}
              aria-label="Next image"
            >
              &#8250;
            </button>
          </>
        )}

        <div className="maxiGalleryCounter">
          {activePage + 1} / {images.length}
        </div>
      </section>

      {/* PAGINATION */}

      {images.length > 1 && (
        <div className="maxiGalleryPagination" aria-label="Gallery pagination">
          {images.map((_, index) => (
            <button
              type="button"
              key={index}
              className={`maxiGalleryDot ${
                activePage === index ? "active" : ""
              }`}
              onClick={() => goToImage(index)}
              aria-label={`Go to image ${index + 1}`}
              aria-current={activePage === index ? "true" : undefined}
            />
          ))}
        </div>
      )}

      {/* VEHICLE INFORMATION */}

      <section className="maxiGalleryInfoCard">
        <h1>{formattedVehicleClass}</h1>

        <p className="maxiGallerySubtitle">
          Premium logistics vehicle ready for deliveries
        </p>

        <p className="maxiGalleryDescription">
          This vehicle class is optimized for heavy cargo and large shipments.
          Swipe through images to explore the vehicle.
        </p>
      </section>

      {/* THUMBNAILS */}

      {images.length > 1 && (
        <section className="maxiGalleryThumbnailsSection">
          <h2>Gallery</h2>

          <div className="maxiGalleryThumbnails">
            {images.map((image, index) => (
              <button
                type="button"
                key={`${image}-thumbnail-${index}`}
                ref={(element) => {
                  thumbnailRefs.current[index] = element;
                }}
                className={`maxiGalleryThumbnailButton ${
                  activePage === index ? "active" : ""
                }`}
                onClick={() => goToImage(index)}
                aria-label={`View image ${index + 1}`}
                aria-current={activePage === index ? "true" : undefined}
              >
                <img
                  src={image}
                  alt=""
                  className="maxiGalleryThumbnail"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="maxiGalleryBottomSpace" />
    </main>
  );
}
