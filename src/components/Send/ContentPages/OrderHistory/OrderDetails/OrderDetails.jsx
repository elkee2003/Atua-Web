import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { DataStore } from "aws-amplify/datastore";
import { getUrl } from "aws-amplify/storage";
import { Order } from "../../../../../../src/models";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBox,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaCopy,
  FaExternalLinkAlt,
  FaMapMarkerAlt,
  FaPhone,
  FaTimes,
  FaTruck,
  FaUser,
  FaWallet,
  FaImages,
} from "react-icons/fa";
import "./OrderDetails.css";

const PLACEHOLDER_IMAGE = "/placeholder.png";
const ACTIVE_STATUSES = [
  "READY_FOR_PICKUP",
  "BIDDING",
  "ACCEPTED",
  "IN_TRANSIT",
];

function safeString(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === "") return "-";
  const number = Number(value);
  return Number.isNaN(number)
    ? `₦${String(value)}`
    : `₦${number.toLocaleString("en-NG")}`;
}

function formatDate(value, fallback = "-") {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function resolveStorageUrl(imagePath) {
  if (!imagePath) return null;
  if (
    typeof imagePath === "string" &&
    /^(https?:|blob:|data:|file:)/i.test(imagePath)
  )
    return imagePath;
  try {
    const result = await getUrl({ path: String(imagePath) });
    return result?.url?.toString?.() || null;
  } catch (error) {
    console.error("Unable to resolve Storage image URL:", error);
    return null;
  }
}

function StatusBadge({ status }) {
  const configs = {
    BIDDING: ["Bidding", "amber"],
    READY_FOR_PICKUP: ["Ready for pickup", "blue"],
    ACCEPTED: ["Accepted", "blue"],
    IN_TRANSIT: ["In transit", "blue"],
    DELIVERED: ["Delivered", "green"],
    CANCELLED: ["Cancelled", "red"],
    CANCELED: ["Cancelled", "red"],
  };
  const [label, tone] = configs[status] || [
    String(status || "Unknown")
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase()),
    "neutral",
  ];
  return (
    <span className={`od-status od-status--${tone}`}>
      <span className="od-status-dot" />
      {label}
    </span>
  );
}

function DetailRow({
  label,
  value,
  copyable = false,
  onCopy,
  multiline = false,
}) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div
      className={`od-detail-row${multiline ? " od-detail-row--multiline" : ""}`}
    >
      <span className="od-detail-label">{label}</span>
      <div className="od-detail-value-wrap">
        <span className="od-detail-value">{safeString(value)}</span>
        {copyable && (
          <button
            className="od-icon-button od-copy-small"
            type="button"
            title={`Copy ${label}`}
            onClick={onCopy}
          >
            <FaCopy />
          </button>
        )}
      </div>
    </div>
  );
}

function Section({ title, eyebrow, icon, open, onToggle, children }) {
  return (
    <section className="od-card od-section-card">
      <button
        className="od-section-header"
        type="button"
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="od-section-icon">{icon}</span>
        <span className="od-section-heading">
          <span className="od-eyebrow">{eyebrow}</span>
          <strong>{title}</strong>
        </span>
        <span className="od-chevron">
          {open ? <FaChevronUp /> : <FaChevronDown />}
        </span>
      </button>
      {open && <div className="od-section-content">{children}</div>}
    </section>
  );
}

