/* Amplify Params - DO NOT EDIT
	API_ATUA_GRAPHQLAPIENDPOINTOUTPUT
	API_ATUA_GRAPHQLAPIIDOUTPUT
	API_ATUA_GRAPHQLAPIKEYOUTPUT
	ENV
	REGION
 Amplify Params - DO NOT EDIT */

const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");

const https = require("https");
const crypto = require("crypto");

/* ==========================================================
   CONFIGURATION
========================================================== */

const GRAPHQL_ENDPOINT = process.env.API_ATUA_GRAPHQLAPIENDPOINTOUTPUT;

const GRAPHQL_API_KEY = process.env.API_ATUA_GRAPHQLAPIKEYOUTPUT;

const REGION = process.env.REGION || process.env.AWS_REGION;

/* ==========================================================
   GET PAYSTACK SECRET
========================================================== */

const getPaystackSecretKey = async () => {
  const parameterName = process.env.PAYSTACK_SECRET_KEY;

  if (!parameterName) {
    throw new Error("PAYSTACK_SECRET_KEY secret is not configured.");
  }

  const ssmClient = new SSMClient({
    region: REGION,
  });

  const command = new GetParameterCommand({
    Name: parameterName,
    WithDecryption: true,
  });

  const result = await ssmClient.send(command);

  const secretKey = result?.Parameter?.Value;

  if (!secretKey) {
    throw new Error("Could not retrieve Paystack secret key.");
  }

  return secretKey;
};

/* ==========================================================
   GENERATE DELIVERY VERIFICATION CODE
========================================================== */

const generateVerificationCode = () => {
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
};

/* ==========================================================
   GRAPHQL REQUEST
========================================================== */

const graphqlRequest = async (
  query,
  variables = {},
  operationName = "GraphQL operation",
) => {
  if (!GRAPHQL_ENDPOINT) {
    throw new Error("Atua GraphQL endpoint is not configured.");
  }

  if (!GRAPHQL_API_KEY) {
    throw new Error("Atua GraphQL API key is not configured.");
  }

  const endpoint = new URL(GRAPHQL_ENDPOINT);

  const body = JSON.stringify({
    query,
    variables,
  });

  const options = {
    hostname: endpoint.hostname,

    path: endpoint.pathname || "/graphql",

    method: "POST",

    headers: {
      "Content-Type": "application/json",

      "Content-Length": Buffer.byteLength(body),

      "x-api-key": GRAPHQL_API_KEY,
    },
  };

  return new Promise((resolve, reject) => {
    const request = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        /* ------------------------------------------
                   HTTP ERROR
                ------------------------------------------ */

        if (res.statusCode < 200 || res.statusCode >= 300) {
          console.error(`${operationName} HTTP ERROR:`, {
            statusCode: res.statusCode,

            body: data,
          });

          return reject(
            new Error(`${operationName} returned HTTP ${res.statusCode}.`),
          );
        }

        /* ------------------------------------------
                   PARSE RESPONSE
                ------------------------------------------ */

        let parsed;

        try {
          parsed = JSON.parse(data);
        } catch (error) {
          console.error(`${operationName} PARSE ERROR:`, {
            rawResponse: data,

            error: error.message,
          });

          return reject(error);
        }

        /* ------------------------------------------
                   GRAPHQL ERRORS
                ------------------------------------------ */

        if (parsed?.errors?.length) {
          console.error(
            `${operationName} GRAPHQL ERRORS:`,
            JSON.stringify(parsed.errors),
          );

          return reject(
            new Error(
              parsed.errors
                .map((item) => item?.message)
                .filter(Boolean)
                .join(" | ") || `${operationName} failed.`,
            ),
          );
        }

        resolve(parsed?.data || null);
      });
    });

    request.on("error", (error) => {
      console.error(`${operationName} REQUEST ERROR:`, error);

      reject(error);
    });

    request.write(body);

    request.end();
  });
};

/* ==========================================================
   GET ORDER
========================================================== */

