import { useCallback, useEffect, useMemo, useState } from "react";
import { DataStore } from "saved-payment-methods__aws-amplify/datastore";
import {
  AlertCircle,
  ArrowRight,
  CreditCard,
  LoaderCircle,
  LockKeyhole,
  Plus,
  ShieldCheck,
  Trash2,
  Wallet,
} from "saved-payment-methods__lucide-react";

import { PaymentMethod } from "../../../../../../../src/models";
import "./SavedPaymentMethods.css";

const SavedPaymentMethods = ({
  onPayWithSavedCard,
  onUseNewCard,
  paymentLoading = false,
  selectedPaymentMethodId = null,
}) => {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingPaymentMethodId, setDeletingPaymentMethodId] = useState(null);
  const [error, setError] = useState(null);
  const [localSelectedPaymentMethodId, setLocalSelectedPaymentMethodId] =
    useState(selectedPaymentMethodId);

  useEffect(() => {
    setLocalSelectedPaymentMethodId(selectedPaymentMethodId);
  }, [selectedPaymentMethodId]);

  const loadPaymentMethods = useCallback(
    async ({ showLoading = true } = {}) => {
      try {
        if (showLoading) setLoading(true);
        else setRefreshing(true);
        setError(null);

        const methods = await DataStore.query(PaymentMethod);

        console.log("SAVED PAYMENT METHODS FROM DATASTORE:", {
          count: methods?.length || 0,
          methods: methods?.map((method) => ({
            id: method?.id,
            userID: method?.userID,
            status: method?.status,
            reusable: method?.reusable,
            isDefault: method?.isDefault,
            last4: method?.last4,
            provider: method?.provider,
            paystackEnvironment: method?.paystackEnvironment,
            updatedAt: method?.updatedAt,
          })),
        });

        // Do not filter by Order.orderEnvironment. Paystack TEST/LIVE is
        // represented by paymentMethod.paystackEnvironment on the backend.
        const activeMethods = methods.filter((method) => {
          const isActive = method?.status === "ACTIVE";
          const isReusable = method?.reusable === true;
          const isPaystack =
            !method?.provider || method.provider === "PAYSTACK";
          return isActive && isReusable && isPaystack;
        });

        activeMethods.sort((a, b) => {
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;
          const aDate = new Date(a.createdAt || a.updatedAt || 0).getTime();
          const bDate = new Date(b.createdAt || b.updatedAt || 0).getTime();
          return bDate - aDate;
        });

        setPaymentMethods(activeMethods);

        const currentSelection =
          localSelectedPaymentMethodId || selectedPaymentMethodId;
        if (!currentSelection && activeMethods.length > 0) {
          const defaultMethod =
            activeMethods.find((method) => method.isDefault) ||
            activeMethods[0];
          setLocalSelectedPaymentMethodId(defaultMethod.id);
        } else if (
          currentSelection &&
          !activeMethods.some((method) => method.id === currentSelection)
        ) {
          const replacement =
            activeMethods.find((method) => method.isDefault) ||
            activeMethods[0];
          setLocalSelectedPaymentMethodId(replacement?.id || null);
        }
      } catch (loadError) {
        console.error("LOAD SAVED PAYMENT METHODS ERROR:", loadError);
        setError(
          loadError?.message || "We could not load your saved payment methods.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [localSelectedPaymentMethodId, selectedPaymentMethodId],
  );

  useEffect(() => {
    loadPaymentMethods();
    // Run the initial query once when this component mounts.
    // saved-payment-methods__eslint-disable-next-line saved-payment-methods__react-hooks/saved-payment-methods__exhaustive-deps
  }, []);

  const selectedPaymentMethod = useMemo(() => {
    if (!localSelectedPaymentMethodId) return null;
    return (
      paymentMethods.find(
        (method) => method.id === localSelectedPaymentMethodId,
      ) || null
    );
  }, [paymentMethods, localSelectedPaymentMethodId]);

  const getCardBrand = (method) =>
    method?.cardBrand || method?.brand || method?.cardType || "Card";

  const getCardLast4 = (method) => method?.last4 || "••••";

  const getExpiry = (method) => {
    const month = method?.expiryMonth;
    const year = method?.expiryYear;
    if (!month || !year) return null;
    const formattedMonth = String(month).padStart(2, "0");
    const formattedYear =
      String(year).length === 4 ? String(year).slice(-2) : String(year);
    return `${formattedMonth}/${formattedYear}`;
  };

  const handleSelectPaymentMethod = (method) => {
    if (paymentLoading || deletingPaymentMethodId || !method?.id) return;
    setLocalSelectedPaymentMethodId(method.id);
  };

  const handlePayWithSavedCard = () => {
    if (paymentLoading) return;
    if (!selectedPaymentMethod) {
      window.alert("Please select a saved card before continuing.");
      return;
    }
    if (typeof onPayWithSavedCard === "function") {
      // Pass the PaymentMethod object; the parent should use its ID for charging.
      onPayWithSavedCard(selectedPaymentMethod);
    }
  };

  const confirmDeletePaymentMethod = async (method) => {
    try {
      setDeletingPaymentMethodId(method.id);
      const mutation = /* GraphQL */ `
        mutation DeleteSavedPaymentMethod($paymentMethodId: ID!) {
          deleteSavedPaymentMethod(paymentMethodId: $paymentMethodId) {
            success
            message
            paymentMethodId
          }
        }
      `;
      const { generateClient } =
        await import("saved-payment-methods__aws-amplify/api");
      const graphqlClient = generateClient();
      const result = await graphqlClient.graphql({
        query: mutation,
        authMode: "userPool",
        variables: { paymentMethodId: method.id },
      });
      const response = result?.data?.deleteSavedPaymentMethod;
      if (!response?.success) {
        throw new Error(
          response?.message || "The saved payment method could not be deleted.",
        );
      }

      const remainingMethods = paymentMethods.filter(
        (item) => item.id !== method.id,
      );
      setPaymentMethods(remainingMethods);
      if (localSelectedPaymentMethodId === method.id) {
        const replacement =
          remainingMethods.find((item) => item.isDefault) ||
          remainingMethods[0];
        setLocalSelectedPaymentMethodId(replacement?.id || null);
      }
      await loadPaymentMethods({ showLoading: false });
    } catch (deleteError) {
      console.error("DELETE SAVED PAYMENT METHOD ERROR:", deleteError);
      window.alert(
        deleteError?.message ||
          "We could not delete this saved card. Please try again.",
      );
    } finally {
      setDeletingPaymentMethodId(null);
    }
  };

  const handleDeletePaymentMethod = (method) => {
    if (!method?.id || paymentLoading || deletingPaymentMethodId) return;
    const confirmed = window.confirm(
      `Remove ${getCardBrand(method)} ending in ${getCardLast4(method)} from your saved payment methods?`,
    );
    if (confirmed) confirmDeletePaymentMethod(method);
  };

  const handleUseNewCard = () => {
    if (paymentLoading || deletingPaymentMethodId) return;
    if (typeof onUseNewCard === "function") onUseNewCard();
  };

  const renderNewCardButton = (isErrorState = false) => (
    <button
      type="button"
      className="saved-payment-methods__new-card-button"
      onClick={handleUseNewCard}
      disabled={paymentLoading || !!deletingPaymentMethodId}
    >
      {isErrorState ? <Wallet size={18} /> : <Plus size={18} />}
      <span className="saved-payment-methods__new-card-button-text">
        Pay with another method
      </span>
    </button>
  );

  if (loading) {
    return (
      <section className="saved-payment-methods">
        <div className="saved-payment-methods__section-header">
          <div className="saved-payment-methods__section-header-content">
            <h3 className="saved-payment-methods__section-title">
              Payment method
            </h3>
            <p className="saved-payment-methods__section-subtitle">
              Choose a saved card or another payment method.
            </p>
          </div>
        </div>
        <div className="saved-payment-methods__loading-container">
          <LoaderCircle
            className="saved-payment-methods__loading-spinner"
            size={22}
            aria-hidden="true"
          />
          <p className="saved-payment-methods__loading-text">
            Loading saved cards...
          </p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="saved-payment-methods">
        <div className="saved-payment-methods__section-header">
          <div className="saved-payment-methods__section-header-content">
            <h3 className="saved-payment-methods__section-title">
              Payment method
            </h3>
            <p className="saved-payment-methods__section-subtitle">
              Choose a saved card or another payment method.
            </p>
          </div>
        </div>
        <div className="saved-payment-methods__error-container" role="alert">
          <AlertCircle
            className="saved-payment-methods__error-icon"
            size={22}
          />
          <div className="saved-payment-methods__error-content">
            <h4 className="saved-payment-methods__error-title">
              Could not load saved cards
            </h4>
            <p className="saved-payment-methods__error-text">{error}</p>
            <button
              type="button"
              className="saved-payment-methods__retry-button"
              onClick={() => loadPaymentMethods()}
              disabled={refreshing}
            >
              {refreshing ? (
                <LoaderCircle
                  className="saved-payment-methods__loading-spinner"
                  size={14}
                />
              ) : (
                "Try Again"
              )}
            </button>
          </div>
        </div>
        {renderNewCardButton(true)}
      </section>
    );
  }

  return (
    <section className="saved-payment-methods">
      <div className="saved-payment-methods__section-header">
        <div className="saved-payment-methods__section-header-content">
          <h3 className="saved-payment-methods__section-title">
            Payment method
          </h3>
          <p className="saved-payment-methods__section-subtitle">
            Choose a saved card or another payment method.
          </p>
        </div>
        {refreshing && (
          <LoaderCircle
            className="saved-payment-methods__loading-spinner"
            size={18}
            aria-label="Refreshing saved cards"
          />
        )}
      </div>

      {paymentMethods.length > 0 ? (
        <div className="saved-payment-methods__payment-methods-list">
          {paymentMethods.map((method) => {
            const isSelected = localSelectedPaymentMethodId === method.id;
            const isDeleting = deletingPaymentMethodId === method.id;
            const expiry = getExpiry(method);
            const disabled = paymentLoading || !!deletingPaymentMethodId;

            return (
              <div
                key={method.id}
                className={`saved-payment-methods__payment-method-card${isSelected ? " saved-payment-methods__payment-method-card-selected" : ""}${isDeleting ? " saved-payment-methods__payment-method-card-disabled" : ""}`}
              >
                <button
                  type="button"
                  className="saved-payment-methods__payment-method-select-area"
                  onClick={() => handleSelectPaymentMethod(method)}
                  disabled={disabled}
                  aria-pressed={isSelected}
                  aria-label={`Select ${getCardBrand(method)} ending in ${getCardLast4(method)}`}
                >
                  <span
                    className={`saved-payment-methods__radio-outer${isSelected ? " saved-payment-methods__radio-outer-selected" : ""}`}
                  >
                    {isSelected && (
                      <span className="saved-payment-methods__radio-inner" />
                    )}
                  </span>
                  <span className="saved-payment-methods__card-information">
                    <span className="saved-payment-methods__card-top-row">
                      <span className="saved-payment-methods__card-brand">
                        {getCardBrand(method)}
                      </span>
                      {method.isDefault && (
                        <span className="saved-payment-methods__default-badge">
                          <span className="saved-payment-methods__default-badge-text">
                            Default
                          </span>
                        </span>
                      )}
                    </span>
                    <span className="saved-payment-methods__card-number">
                      •••• •••• •••• {getCardLast4(method)}
                    </span>
                    {expiry && (
                      <span className="saved-payment-methods__card-expiry">
                        Expires {expiry}
                      </span>
                    )}
                    {method.bank && (
                      <span className="saved-payment-methods__card-bank">
                        {method.bank}
                      </span>
                    )}
                  </span>
                </button>

                <button
                  type="button"
                  className="saved-payment-methods__delete-button"
                  onClick={() => handleDeletePaymentMethod(method)}
                  disabled={disabled}
                  aria-label={`Delete ${getCardBrand(method)} ending in ${getCardLast4(method)}`}
                  title="Delete saved card"
                >
                  {isDeleting ? (
                    <LoaderCircle
                      className="saved-payment-methods__loading-spinner"
                      size={18}
                    />
                  ) : (
                    <Trash2 size={18} />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="saved-payment-methods__empty-container">
          <div className="saved-payment-methods__empty-icon">
            <CreditCard size={24} />
          </div>
          <h4 className="saved-payment-methods__empty-title">No saved cards</h4>
          <p className="saved-payment-methods__empty-text">
            You can save your card after completing a successful payment.
          </p>
        </div>
      )}

      {paymentMethods.length > 0 && (
        <button
          type="button"
          className="saved-payment-methods__pay-button"
          onClick={handlePayWithSavedCard}
          disabled={
            !selectedPaymentMethod ||
            paymentLoading ||
            !!deletingPaymentMethodId
          }
        >
          {paymentLoading ? (
            <LoaderCircle
              className="saved-payment-methods__loading-spinner"
              size={19}
            />
          ) : (
            <>
              <LockKeyhole size={17} />
              <span className="saved-payment-methods__pay-button-text">
                Pay with saved card
              </span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      )}

      {renderNewCardButton()}

      <div className="saved-payment-methods__security-note">
        <ShieldCheck size={15} color="#15803D" aria-hidden="true" />
        <p className="saved-payment-methods__security-note-text">
          Your full card number and CVV are never stored by Atua.
        </p>
      </div>
    </section>
  );
};

export default SavedPaymentMethods;