function Timeline({
  acceptedAt,
  arrivedPickupAt,
  tripStartedAt,
  arrivedDropoffAt,
  unloadingCompletedAt,
  status,
}) {
  const steps = [
    {
      label: "Order accepted",
      description: "Your delivery request was accepted.",
      value: acceptedAt,
    },
    {
      label: "Arrived at pickup",
      description: "Courier arrived at the pickup location.",
      value: arrivedPickupAt,
    },
    {
      label: "Trip started",
      description: "Your parcel is on its way.",
      value: tripStartedAt,
    },
    {
      label: "Arrived at dropoff",
      description: "Courier reached the destination.",
      value: arrivedDropoffAt,
    },
    {
      label: "Delivered",
      description: "Your parcel has been delivered.",
      value: unloadingCompletedAt,
    },
  ];
  return (
    <div className="od-timeline">
      {steps.map((step, index) => {
        const cancelled = ["CANCELLED", "CANCELED"].includes(status);
        const done =
          !cancelled && (status === "DELIVERED" || Boolean(step.value));
        return (
          <div className="od-timeline-item" key={step.label}>
            <div className="od-timeline-rail">
              <span className={`od-timeline-dot${done ? " is-done" : ""}`}>
                {done && <FaCheck />}
              </span>
              {index < steps.length - 1 && (
                <span className={`od-timeline-line${done ? " is-done" : ""}`} />
              )}
            </div>
            <div className="od-timeline-content">
              <div className="od-timeline-title">
                <strong className={!done ? "is-pending" : ""}>
                  {step.label}
                </strong>
                {done && <span>Done</span>}
              </div>
              <p>{step.description}</p>
              <time>{formatDate(step.value, "Pending")}</time>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderDetails({ orderId: receivedOrderId }) {
  const params = useParams();
  const navigate = useNavigate();
  const orderId = receivedOrderId || params.orderId || params.id;
  const [order, setOrder] = useState(null);
  const [courier, setCourier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const [evidence, setEvidence] = useState([]);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [notice, setNotice] = useState("");
  const [sections, setSections] = useState({
    recipient: true,
    route: true,
    load: false,
    pricing: false,
    evidence: false,
  });

  const [map, setMap] = useState(null);

  const origin = useMemo(() => {
    const lat = Number(order?.originLat);
    const lng = Number(order?.originLng);

    if (
      order?.originLat == null ||
      order?.originLng == null ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      (lat === 0 && lng === 0)
    ) {
      return null;
    }

    return { lat, lng };
  }, [order?.originLat, order?.originLng]);

  const destination = useMemo(() => {
    const lat = Number(order?.destinationLat);
    const lng = Number(order?.destinationLng);

    if (
      order?.destinationLat == null ||
      order?.destinationLng == null ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      (lat === 0 && lng === 0)
    ) {
      return null;
    }

    return { lat, lng };
  }, [order?.destinationLat, order?.destinationLng]);

  const hasValidCoords = Boolean(origin && destination);

  useEffect(() => {
    if (!map || !window.google?.maps) return;
    if (!origin || !destination) return;

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(origin);
    bounds.extend(destination);

    map.fitBounds(bounds, 50);
  }, [map, origin, destination]);

  const trackingUrl = useMemo(() => {
    const token = order?.recipientTrackingToken;

    if (!token) return null;

    return `https://atuainc.com/send/track/${encodeURIComponent(token)}`;
  }, [order?.recipientTrackingToken]);

  const notify = useCallback((message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2800);
  }, []);

  const copyToClipboard = useCallback(
    async (value, label = "Copied") => {
      if (value === null || value === undefined || value === "") return;
      try {
        await navigator.clipboard.writeText(String(value));
        notify(`${label} to clipboard`);
      } catch (error) {
        console.error("Clipboard error:", error);
        window.prompt("Copy this value:", String(value));
      }
    },
    [notify],
  );

  const shareTrackingLink = async () => {
    if (!trackingUrl) {
      notify("Tracking link is not available for this order yet.");
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Atua Delivery Tracking",
          text: `Track your Atua delivery here: ${trackingUrl}`,
          url: trackingUrl,
        });
      } else {
        await copyToClipboard(trackingUrl, "Tracking link copied");
      }
    } catch (error) {
      if (error?.name === "AbortError") return;

      console.error("Unable to share tracking link:", error);
      await copyToClipboard(trackingUrl, "Tracking link copied");
    }
  };

  useEffect(() => {
    let alive = true;
    async function fetchData() {
      if (!orderId) {
        setOrder(null);
        setCourier(null);
        setProfileImage(null);
        setEvidence([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await DataStore.query(Order, orderId);
        if (!alive) return;
        if (!data) {
          setOrder(null);
          setCourier(null);
          setProfileImage(null);
          setEvidence([]);
          return;
        }
        setOrder(data);
        let courierData = null;
        if (data.assignedCourierId) {
          try {
            courierData = await data.assignedCourier;
          } catch (error) {
            console.error(
              "Unable to load assigned courier relationship:",
              error,
            );
          }
        }
        if (!alive) return;
        setCourier(courierData || null);
        setProfileImage(
          courierData?.profilePic
            ? await resolveStorageUrl(courierData.profilePic)
            : null,
        );
        const groups = [
          data.senderPreTransferPhotos || [],
          data.courierPreTransferPhotos || [],
          data.courierPostLoadingPhotos || [],
          data.dropoffArrivalPhotos || [],
          data.postDeliveryPhotos || [],
        ];
        const paths = groups
          .flat()
          .filter(Boolean)
          .map((item) =>
            typeof item === "string"
              ? item
              : typeof item === "object"
                ? item.path || item.key || item.uri
                : null,
          )
          .filter(Boolean);
        const images = [];
        for (const path of paths) {
          const uri = await resolveStorageUrl(path);
          if (uri) images.push({ uri });
        }
        if (alive) setEvidence(images);
      } catch (error) {
        console.error("Error loading order details:", error);
        if (alive) {
          setOrder(null);
          setCourier(null);
          setProfileImage(null);
          setEvidence([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    }
    fetchData();
    return () => {
      alive = false;
    };
  }, [orderId]);

  const toggleSection = (key) =>
    setSections((previous) => ({ ...previous, [key]: !previous[key] }));
  const orderReference = order?.id
    ? order.id.slice(0, 8).toUpperCase()
    : "--------";
  const courierName =
    [courier?.firstName, courier?.lastName].filter(Boolean).join(" ") ||
    "Courier assigned";
  const isActiveOrder = ACTIVE_STATUSES.includes(order?.status);
  const isPaid = order?.paymentStatus === "PAID";
  const isDelivered = order?.status === "DELIVERED";
  const isCancelled = ["CANCELLED", "CANCELED"].includes(order?.status);

  if (loading)
    return (
      <main className="od-state">
        <span className="od-spinner" />
        <p>Loading your delivery...</p>
      </main>
    );
  if (!order)
    return (
      <main className="od-state">
        <span className="od-empty-icon">!</span>
        <h2>Order not found</h2>
        <p>We could not find the delivery you are looking for.</p>
        <button
          className="od-button od-button--primary"
          onClick={() => navigate(-1)}
        >
          Go Back
        </button>
      </main>
    );

  return (
    <main className="order-details-page">
      {notice && (
        <div className="od-toast" role="status">
          {notice}
        </div>
      )}
      <div className="od-page-inner">
        <header className="od-page-header">
          <div className="od-header-top">
            <button
              className="od-back-button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <FaArrowLeft />
            </button>
            <div className="od-header-title">
              <span className="od-eyebrow">DELIVERY DETAILS</span>
              <h1>Order #{orderReference}</h1>
            </div>
            <span className="od-logo">A</span>
          </div>
          <div className="od-header-bottom">
            <p>Your delivery at a glance</p>
            <StatusBadge status={order.status} />
          </div>
        </header>

        <section className="od-card od-overview-card">
          <div className="od-overview-top">
            <span className="od-overview-label">
              <i />
              {isDelivered
                ? "DELIVERY COMPLETED"
                : isCancelled
                  ? "DELIVERY CANCELLED"
                  : isActiveOrder
                    ? "DELIVERY IN PROGRESS"
                    : "DELIVERY OVERVIEW"}
            </span>
            <span className="od-reference">#{orderReference}</span>
          </div>
          <div className="od-overview-title-row">
            <div>
              <h2>
                {isDelivered
                  ? "Your order has arrived"
                  : isCancelled
                    ? "Order cancelled"
                    : "Your delivery is on its way"}
              </h2>
              <p>
                {isDelivered
                  ? "Thank you for using Atua."
                  : isCancelled
                    ? "This order is no longer active."
                    : "Track your order and stay updated."}
              </p>
            </div>
            <span className="od-package-emoji">📦</span>
          </div>

          {hasValidCoords && (
            <div className="od-map-wrap">
              <GoogleMap
                mapContainerClassName="od-map"
                center={origin}
                zoom={13}
                onLoad={setMap}
                onUnmount={() => setMap(null)}
                options={{
                  mapTypeControl: false,
                  streetViewControl: false,
                  fullscreenControl: true,
                  clickableIcons: false,
                }}
              >
                <Marker
                  position={origin}
                  title={`Pickup: ${order.originAddress || "Pickup location"}`}
                  label={{
                    text: "P",
                    color: "#ffffff",
                    fontWeight: "700",
                  }}
                />

                <Marker
                  position={destination}
                  title={`Drop-off: ${
                    order.destinationAddress || "Drop-off location"
                  }`}
                  label={{
                    text: "D",
                    color: "#ffffff",
                    fontWeight: "700",
                  }}
                />
              </GoogleMap>

              <span className="od-map-badge">
                <i />
                {isDelivered ? "Delivered" : "Delivery route"}
              </span>
            </div>
          )}

          <div className="od-route-summary">
            <div className="od-route-item">
              <span className="od-route-marker od-route-marker--pickup">
                <i />
              </span>
              <div>
                <span className="od-eyebrow">PICKUP FROM</span>
                <strong>{order.originAddress || "-"}</strong>
              </div>
            </div>
            <div className="od-route-divider" />
            <div className="od-route-item">
              <span className="od-route-marker od-route-marker--dropoff">
                ●
              </span>
              <div>
                <span className="od-eyebrow">DELIVERING TO</span>
                <strong>{order.destinationAddress || "-"}</strong>
              </div>
            </div>
          </div>
        </section>

        {courier && (
          <section className="od-card od-courier-card">
            <div className="od-card-heading">
              <span className="od-eyebrow">YOUR COURIER</span>
              <span className="od-assigned">✓ Assigned</span>
            </div>
            <div className="od-courier-profile">
              <div className="od-avatar-wrap">
                <img
                  src={profileImage || PLACEHOLDER_IMAGE}
                  alt="Courier"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = PLACEHOLDER_IMAGE;
                  }}
                />
                <i />
              </div>
              <div className="od-courier-info">
                <h3>{courierName}</h3>
                <p>
                  {courier.vehicleClass || "Courier"}
                  {courier.plateNumber ? ` • ${courier.plateNumber}` : ""}
                </p>
                <small>Atua delivery partner</small>
              </div>
              {isPaid && courier.phoneNumber && (
                <button
                  className="od-icon-button od-phone-button"
                  title="Copy courier phone"
                  onClick={() =>
                    copyToClipboard(courier.phoneNumber, "Phone copied")
                  }
                >
                  <FaPhone />
                </button>
              )}
            </div>
            {isPaid && courier.phoneNumber && (
              <button
                className="od-phone-row"
                onClick={() =>
                  copyToClipboard(courier.phoneNumber, "Phone copied")
                }
              >
                <span>Courier phone number</span>
                <strong>
                  {courier.phoneNumber} <FaCopy />
                </strong>
              </button>
            )}
          </section>
        )}

        <section className="od-card">
          <div className="od-section-static-heading">
            <div>
              <span className="od-eyebrow">DELIVERY JOURNEY</span>
              <h2>Delivery Timeline</h2>
            </div>
            <span className="od-section-icon">
              <FaClock />
            </span>
          </div>
          <Timeline
            acceptedAt={order.acceptedAt}
            arrivedPickupAt={order.arrivedPickupAt}
            tripStartedAt={order.tripStartedAt}
            arrivedDropoffAt={order.arrivedDropoffAt}
            unloadingCompletedAt={order.unloadingCompletedAt}
            status={order.status}
          />
        </section>

        <Section
          title="Recipient Details"
          eyebrow="DELIVERY CONTACT"
          icon={<FaUser />}
          open={sections.recipient}
          onToggle={() => toggleSection("recipient")}
        >
          <DetailRow label="Full name" value={order.recipientName} />
          <DetailRow
            label="Phone number"
            value={order.recipientNumber}
            copyable
            onCopy={() =>
              copyToClipboard(order.recipientNumber, "Phone copied")
            }
          />
          <DetailRow
            label="Alternative phone"
            value={order.recipientNumber2}
            copyable
            onCopy={() =>
              copyToClipboard(order.recipientNumber2, "Phone copied")
            }
          />
        </Section>
        <Section
          title="Route Details"
          eyebrow="PICKUP & DROPOFF"
          icon={<FaMapMarkerAlt />}
          open={sections.route}
          onToggle={() => toggleSection("route")}
        >
          <DetailRow label="Pickup location" value={order.originAddress} />
          <DetailRow
            label="Dropoff location"
            value={order.destinationAddress}
          />
          <DetailRow label="Trip type" value={order.tripType} />
        </Section>

        {order.recipientTrackingEnabled &&
          order.recipientTrackingToken &&
          !order.recipientTrackingRevokedAt && (
            <section className="od-card od-tracking-card">
              <div className="od-tracking-heading">
                <span className="od-section-icon">
                  <FaExternalLinkAlt />
                </span>
                <div>
                  <span className="od-eyebrow">RECIPIENT TRACKING</span>
                  <h2>Share delivery progress</h2>
                </div>
              </div>
              <p>
                Send this link to the recipient so they can follow the delivery
                without signing into Atua.
              </p>
              <div className="od-tracking-url">{trackingUrl}</div>
              <div className="od-button-row">
                <button
                  className="od-button od-button--primary"
                  onClick={() =>
                    copyToClipboard(trackingUrl, "Tracking link copied")
                  }
                >
                  {" "}
                  <FaCopy /> Copy Link
                </button>
                <button
                  className="od-button od-button--secondary"
                  onClick={shareTrackingLink}
                >
                  <FaExternalLinkAlt /> Share Link
                </button>
              </div>
            </section>
          )}

        <Section
          title="Parcel Details"
          eyebrow="PACKAGE INFORMATION"
          icon={<FaBox />}
          open={sections.load}
          onToggle={() => toggleSection("load")}
        >
          <DetailRow label="Load category" value={order.loadCategory} />
          <DetailRow label="Vehicle class" value={order.vehicleClass} />
          <DetailRow label="Weight" value={order.declaredWeightBracket} />
          <DetailRow
            label="Package description"
            value={order.orderDetails}
            multiline
          />
          {order.deliveryVerificationCode && (
            <div className="od-verification">
              <div>
                <span className="od-eyebrow">DELIVERY VERIFICATION CODE</span>
                <small>Keep this safe</small>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(order.deliveryVerificationCode, "Code copied")
                }
              >
                {order.deliveryVerificationCode}
                <FaCopy />
              </button>
            </div>
          )}
        </Section>

        <Section
          title="Price Breakdown"
          eyebrow="PAYMENT SUMMARY"
          icon={<FaWallet />}
          open={sections.pricing}
          onToggle={() => toggleSection("pricing")}
        >
          {[
            ["Initial offer", order.initialOfferPrice],
            ["Operational fare", order.operationalFare],
            ["Loading fee", order.loadingFee],
            ["Unloading fee", order.unloadingFee],
            ["Platform fee", order.platformFee],
            ["VAT", order.vatAmount],
          ]
            .filter(
              ([, value]) =>
                value !== null && value !== undefined && value !== "",
            )
            .map(([label, value]) => (
              <DetailRow
                key={label}
                label={label}
                value={formatCurrency(value)}
              />
            ))}
          <div className="od-total-row">
            <div>
              <strong>Total Amount</strong>
              <small>Final delivery cost</small>
            </div>
            <strong>{formatCurrency(order.totalPrice)}</strong>
          </div>
        </Section>

        {evidence.length > 0 && (
          <Section
            title="Delivery Evidence"
            eyebrow="PROOF OF DELIVERY"
            icon={<FaImages />}
            open={sections.evidence}
            onToggle={() => toggleSection("evidence")}
          >
            <p className="od-evidence-description">
              Photos captured during the delivery process. Select any image to
              view it in full screen.
            </p>
            <div className="od-evidence-grid">
              {evidence.map((image, index) => (
                <button
                  className="od-evidence-item"
                  key={`${image.uri}-${index}`}
                  onClick={() => {
                    setSelectedImage(index);
                    setShowViewer(true);
                  }}
                >
                  <img src={image.uri} alt={`Delivery evidence ${index + 1}`} />
                  <span className="od-evidence-expand">⤢</span>
                  <span className="od-evidence-number">{index + 1}</span>
                </button>
              ))}
            </div>
          </Section>
        )}

        <div className="od-actions">
          {order.status === "BIDDING" && (
            <>
              <button
                className="od-button od-button--primary"
                onClick={() =>
                  notify("The View Bids screen has not been connected yet.")
                }
              >
                View Bids <FaArrowRight />
              </button>
              <button
                className="od-button od-button--secondary"
                onClick={() =>
                  notify("The cancel order action has not been connected yet.")
                }
              >
                Cancel Order
              </button>
            </>
          )}
          {isActiveOrder && (
            <button
              className="od-button od-button--primary"
              onClick={() => navigate(`/send/order_tracking/${order.id}`)}
            >
              Track Order <FaArrowRight />
            </button>
          )}
          {isDelivered && (
            <div className="od-completed-banner">
              <span>
                <FaCheck />
              </span>
              <div>
                <strong>Delivery Complete</strong>
                <p>Your order has been successfully delivered.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showViewer && evidence.length > 0 && (
        <div
          className="od-viewer"
          role="dialog"
          aria-modal="true"
          aria-label="Delivery evidence viewer"
          onClick={() => setShowViewer(false)}
        >
          <div
            className="od-viewer-header"
            onClick={(event) => event.stopPropagation()}
          >
            <div>
              <span className="od-eyebrow">DELIVERY EVIDENCE</span>
              <strong>
                {selectedImage + 1} / {evidence.length}
              </strong>
            </div>
            <button
              onClick={() => setShowViewer(false)}
              aria-label="Close image viewer"
            >
              <FaTimes />
            </button>
          </div>
          <button
            className="od-viewer-nav od-viewer-prev"
            disabled={selectedImage === 0}
            onClick={(event) => {
              event.stopPropagation();
              setSelectedImage((i) => Math.max(0, i - 1));
            }}
            aria-label="Previous image"
          >
            ‹
          </button>
          <img
            className="od-viewer-image"
            src={evidence[selectedImage]?.uri}
            alt={`Delivery evidence ${selectedImage + 1}`}
            onClick={(event) => event.stopPropagation()}
          />
          <button
            className="od-viewer-nav od-viewer-next"
            disabled={selectedImage === evidence.length - 1}
            onClick={(event) => {
              event.stopPropagation();
              setSelectedImage((i) => Math.min(evidence.length - 1, i + 1));
            }}
            aria-label="Next image"
          >
            ›
          </button>
          <p
            className="od-viewer-footer"
            onClick={(event) => event.stopPropagation()}
          >
            Use the arrows to view more evidence
          </p>
        </div>
      )}
    </main>
  );
}