const getOrder = async (orderId) => {
  if (!orderId) {
    throw new Error("Order ID is required.");
  }

  const query = `
    query GetOrder($id: ID!) {
      getOrder(id: $id) {
        id
        userID
        totalPrice
        status
        paymentStatus
        paymentID
        payoutStatus
        fundsStatus
        deliveryVerificationCode
        courierEarnings

        # ----------------------------------------------
        # ASSIGNMENT / DISPATCH
        # ----------------------------------------------

        assignedCourierId
        assignmentStatus
        assignmentExpiresAt
        assignmentAttempts
        lastAssignedAt
        dispatchAttemptedCourierIds
        dispatchRound
        dispatchRadiusKm
        dispatchMaxRadiusKm

        # ----------------------------------------------
        # TIMESTAMPS / VERSION
        # ----------------------------------------------

        createdAt
        updatedAt
        _version
        _lastChangedAt
        _deleted
      }
    }
  `;

  const data = await graphqlRequest(
    query,
    {
      id: orderId,
    },
    "GetOrder",
  );

  const order = data?.getOrder || null;

  if (!order) {
    console.error("ORDER NOT FOUND:", {
      orderId,
    });

    return null;
  }

  console.log("ORDER RETRIEVED:", {
    orderId: order.id,

    userID: order.userID,

    status: order.status,

    paymentStatus: order.paymentStatus,

    paymentID: order.paymentID,

    fundsStatus: order.fundsStatus,

    assignedCourierId: order.assignedCourierId,

    assignmentStatus: order.assignmentStatus,

    assignmentExpiresAt: order.assignmentExpiresAt,

    assignmentAttempts: order.assignmentAttempts,

    lastAssignedAt: order.lastAssignedAt,

    dispatchRound: order.dispatchRound,

    dispatchRadiusKm: order.dispatchRadiusKm,

    dispatchMaxRadiusKm: order.dispatchMaxRadiusKm,

    attemptedCouriers: order.dispatchAttemptedCourierIds?.length || 0,

    version: order._version,
  });

  return order;
};

/* ==========================================================
   GET PAYMENT BY REFERENCE
========================================================== */

const getPaymentByReference = async (reference) => {
  if (!reference) {
    throw new Error("Payment reference is required.");
  }

  const query = `
      query ListPayments(
        $filter: ModelPaymentFilterInput
      ) {
        listPayments(
          filter: $filter
          limit: 1
        ) {
          items {
            id
            orderID
            userID
            amount
            currency
            status
            paymentMethod
            provider
            reference
            createdAt
            updatedAt
            _version
            _lastChangedAt
            _deleted
          }
        }
      }
    `;

  const data = await graphqlRequest(
    query,
    {
      filter: {
        reference: {
          eq: reference,
        },
      },
    },
    "GetPaymentByReference",
  );

  const payment = data?.listPayments?.items?.[0] || null;

  if (payment) {
    console.log("EXISTING PAYMENT FOUND:", {
      paymentId: payment.id,

      orderID: payment.orderID,

      userID: payment.userID,

      reference: payment.reference,

      amount: payment.amount,

      status: payment.status,
    });
  }

  return payment;
};

/* ==========================================================
   CREATE PAYMENT
========================================================== */

const createPayment = async ({ order, transaction }) => {
  if (!order?.id) {
    throw new Error("Order is required to create payment.");
  }

  if (!order?.userID) {
    throw new Error("Order userID is required to create payment.");
  }

  if (!transaction) {
    throw new Error("Paystack transaction is required.");
  }

  const mutation = `
    mutation CreatePayment(
      $input: CreatePaymentInput!
    ) {
      createPayment(
        input: $input
      ) {
        id
        orderID
        userID
        amount
        currency
        status
        paymentMethod
        provider
        reference
        createdAt
        updatedAt
        _version
        _lastChangedAt
        _deleted
      }
    }
  `;

  const paymentMethod = transaction.channel || "paystack";

  const input = {
    orderID: order.id,

    userID: order.userID,

    amount: Number(order.totalPrice),

    currency: transaction.currency,

    status: "SUCCESS",

    paymentMethod,

    provider: "PAYSTACK",

    reference: transaction.reference,
  };

  console.log("CREATING PAYMENT:", {
    orderID: input.orderID,

    userID: input.userID,

    amount: input.amount,

    currency: input.currency,

    paymentMethod: input.paymentMethod,

    provider: input.provider,

    reference: input.reference,
  });

  const data = await graphqlRequest(
    mutation,
    {
      input,
    },
    "CreatePayment",
  );

  const payment = data?.createPayment || null;

  console.log(
    "PAYMENT CREATE RESULT:",
    payment
      ? {
          id: payment.id,

          orderID: payment.orderID,

          userID: payment.userID,

          amount: payment.amount,

          currency: payment.currency,

          status: payment.status,

          reference: payment.reference,

          version: payment._version,
        }
      : null,
  );

  return payment;
};

