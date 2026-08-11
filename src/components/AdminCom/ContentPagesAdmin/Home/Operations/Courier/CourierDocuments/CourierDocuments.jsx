import React, { useCallback, useEffect, useState } from "react";

import { FaArrowLeft, FaSyncAlt, FaFileAlt } from "react-icons/fa";

import { useNavigate, useParams } from "react-router-dom";

import { DataStore } from "aws-amplify/datastore";

import { getUrl } from "aws-amplify/storage";

import { Courier } from "../../../../../../../models";

import CourierIdentityDocuments from "./components/CourierIdentityDocuments/CourierIdentityDocuments";
import CourierGuarantorDocuments from "./components/CourierGuarantorDocuments/CourierGuarantorDocuments";
import CourierVehicleDocuments from "./components/CourierVehicleDocuments/CourierVehicleDocuments";
import CourierDocumentViewer from "./components/CourierDocumentViewer/CourierDocumentViewer";
import CourierDocumentsEmptyState from "./components/CourierDocumentsEmptyState/CourierDocumentsEmptyState";

import "./CourierDocuments.css";

function CourierDocuments() {
  /*
  ==========================================================
  ROUTING
  ==========================================================
  */

  const { id: courierId } = useParams();

  const navigate = useNavigate();

  /*
  ==========================================================
  COURIER STATE
  ==========================================================
  */

  const [courier, setCourier] = useState(null);

  const [profileUrl, setProfileUrl] = useState(null);

  /*
  ==========================================================
  LOADING / ERROR
  ==========================================================
  */

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(null);

  /*
  ==========================================================
  DOCUMENT VIEWER
  ==========================================================
  */

  const [viewerOpen, setViewerOpen] = useState(false);

  const [viewerImageUrl, setViewerImageUrl] = useState(null);

  const [viewerTitle, setViewerTitle] = useState("Courier Document");

  const [viewerDescription, setViewerDescription] = useState("");

  const [viewerImageAlt, setViewerImageAlt] = useState("Courier document");

  /*
  ==========================================================
  FETCH COURIER
  ==========================================================
  */

  const fetchCourier = useCallback(
    async (isRefresh = false) => {
      if (!courierId) {
        setCourier(null);

        setError("No courier ID was provided.");

        setLoading(false);

        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const result = await DataStore.query(Courier, courierId);

        if (!result) {
          setCourier(null);

          setError("Unable to find this courier.");

          return;
        }

        setCourier(result);
      } catch (err) {
        console.error("Error loading courier documents:", err);

        setCourier(null);

        setError("Unable to load courier documents.");
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [courierId],
  );

  /*
  ==========================================================
  INITIAL LOAD
  ==========================================================
  */

  useEffect(() => {
    fetchCourier(false);
  }, [fetchCourier]);

  /*
  ==========================================================
  LOAD COURIER PROFILE PHOTO
  ==========================================================
  */

  useEffect(() => {
    let mounted = true;

    const loadProfilePhoto = async () => {
      if (!courier?.profilePic) {
        if (mounted) {
          setProfileUrl(null);
        }

        return;
      }

      try {
        const result = await getUrl({
          path: courier.profilePic,

          options: {
            validateObjectExistence: true,
          },
        });

        if (mounted && result?.url) {
          setProfileUrl(result.url.toString());
        } else if (mounted) {
          setProfileUrl(null);
        }
      } catch (err) {
        console.error("Error loading courier profile photo:", err);

        if (mounted) {
          setProfileUrl(null);
        }
      }
    };

    loadProfilePhoto();

    return () => {
      mounted = false;
    };
  }, [courier?.profilePic]);

  /*
  ==========================================================
  REFRESH
  ==========================================================
  */

  const handleRefresh = () => {
    fetchCourier(true);
  };

  /*
  ==========================================================
  BACK TO COURIER
  ==========================================================
  */

  const handleBack = () => {
    navigate(-1);
  };

  /*
  ==========================================================
  OPEN DOCUMENT VIEWER
  ==========================================================
  */

  const openDocumentViewer = ({ url, title, description, imageAlt }) => {
    if (!url) {
      return;
    }

    setViewerImageUrl(url);

    setViewerTitle(title || "Courier Document");

    setViewerDescription(description || "");

    setViewerImageAlt(imageAlt || "Courier document");

    setViewerOpen(true);
  };

  /*
  ==========================================================
  CLOSE DOCUMENT VIEWER
  ==========================================================
  */

  const closeDocumentViewer = () => {
    setViewerOpen(false);

    setViewerImageUrl(null);

    setViewerTitle("Courier Document");

    setViewerDescription("");

    setViewerImageAlt("Courier document");
  };

  /*
  ==========================================================
  COURIER NIN VIEWER
  ==========================================================
  */

  const handleCourierNINView = (url) => {
    const courierName =
      [courier?.firstName, courier?.lastName].filter(Boolean).join(" ") ||
      "Courier";

    openDocumentViewer({
      url,

      title: "Courier NIN Document",

      description: `National Identification Number document for ${courierName}.`,

      imageAlt: `${courierName} NIN document`,
    });
  };

  /*
  ==========================================================
  GUARANTOR NIN VIEWER
  ==========================================================
  */

  const handleGuarantorNINView = (url) => {
    const guarantorName =
      [courier?.guarantorName, courier?.guarantorLastName]
        .filter(Boolean)
        .join(" ") || "Guarantor";

    openDocumentViewer({
      url,

      title: "Guarantor NIN Document",

      description: `National Identification Number document for ${guarantorName}.`,

      imageAlt: `${guarantorName} NIN document`,
    });
  };

  /*
  ==========================================================
  VEHICLE IMAGE VIEWER
  ==========================================================
  */

  const handleVehicleImageView = (url) => {
    const courierName =
      [courier?.firstName, courier?.lastName].filter(Boolean).join(" ") ||
      "Courier";

    openDocumentViewer({
      url,

      title: "Vehicle Photo",

      description: `Vehicle photo submitted by ${courierName}.`,

      imageAlt: `${courierName} vehicle`,
    });
  };

  /*
  ==========================================================
  LOADING STATE
  ==========================================================
  */

  if (loading) {
    return (
      <main className="courierDocuments">
        <div className="courierDocuments-loadingPage">
          <div className="courierDocuments-loadingSpinner" />

          <h2>Loading Documents</h2>

          <p>Retrieving courier documents...</p>
        </div>
      </main>
    );
  }

  /*
  ==========================================================
  ERROR STATE
  ==========================================================
  */

  if (error) {
    return (
      <main className="courierDocuments">
        <div className="courierDocuments-topBar">
          <button
            type="button"
            className="courierDocuments-iconButton"
            onClick={handleBack}
            title="Back to courier"
            aria-label="Back to courier"
          >
            <FaArrowLeft />
          </button>

          <button
            type="button"
            className="courierDocuments-iconButton"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh documents"
            aria-label="Refresh documents"
          >
            <FaSyncAlt
              className={
                refreshing
                  ? "courierDocuments-refresh spinning"
                  : "courierDocuments-refresh"
              }
            />
          </button>
        </div>

        <CourierDocumentsEmptyState
          type="error"
          title="Unable to Load Documents"
          message={error}
          onRetry={handleRefresh}
          retryLabel="Try Again"
        />
      </main>
    );
  }

  /*
  ==========================================================
  NO COURIER
  ==========================================================
  */

  if (!courier) {
    return (
      <main className="courierDocuments">
        <div className="courierDocuments-topBar">
          <button
            type="button"
            className="courierDocuments-iconButton"
            onClick={handleBack}
            title="Back to courier"
            aria-label="Back to courier"
          >
            <FaArrowLeft />
          </button>

          <button
            type="button"
            className="courierDocuments-iconButton"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh documents"
            aria-label="Refresh documents"
          >
            <FaSyncAlt
              className={
                refreshing
                  ? "courierDocuments-refresh spinning"
                  : "courierDocuments-refresh"
              }
            />
          </button>
        </div>

        <CourierDocumentsEmptyState
          title="Courier Not Found"
          message="The courier associated with this document page could not be found."
          onRetry={handleRefresh}
          retryLabel="Try Again"
        />
      </main>
    );
  }

  /*
  ==========================================================
  COURIER NAME
  ==========================================================
  */

  const courierName =
    [courier.firstName, courier.lastName].filter(Boolean).join(" ") ||
    "Courier";

  /*
  ==========================================================
  DOCUMENT AVAILABILITY
  ==========================================================
  */

  const hasIdentityDocument = Boolean(
    courier.courierNIN || courier.courierNINImage,
  );

  const hasGuarantorDocument = Boolean(
    courier.guarantorName ||
    courier.guarantorLastName ||
    courier.guarantorNIN ||
    courier.guarantorNINImage,
  );

  const hasVehicleInformation = Boolean(
    courier.transportationType ||
    courier.vehicleClass ||
    courier.model ||
    courier.vehicleColour ||
    courier.plateNumber ||
    courier.maxiImages?.length ||
    courier.maxiDescription,
  );

  const hasAnyDocuments =
    hasIdentityDocument || hasGuarantorDocument || hasVehicleInformation;

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <main className="courierDocuments">
      {/* ==================================================
          TOP BAR
      ================================================== */}

      <div className="courierDocuments-topBar">
        <button
          type="button"
          className="courierDocuments-iconButton"
          onClick={handleBack}
          title="Back to courier"
          aria-label="Back to courier"
        >
          <FaArrowLeft />
        </button>

        <div className="courierDocuments-topBarCenter">
          <div className="courierDocuments-pageIcon">
            <FaFileAlt />
          </div>

          <div>
            <h1>Courier Documents</h1>

            <p>{courierName}</p>
          </div>
        </div>

        <button
          type="button"
          className="courierDocuments-iconButton"
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh documents"
          aria-label="Refresh documents"
        >
          <FaSyncAlt
            className={
              refreshing
                ? "courierDocuments-refresh spinning"
                : "courierDocuments-refresh"
            }
          />
        </button>
      </div>

      {/* ==================================================
          COURIER SUMMARY
      ================================================== */}

      <section className="courierDocuments-summary">
        <div className="courierDocuments-summaryIdentity">
          <div className="courierDocuments-avatar">
            {profileUrl ? (
              <img src={profileUrl} alt={courierName} />
            ) : (
              <span>{courierName.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div className="courierDocuments-summaryInfo">
            <h2>{courierName}</h2>

            <p>Courier ID: {courier.id}</p>
          </div>
        </div>

        <div className="courierDocuments-summaryStatus">
          <span>Document Sections</span>

          <strong>
            {
              [
                hasIdentityDocument,
                hasGuarantorDocument,
                hasVehicleInformation,
              ].filter(Boolean).length
            }
            {" / 3"}
          </strong>
        </div>
      </section>

      {/* ==================================================
          EMPTY DOCUMENT STATE
      ================================================== */}

      {!hasAnyDocuments ? (
        <CourierDocumentsEmptyState
          title="No Documents Available"
          message={`${courierName} has not submitted any identity, guarantor, or vehicle documentation yet.`}
          onRetry={handleRefresh}
          retryLabel="Refresh"
        />
      ) : (
        <div className="courierDocuments-content">
          {/* ==================================================
              IDENTITY DOCUMENTS
          ================================================== */}

          <CourierIdentityDocuments
            courier={courier}
            profileUrl={profileUrl}
            onViewDocument={handleCourierNINView}
          />

          {/* ==================================================
              GUARANTOR DOCUMENTS
          ================================================== */}

          <CourierGuarantorDocuments
            courier={courier}
            onViewDocument={handleGuarantorNINView}
          />

          {/* ==================================================
              VEHICLE DOCUMENTS
          ================================================== */}

          <CourierVehicleDocuments
            courier={courier}
            onViewImage={handleVehicleImageView}
          />
        </div>
      )}

      {/* ==================================================
          DOCUMENT VIEWER
      ================================================== */}

      <CourierDocumentViewer
        isOpen={viewerOpen}
        imageUrl={viewerImageUrl}
        title={viewerTitle}
        description={viewerDescription}
        imageAlt={viewerImageAlt}
        onClose={closeDocumentViewer}
      />
    </main>
  );
}

export default CourierDocuments;
