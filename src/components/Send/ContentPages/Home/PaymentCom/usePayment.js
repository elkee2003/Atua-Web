import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { toast } from "react-toastify";

import PaystackPop from "@paystack/inline-js";

import { generateClient } from "aws-amplify/api";
import { DataStore } from "aws-amplify/datastore";

import { Order } from "../../../../../models";
import { verifyAtuaPayment } from "../../../../../graphql/mutations";

import { useAuthContext } from "../../../../../../Providers/ClientProvider/AuthProvider";
import { useLocationContext } from "../../../../../../Providers/ClientProvider/LocationProvider";
import { useOrderContext } from "../../../../../../Providers/ClientProvider/OrderProvider";

//==================================================
// AMPLIFY GRAPHQL CLIENT
//==================================================

const client = generateClient();

//==================================================
// PAYSTACK
//==================================================

const paystack = new PaystackPop();

//==================================================
// PAYSTACK PUBLIC KEY
//==================================================

const PAYSTACK_PUBLIC_KEY =
    import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

//==================================================
// USE PAYMENT
//==================================================

function usePayment() {

    //------------------------------------------------
    // ROUTER
    //------------------------------------------------

    const navigate = useNavigate();

    const { orderId } = useParams();

    //------------------------------------------------
    // CONTEXT
    //------------------------------------------------

    const { dbUser } = useAuthContext();

    const { resetAllOrderFields } =
        useOrderContext();

    const { resetAllLocationFields } =
        useLocationContext();

    //------------------------------------------------
    // STATE
    //------------------------------------------------

    const [order, setOrder] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [
        paymentLoading,
        setPaymentLoading,
    ] = useState(false);

    const [error, setError] =
        useState("");

    //------------------------------------------------
    // FETCH ORDER
    //------------------------------------------------

    const fetchOrder = useCallback(async () => {

        try {

            setLoading(true);

            setError("");

            //-----------------------------------------
            // Validate Order ID
            //-----------------------------------------

            if (!orderId) {

                throw new Error(
                    "Order ID was not provided."
                );

            }

            //-----------------------------------------
            // Fetch Order
            //-----------------------------------------

            const savedOrder =
                await DataStore.query(
                    Order,
                    orderId
                );

            if (!savedOrder) {

                throw new Error(
                    "Order could not be found."
                );

            }

            //-----------------------------------------
            // Validate Ownership
            //-----------------------------------------

            if (
                savedOrder.userID !== dbUser?.id
            ) {

                throw new Error(
                    "You are not authorized to make payment for this order."
                );

            }

            //-----------------------------------------
            // Save Order
            //-----------------------------------------

            setOrder(savedOrder);

        } catch (err) {

            console.error(
                "FETCH PAYMENT ORDER ERROR:",
                err
            );

            setError(

                err?.message ||

                "Something went wrong while loading your order."

            );

            setOrder(null);

        } finally {

            setLoading(false);

        }

    }, [

        orderId,

        dbUser,

    ]);

    //------------------------------------------------
    // LOAD ORDER
    //------------------------------------------------

    useEffect(() => {

        if (dbUser?.id) {

            fetchOrder();

        }

    }, [

        dbUser?.id,

        fetchOrder,

    ]);

    //------------------------------------------------
    // PAYMENT AMOUNT
    //------------------------------------------------

    const amount = useMemo(() => {

        return Number(
            order?.totalPrice || 0
        );

    }, [

        order,

    ]);

    //------------------------------------------------
    // FORMATTED AMOUNT
    //------------------------------------------------

    const formattedAmount =
        useMemo(() => {

            return amount.toLocaleString(
                "en-NG",
                {

                    minimumFractionDigits: 2,

                    maximumFractionDigits: 2,

                }
            );

        }, [

            amount,

        ]);

    //------------------------------------------------
    // FORMAT MONEY
    //------------------------------------------------

    const formatMoney = useCallback((value) => {

        return Number(
            value || 0
        ).toLocaleString(
            "en-NG",
            {

                minimumFractionDigits: 2,

                maximumFractionDigits: 2,

            }
        );

    }, []);

    //------------------------------------------------
    // COMPLETE PAYMENT FLOW
    //------------------------------------------------

    const completePaymentFlow =
        useCallback((paidOrderId) => {

            if (!paidOrderId) {
                return;
            }

            //-----------------------------------------
            // Reset Checkout Context
            //-----------------------------------------

            resetAllOrderFields();

            resetAllLocationFields();

            //-----------------------------------------
            // Navigate To Tracking
            //-----------------------------------------

            navigate(

                `/send/order_tracking_screen/${paidOrderId}`,

                {
                    replace: true,
                }

            );

        }, [

            navigate,

            resetAllOrderFields,

            resetAllLocationFields,

        ]);

    //------------------------------------------------
    // EXTRACT PAYSTACK REFERENCE
    //------------------------------------------------

    const getPaymentReference =
        useCallback((response) => {

            return (

                response?.reference ||

                response?.trxref ||

                response?.transaction ||

                response?.transactionRef?.reference ||

                response?.transactionRef ||

                response?.data?.reference ||

                null

            );

        }, []);
    //================================================
    // PAYSTACK SUCCESS
    //================================================

    const handleSuccess = useCallback(async (response) => {

        try {

            setPaymentLoading(true);

            console.log(
                "PAYSTACK SUCCESS RESPONSE:",
                response
            );

            //-----------------------------------------
            // Extract Reference
            //-----------------------------------------

            const reference =
                getPaymentReference(response);

            console.log(
                "PAYSTACK REFERENCE:",
                reference
            );

            if (!reference) {

                throw new Error(
                    "Payment was completed, but the transaction reference could not be found."
                );

            }

            //-----------------------------------------
            // Validate Order
            //-----------------------------------------

            if (!order?.id) {

                throw new Error(
                    "The order could not be found for payment verification."
                );

            }

            //-----------------------------------------
            // Verify Payment
            //-----------------------------------------

            console.log(
                "VERIFYING PAYMENT WITH ATUA..."
            );

            const result =
                await client.graphql({

                    query: verifyAtuaPayment,

                    variables: {

                        orderId: order.id,

                        reference,

                    },

                });

            console.log(
                "ATUA VERIFICATION RESPONSE:",
                result
            );

            //-----------------------------------------
            // Extract Result
            //-----------------------------------------

            const verification =
                result?.data?.verifyAtuaPayment;

            console.log(
                "ATUA PAYMENT VERIFICATION:",
                verification
            );

            if (!verification) {

                throw new Error(
                    "The payment verification service returned an invalid response."
                );

            }

            //-----------------------------------------
            // Verification Failed
            //-----------------------------------------

            if (

                !verification.success ||

                !verification.verified

            ) {

                throw new Error(

                    verification.message ||

                    "Your payment could not be verified."

                );

            }

            //-----------------------------------------
            // Wrong Order
            //-----------------------------------------

            if (

                verification.orderId &&

                verification.orderId !== order.id

            ) {

                throw new Error(
                    "The verified payment does not match this order."
                );

            }

            //-----------------------------------------
            // Verification Code
            //-----------------------------------------

            const verificationCode =
                verification.deliveryVerificationCode;

            if (!verificationCode) {

                throw new Error(
                    "Payment was verified, but the delivery verification code could not be retrieved."
                );

            }

            //-----------------------------------------
            // Confirmation Log
            //-----------------------------------------

            console.log(
                "PAYMENT CONFIRMED:",
                {

                    orderId:
                        verification.orderId ||
                        order.id,

                    reference:
                        verification.payment?.reference ||
                        reference,

                    amount:
                        verification.payment?.amount ??
                        amount,

                    alreadyPaid:
                        verification.alreadyPaid,

                    deliveryVerificationCode:
                        verificationCode,

                }
            );

            //-----------------------------------------
            // Success
            //-----------------------------------------

            toast.success(

                verification.alreadyPaid

                    ? `Payment confirmed. Delivery Verification Code: ${verificationCode}`

                    : `Payment successful. Delivery Verification Code: ${verificationCode}`,

                {

                    autoClose: 8000,

                }

            );

            completePaymentFlow(order.id);

        } catch (err) {

            console.error(
                "PAYMENT VERIFICATION ERROR:",
                err
            );

            //-----------------------------------------
            // GraphQL Error
            //-----------------------------------------

            const graphQLError =
                err?.errors?.[0]?.message;

            const message =

                graphQLError ||

                err?.message ||

                "We could not confirm your payment.";

            toast.error(

                `${message} If payment was debited, please do not make another payment.`,

                {

                    autoClose: 7000,

                }

            );

        } finally {

            setPaymentLoading(false);

        }

    }, [

        amount,

        order,

        completePaymentFlow,

        getPaymentReference,

    ]);

    //================================================
    // PAYSTACK CANCEL
    //================================================

    const handleCancel = useCallback(() => {

        setPaymentLoading(false);

        toast.info(
            "Payment cancelled."
        );

    }, []);

    //================================================
    // START PAYMENT
    //================================================

    const handlePay = useCallback(async () => {

        //-----------------------------------------
        // Prevent Multiple Presses
        //-----------------------------------------

        if (paymentLoading) {
            return;
        }

        //-----------------------------------------
        // Validate Order
        //-----------------------------------------

        if (!order?.id) {

            toast.error(
                "We could not find the order you are trying to pay for."
            );

            return;

        }

        //-----------------------------------------
        // Validate Email
        //-----------------------------------------

        if (!dbUser?.email) {

            toast.error(
                "An email address is required to process your payment."
            );

            return;

        }

        //-----------------------------------------
        // Validate Amount
        //-----------------------------------------

        if (

            !Number.isFinite(amount) ||

            amount <= 0

        ) {

            toast.error(
                "The payment amount for this order is invalid."
            );

            return;

        }

        //-----------------------------------------
        // Already Paid
        //-----------------------------------------

        if (order.paymentStatus === "PAID") {

            if (order.deliveryVerificationCode) {

                toast.success(
                    `This order has already been paid.\nDelivery Verification Code: ${order.deliveryVerificationCode}`,
                    {
                        autoClose: 7000,
                    }
                );

                completePaymentFlow(order.id);

                return;

            }

            toast.info(
                "This order has already been paid."
            );

            completePaymentFlow(order.id);

            return;

        }

        //-----------------------------------------
        // Loading
        //-----------------------------------------

        setPaymentLoading(true);

        //-----------------------------------------
        // Generate Reference
        //-----------------------------------------

        const reference = `ATUA_${order.id}_${Date.now()}`;

        console.log(
            "STARTING PAYSTACK PAYMENT:",
            {
                orderId: order.id,
                amount,
                reference,
            }
        );

        try {

            paystack.newTransaction({

                key: PAYSTACK_PUBLIC_KEY,

                email: dbUser.email,

                amount: Math.round(amount * 100),

                currency: "NGN",

                reference,

                metadata: {

                    orderId: order.id,

                    userId: dbUser.id,

                    custom_fields: [

                        {

                            display_name:
                                "Order ID",

                            variable_name:
                                "order_id",

                            value:
                                order.id,

                        },

                        {

                            display_name:
                                "User ID",

                            variable_name:
                                "user_id",

                            value:
                                dbUser.id,

                        },

                    ],

                },

                onSuccess: (transaction) => {

                    console.log(
                        "PAYSTACK SUCCESS:",
                        transaction
                    );

                    handleSuccess(transaction);

                },

                onCancel: () => {

                    console.log(
                        "PAYSTACK CANCELLED"
                    );

                    handleCancel();

                },

            });

        } catch (error) {

            console.error(
                "START PAYMENT ERROR:",
                error
            );

            setPaymentLoading(false);

            toast.error(

                error?.message ||

                "Unable to launch the payment page."

            );

        }

    }, [

        amount,

        dbUser,

        order,

        paymentLoading,

        completePaymentFlow,

        handleSuccess,

        handleCancel,

    ]);

    //================================================
    // BACK
    //================================================

    const handleBack = useCallback(() => {

        if (paymentLoading) {
            return;
        }

        navigate(-1);

    }, [

        navigate,

        paymentLoading,

    ]);

    //================================================
    // RETRY
    //================================================

    const handleRetry = useCallback(() => {

        fetchOrder();

    }, [

        fetchOrder,

    ]);

    //================================================
    // RETURN
    //================================================

    return {

        //-----------------------------------------
        // State
        //-----------------------------------------

        order,

        loading,

        error,

        paymentLoading,

        //-----------------------------------------
        // Amount
        //-----------------------------------------

        amount,

        formattedAmount,

        formatMoney,

        //-----------------------------------------
        // Actions
        //-----------------------------------------

        fetchOrder,

        handleRetry,

        handleBack,

        handlePay,

        //-----------------------------------------
        // Paystack
        //-----------------------------------------

        handleSuccess,

        handleCancel,

    };

}

export default usePayment;