/* ==========================================================
   UPDATE ORDER AS PAID
========================================================== */

const markOrderAsPaid = async ({ order, paymentId, verificationCode }) => {
  if (!order?.id) {
    throw new Error("Order is required before it can be marked as paid.");
  }

  if (!paymentId) {
    throw new Error(
      "Payment ID is required before the order can be marked as paid.",
    );
  }

  if (!verificationCode) {
    throw new Error("Delivery verification code is required.");
  }

  /*
  ==========================================================
  IMPORTANT

  Payment verification ONLY changes payment-related fields.

  It does NOT modify:

    assignedCourierId
    assignmentStatus
    assignmentExpiresAt
    assignmentAttempts
    lastAssignedAt
    dispatchAttemptedCourierIds
    dispatchRound
    dispatchRadiusKm
    dispatchMaxRadiusKm

  Those belong to courier dispatch.

  ==========================================================
  */

  const mutation = `
    mutation UpdateOrder(
      $input: UpdateOrderInput!
    ) {
      updateOrder(
        input: $input
      ) {
        id
        status
        paymentStatus
        paymentID
        fundsStatus
        deliveryVerificationCode
        payoutStatus
        createdAt
        updatedAt
        _version
        _lastChangedAt
        _deleted
      }
    }
  `;

  const input = {
    id: order.id,

    paymentStatus: "PAID",

    paymentID: paymentId,

    fundsStatus: "HELD",

    status: "READY_FOR_PICKUP",

    deliveryVerificationCode: verificationCode,
  };

  /*
  ----------------------------------------------------------
  OPTIMISTIC CONCURRENCY
  ----------------------------------------------------------

  Keep the version exactly like the old implementation.

  ----------------------------------------------------------
  */

  if (Number.isInteger(order._version)) {
    input._version = order._version;
  }

  console.log("MARKING ORDER AS PAID:", {
    orderId: order.id,

    userID: order.userID,

    paymentId,

    currentVersion: order._version,

    paymentStatus: input.paymentStatus,

    fundsStatus: input.fundsStatus,

    status: input.status,

    assignedCourierId: order.assignedCourierId,

    assignmentStatus: order.assignmentStatus,

    dispatchRound: order.dispatchRound,

    attemptedCouriers: order.dispatchAttemptedCourierIds?.length || 0,
  });

  const data = await graphqlRequest(
    mutation,
    {
      input,
    },
    "MarkOrderAsPaid",
  );

  const updatedOrder = data?.updateOrder || null;

  if (!updatedOrder) {
    throw new Error("Order update returned no order.");
  }

  console.log("ORDER MARKED AS PAID:", {
    orderId: updatedOrder.id,

    paymentStatus: updatedOrder.paymentStatus,

    paymentID: updatedOrder.paymentID,

    fundsStatus: updatedOrder.fundsStatus,

    status: updatedOrder.status,

    version: updatedOrder._version,
  });

  return updatedOrder;
};

/* ==========================================================
   SAVE DELIVERY VERIFICATION CODE
========================================================== */

