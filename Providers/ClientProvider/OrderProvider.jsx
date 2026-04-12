import React, { createContext, useContext, useState } from "react";
// This is converted already to be compatible to web app

const OrderContext = createContext({});

const initialState = {
  // BASIC
  recipientName: "",
  recipientNumber: "",
  recipientNumber2: "",
  orderDetails: "",
  transportationType: "",
  vehicleClass: "",
  orders: [],
  orderError: "",

  // PRICING
  estimatedMinPrice: null,
  estimatedMaxPrice: null,
  initialOfferPrice: null,
  currentOfferPrice: null,
  lastOfferBy: "",
  loadingFee: null,
  unloadingFee: null,
  floorSurcharge: null,
  fragileSurcharge: null,
  extrasTotal: null,
  totalPrice: null,
  operationalFare: null,
  courierEarnings: null,
  commissionAmount: null,
  platformFee: null,
  platformServiceRevenue: null,
  vatAmount: null,
  platformNetRevenue: null,

  // VERIFICATION
  deliveryVerificationCode: "",

  // WEIGHT
  loadCategory: null,
  declaredWeightBracket: "",

  // MEDIA
  senderPreTransferPhotos: [],
  senderPreTransferVideo: "",
  senderPreTransferRecordedAt: "",
  courierPreTransferPhotos: [],
  courierPreTransferVideo: "",
  courierPreTransferRecordedAt: "",
  dropoffArrivalPhotos: [],
  dropoffArrivalVideo: "",
  postDeliveryPhotos: [],
  postDeliveryVideo: "",

  // LOADING
  pickupLoadingResponsibility: "",
  pickupFloorLevel: "",
  pickupFloorLevelPrice: null,
  pickupHasElevator: false,
  dropoffUnloadingResponsibility: "",
  dropoffFloorLevel: "",
  dropoffFloorLevelPrice: null,
  dropoffHasElevator: false,

  // LOGISTICS
  logisticsCompanyId: "",
  waybillNumber: "",
  waybillPhoto: "",
  logisticsTrackingCode: "",
  logisticsTrackingStatus: "",
};

const OrderProvider = ({ children }) => {
  const [orderState, setOrderState] = useState(initialState);

  // ---------------- GENERIC SETTER ----------------
  const updateField = (field, value) => {
    setOrderState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ---------------- CREATE ORDER ----------------
  const createOrder = (newOrder) => {
    setOrderState((prev) => ({
      ...prev,
      orders: [...prev.orders, newOrder],
    }));
  };

  // ---------------- REMOVE ORDER ----------------
  const removeOrder = (orderId) => {
    setOrderState((prev) => ({
      ...prev,
      orders: prev.orders.filter((o) => o.id !== orderId),
    }));
  };

  // ---------------- RESETS ----------------
  const resetFreightFields = () => {
    setOrderState((prev) => ({
      ...prev,
      estimatedMinPrice: null,
      estimatedMaxPrice: null,
      initialOfferPrice: null,
      currentOfferPrice: null,
      lastOfferBy: "",
      loadingFee: null,
      unloadingFee: null,
      floorSurcharge: null,
      fragileSurcharge: null,
      extrasTotal: null,
      pickupLoadingResponsibility: "",
      pickupFloorLevel: "",
      pickupFloorLevelPrice: null,
      pickupHasElevator: false,
      dropoffUnloadingResponsibility: "",
      dropoffFloorLevel: "",
      dropoffFloorLevelPrice: null,
      dropoffHasElevator: false,
      loadCategory: null,
      declaredWeightBracket: "",
    }));
  };

  const resetInstantFields = () => {
    setOrderState((prev) => ({
      ...prev,
      totalPrice: null,
      courierEarnings: null,
      commissionAmount: null,
      platformFee: null,
      platformServiceRevenue: null,
      vatAmount: null,
      platformNetRevenue: null,
    }));
  };

  const resetOrderByTransportType = (type) => {
    if (type === "MAXI") {
      resetInstantFields();
    } else {
      resetFreightFields();
    }
  };

  const resetAllOrderFields = () => {
    setOrderState(initialState);
  };

  return (
    <OrderContext.Provider
      value={{
        orderState,
        updateField,
        createOrder,
        removeOrder,
        resetOrderByTransportType,
        resetAllOrderFields,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export default OrderProvider;
export const useOrderContext = () => useContext(OrderContext);