const saveVerificationCode = async ({ order, verificationCode }) => {
  if (!order?.id) {
    throw new Error("Order is required before saving verification code.");
  }

  if (!verificationCode) {
    throw new Error("Verification code is required.");
  }

  const mutation = `
      mutation UpdateOrder(
        $input: UpdateOrderInput!
      ) {
        updateOrder(
          input: $input
        ) {
          id
          paymentStatus
          paymentID
          fundsStatus
          status
          deliveryVerificationCode
          payoutStatus
          createdAt
          updatedAt
          _version
          _lastChangedAt
          _deleted
        }
      }
    `;

  const input = {
    id: order.id,

    deliveryVerificationCode: verificationCode,
  };

  if (Number.isInteger(order._version)) {
    input._version = order._version;
  }

  console.log("SAVING DELIVERY VERIFICATION CODE:", {
    orderId: order.id,

    userID: order.userID,

    currentVersion: order._version,
  });

  const data = await graphqlRequest(
    mutation,
    {
      input,
    },
    "SaveVerificationCode",
  );

  const updatedOrder = data?.updateOrder || null;

  if (!updatedOrder) {
    throw new Error("Verification code update returned no order.");
  }

  return updatedOrder;
};

/* ==========================================================
   VERIFY TRANSACTION WITH PAYSTACK
========================================================== */

const verifyWithPaystack = async (reference, secretKey) => {
  if (!reference) {
    throw new Error("Payment reference is required.");
  }

  if (!secretKey) {
    throw new Error("Paystack secret key is required.");
  }

  const encodedReference = encodeURIComponent(reference);

  const options = {
    hostname: "api.paystack.co",

    path: `/transaction/verify/${encodedReference}`,

    method: "GET",

    headers: {
      Authorization: `Bearer ${secretKey}`,

      Accept: "application/json",
    },
  };

  return new Promise((resolve, reject) => {
    const request = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);

          resolve({
            statusCode: res.statusCode,

            body: parsed,
          });
        } catch (error) {
          console.error("PAYSTACK PARSE ERROR:", error);

          reject(error);
        }
      });
    });

    request.on("error", (error) => {
      console.error("PAYSTACK REQUEST ERROR:", error);

      reject(error);
    });

    request.end();
  });
};

/* ==========================================================
   FAILURE RESULT
========================================================== */

const failureResult = (message, orderId = null) => {
  return {
    success: false,

    verified: false,

    alreadyPaid: false,

    message,

    orderId,

    deliveryVerificationCode: null,

    payment: null,
  };
};

/* ==========================================================
   PAYMENT RESPONSE DETAILS
========================================================== */

const buildPaymentDetails = ({
  reference,
  amount,
  currency,
  status,
  channel,
  paidAt,
}) => {
  return {
    reference: reference || null,

    amount: Number(amount),

    currency: currency || null,

    status: status || null,

    channel: channel || null,

    paidAt: paidAt || null,
  };
};

/* ==========================================================
   MAIN LAMBDA HANDLER
========================================================== */

exports.handler = async (event) => {
  console.log("==================================================");

  console.log("🚀 VERIFY ATUA PAYMENT LAMBDA STARTED");

  console.log("==================================================");

  try {
    /* ======================================================
       1. GET INPUT
    ====================================================== */

    const { orderId, reference } = event?.arguments || {};

    console.log("PAYMENT VERIFICATION REQUEST:", {
      orderId,
      reference,
    });

    if (!orderId) {
      return failureResult("Order ID is required.");
    }

    if (!reference) {
      return failureResult("Payment reference is required.", orderId);
    }

    /* ======================================================
       2. GET ORDER
    ====================================================== */

    let order = await getOrder(orderId);

    if (!order) {
      return failureResult("Order could not be found.", orderId);
    }

    /* ======================================================
       3. VALIDATE ORDER
    ====================================================== */

    if (!order.userID) {
      console.error("ORDER HAS NO USER ID:", {
        orderId: order.id,
      });

      return failureResult("Order does not have a user ID.", order.id);
    }

    const orderAmount = Number(order.totalPrice);

    if (!Number.isFinite(orderAmount) || orderAmount <= 0) {
      return failureResult("Order has an invalid payment amount.", order.id);
    }

    /* ======================================================
       4. GET PAYSTACK SECRET
    ====================================================== */

    const secretKey = await getPaystackSecretKey();

    console.log("✅ PAYSTACK SECRET RETRIEVED");

    /* ======================================================
       5. VERIFY PAYSTACK TRANSACTION
    ====================================================== */

    const verification = await verifyWithPaystack(reference, secretKey);

    const paystack = verification?.body;

    console.log("PAYSTACK VERIFICATION RESPONSE:", {
      statusCode: verification?.statusCode,

      success: paystack?.status,

      message: paystack?.message,

      transactionStatus: paystack?.data?.status,

      reference: paystack?.data?.reference,

      amount: paystack?.data?.amount,

      currency: paystack?.data?.currency,
    });

    if (
      !verification ||
      verification.statusCode < 200 ||
      verification.statusCode >= 300 ||
      !paystack?.status
    ) {
      return failureResult(
        paystack?.message || "Payment could not be verified.",
        order.id,
      );
    }

    /* ======================================================
       6. GET TRANSACTION
    ====================================================== */

    const transaction = paystack?.data;

    if (!transaction) {
      return failureResult(
        "Paystack returned an invalid transaction.",
        order.id,
      );
    }

    /* ======================================================
       7. VERIFY TRANSACTION STATUS
    ====================================================== */

    if (transaction.status !== "success") {
      return failureResult(
        "Payment has not been successfully completed.",
        order.id,
      );
    }

    /* ======================================================
       8. VERIFY REFERENCE
    ====================================================== */

    if (transaction.reference !== reference) {
      console.error("❌ PAYMENT REFERENCE MISMATCH:", {
        requestedReference: reference,

        paystackReference: transaction.reference,
      });

      return failureResult("Payment reference does not match.", order.id);
    }

    /* ======================================================
       9. VERIFY CURRENCY
    ====================================================== */

    if (transaction.currency !== "NGN") {
      return failureResult(
        "Payment currency does not match the order.",
        order.id,
      );
    }

    /* ======================================================
       10. VERIFY AMOUNT
    ====================================================== */

    const expectedAmountInKobo = Math.round(orderAmount * 100);

    const paidAmountInKobo = Number(transaction.amount);

    console.log("PAYMENT AMOUNT CHECK:", {
      orderAmount,

      expectedAmountInKobo,

      paidAmountInKobo,
    });

    if (!Number.isFinite(paidAmountInKobo)) {
      return failureResult(
        "Paystack returned an invalid payment amount.",
        order.id,
      );
    }

    if (paidAmountInKobo !== expectedAmountInKobo) {
      console.error("❌ PAYMENT AMOUNT MISMATCH:", {
        orderId: order.id,

        expectedAmountInKobo,

        paidAmountInKobo,
      });

      return failureResult(
        "The amount paid does not match the order total.",
        order.id,
      );
    }

    /* ======================================================
       11. PAYMENT VERIFIED
    ====================================================== */

    console.log("✅ PAYSTACK PAYMENT VERIFIED:", {
      orderId: order.id,

      reference: transaction.reference,

      amount: orderAmount,

      currency: transaction.currency,

      status: transaction.status,
    });

    /* ======================================================
       12. CHECK EXISTING PAYMENT
    ====================================================== */

    let payment = await getPaymentByReference(transaction.reference);

    /* ======================================================
       13. CREATE PAYMENT IF NECESSARY
    ====================================================== */

    if (payment) {
      /*
      --------------------------------------------------------
      SECURITY CHECK

      A payment reference must never be reused against
      another order.
      --------------------------------------------------------
      */

      if (payment.orderID && payment.orderID !== order.id) {
        console.error(
          "❌ PAYMENT REFERENCE ALREADY BELONGS TO ANOTHER ORDER:",
          {
            reference: transaction.reference,

            existingOrderId: payment.orderID,

            attemptedOrderId: order.id,
          },
        );

        return failureResult(
          "This payment reference has already been used for another order.",
          order.id,
        );
      }

      console.log("ℹ️ EXISTING PAYMENT WILL BE REUSED:", {
        paymentId: payment.id,

        orderId: payment.orderID,

        reference: payment.reference,
      });
    } else {
      payment = await createPayment({
        order,
        transaction,
      });

      /*
      --------------------------------------------------------
      RACE CONDITION PROTECTION

      If another Lambda invocation created the payment
      at the same time, try finding it again.
      --------------------------------------------------------
      */

      if (!payment?.id) {
        console.log("PAYMENT CREATE RETURNED NO RECORD. RETRYING LOOKUP.");

        payment = await getPaymentByReference(transaction.reference);

        if (!payment?.id) {
          throw new Error("Payment record could not be created.");
        }
      }

      console.log("✅ PAYMENT RECORD READY:", {
        paymentId: payment.id,

        orderId: payment.orderID,

        reference: payment.reference,
      });
    }

    /* ======================================================
       14. REFRESH ORDER
    ====================================================== */

    order = await getOrder(order.id);

    if (!order) {
      throw new Error("Order could not be reloaded before payment processing.");
    }

    /*
      VERY IMPORTANT:

      Make sure the refreshed Order still has userID.

      This lets us detect a bad Order before we perform
      another update.
    */

    if (!order.userID) {
      throw new Error("Refreshed order does not contain userID.");
    }

    /* ======================================================
       15. ALREADY PAID?
    ====================================================== */

    if (order.paymentStatus === "PAID") {
      console.log("ℹ️ ORDER IS ALREADY PAID.");

      /*
      --------------------------------------------------------
      If the order already has a verification code,
      everything is already complete.
      --------------------------------------------------------
      */

      if (order.deliveryVerificationCode) {
        return {
          success: true,

          verified: true,

          alreadyPaid: true,

          message: "This order has already been paid.",

          orderId: order.id,

          deliveryVerificationCode: order.deliveryVerificationCode,

          payment: buildPaymentDetails({
            reference: transaction.reference,

            amount: orderAmount,

            currency: transaction.currency,

            status: transaction.status,

            channel: transaction.channel,

            paidAt: transaction.paid_at,
          }),
        };
      }

      /* ====================================================
         PAID BUT NO VERIFICATION CODE
      ==================================================== */

      const verificationCode = generateVerificationCode();

      console.log("⚠️ ORDER IS PAID BUT HAS NO VERIFICATION CODE.");

      const updatedOrder = await saveVerificationCode({
        order,
        verificationCode,
      });

      if (!updatedOrder) {
        throw new Error("Delivery verification code could not be saved.");
      }

      const confirmedOrder = await getOrder(order.id);

      if (!confirmedOrder) {
        throw new Error(
          "Could not reload order after saving delivery verification code.",
        );
      }

      if (!confirmedOrder.userID) {
        throw new Error("Order lost userID after verification-code update.");
      }

      if (!confirmedOrder.deliveryVerificationCode) {
        throw new Error("Delivery verification code was not saved.");
      }

      return {
        success: true,

        verified: true,

        alreadyPaid: true,

        message: "This order has already been paid.",

        orderId: confirmedOrder.id,

        deliveryVerificationCode: confirmedOrder.deliveryVerificationCode,

        payment: buildPaymentDetails({
          reference: transaction.reference,

          amount: orderAmount,

          currency: transaction.currency,

          status: transaction.status,

          channel: transaction.channel,

          paidAt: transaction.paid_at,
        }),
      };
    }
    /* ======================================================
       16. GENERATE VERIFICATION CODE
    ====================================================== */

    const verificationCode =
      order.deliveryVerificationCode || generateVerificationCode();

    console.log("DELIVERY VERIFICATION CODE READY:", {
      orderId: order.id,

      reused: Boolean(order.deliveryVerificationCode),
    });

    /* ======================================================
       17. MARK ORDER AS PAID
    ====================================================== */

    const updatedOrder = await markOrderAsPaid({
      order,
      paymentId: payment.id,
      verificationCode,
    });

    if (!updatedOrder) {
      throw new Error("Order could not be updated after payment.");
    }

    /* ======================================================
       18. REFRESH AND CONFIRM
    ====================================================== */

    const confirmedOrder = await getOrder(order.id);

    if (!confirmedOrder) {
      throw new Error("Could not reload order after payment update.");
    }

    /*
    --------------------------------------------------------
    IMPORTANT

    userID is required by the Order model.

    If the update caused the returned Order to lose
    userID, stop here rather than allowing a malformed
    subscription/update to continue.
    --------------------------------------------------------
    */

    if (!confirmedOrder.userID) {
      throw new Error("Order does not contain userID after payment update.");
    }

    /* ======================================================
       19. LOG FINAL ORDER STATE
    ====================================================== */

    console.log("==================================================");

    console.log("✅ CONFIRMED ORDER AFTER PAYMENT:");

    console.log({
      orderId: confirmedOrder.id,

      userID: confirmedOrder.userID,

      paymentStatus: confirmedOrder.paymentStatus,

      paymentID: confirmedOrder.paymentID,

      fundsStatus: confirmedOrder.fundsStatus,

      status: confirmedOrder.status,

      deliveryVerificationCode: confirmedOrder.deliveryVerificationCode,

      /*
      ------------------------------------------------------
      DISPATCH STATE

      Payment verification must not destroy these fields.
      ------------------------------------------------------
      */

      assignedCourierId: confirmedOrder.assignedCourierId,

      assignmentStatus: confirmedOrder.assignmentStatus,

      assignmentExpiresAt: confirmedOrder.assignmentExpiresAt,

      assignmentAttempts: confirmedOrder.assignmentAttempts,

      lastAssignedAt: confirmedOrder.lastAssignedAt,

      dispatchAttemptedCourierIds: confirmedOrder.dispatchAttemptedCourierIds,

      dispatchRound: confirmedOrder.dispatchRound,

      dispatchRadiusKm: confirmedOrder.dispatchRadiusKm,

      dispatchMaxRadiusKm: confirmedOrder.dispatchMaxRadiusKm,

      version: confirmedOrder._version,
    });

    console.log("==================================================");

    /* ======================================================
       20. FINAL VALIDATION
    ====================================================== */

    if (confirmedOrder.paymentStatus !== "PAID") {
      throw new Error(
        `Order paymentStatus was not updated to PAID. Current value: ${confirmedOrder.paymentStatus}`,
      );
    }

    if (confirmedOrder.paymentID !== payment.id) {
      throw new Error(
        `Payment was not linked to the order. Expected ${payment.id}, received ${confirmedOrder.paymentID}.`,
      );
    }

    if (confirmedOrder.fundsStatus !== "HELD") {
      throw new Error(
        `Order fundsStatus was not set to HELD. Current value: ${confirmedOrder.fundsStatus}`,
      );
    }

    if (confirmedOrder.status !== "READY_FOR_PICKUP") {
      throw new Error(
        `Order was not activated for pickup. Current value: ${confirmedOrder.status}`,
      );
    }

    if (!confirmedOrder.deliveryVerificationCode) {
      throw new Error("Delivery verification code was not saved.");
    }

    /* ======================================================
       21. SUCCESS
    ====================================================== */

    console.log("==================================================");

    console.log("🎉 PAYMENT SUCCESSFULLY VERIFIED AND RECORDED");

    console.log("==================================================");

    return {
      success: true,

      verified: true,

      alreadyPaid: false,

      message: "Payment successfully verified and recorded.",

      orderId: confirmedOrder.id,

      deliveryVerificationCode: confirmedOrder.deliveryVerificationCode,

      payment: buildPaymentDetails({
        reference: transaction.reference,

        amount: orderAmount,

        currency: transaction.currency,

        status: transaction.status,

        channel: transaction.channel,

        paidAt: transaction.paid_at,
      }),
    };
  } catch (error) {
    /* ======================================================
       ERROR LOGGING
    ====================================================== */

    console.error("==================================================");

    console.error("❌ VERIFY ATUA PAYMENT ERROR");

    console.error("==================================================");

    console.error("ERROR:", error);

    console.error("ERROR MESSAGE:", error?.message);

    console.error("ERROR STACK:", error?.stack);

    try {
      console.error(
        "ERROR DETAILS:",
        JSON.stringify(error, Object.getOwnPropertyNames(error), 2),
      );
    } catch (stringifyError) {
      console.error("ERROR DETAILS COULD NOT BE STRINGIFIED:", stringifyError);
    }

    /* ======================================================
       FAILURE RESPONSE
    ====================================================== */

    return {
      success: false,

      verified: false,

      alreadyPaid: false,

      message:
        error?.message ||
        "Something went wrong while verifying and recording the payment.",

      orderId: event?.arguments?.orderId || null,

      deliveryVerificationCode: null,

      payment: null,
    };
  }
};
