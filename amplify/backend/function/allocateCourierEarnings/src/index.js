/**
 * ============================================================
 * Atua - allocateCourierEarnings Lambda
 * ============================================================
 *
 * PURPOSE
 * -------
 * Allocates a courier's earnings from a PAID order into the
 * courier's PENDING wallet balance.
 *
 * IMPORTANT FLOW
 * --------------
 *
 * Paystack payment succeeds
 *        ↓
 * Paystack webhook
 *        ↓
 * Order.paymentStatus = PAID
 * Order.fundsStatus = HELD
 * earningsAllocationStatus = null
 *        ↓
 * Courier gets assigned
 *        ↓
 * allocateCourierEarnings
 *        ↓
 * null / empty → PROCESSING
 *        ↓
 * PROCESSING → ALLOCATED
 *
 * WHAT THIS LAMBDA DOES
 * ---------------------
 * 1. Confirms the order exists.
 * 2. Confirms payment is PAID.
 * 3. Confirms a courier is assigned.
 * 4. Confirms courier earnings are greater than zero.
 * 5. Claims the allocation operation.
 * 6. Finds the courier.
 * 7. Finds the courier wallet.
 * 8. Creates/reuses the earnings transaction.
 * 9. Adds earnings to pendingBalance.
 * 10. Adds earnings to lifetimeEarnings.
 * 11. Finalizes the Order as ALLOCATED.
 *
 * IMPORTANT
 * ---------
 * This Lambda DOES NOT move money into availableBalance.
 *
 * Courier earnings remain in pendingBalance until:
 *
 * Micro / Moto:
 *     releaseFunds
 *
 * Maxi:
 *     releaseCourierMilestoneFunds
 *
 * ============================================================
 */

const fetch = require("node-fetch");

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

const GRAPHQL_ENDPOINT = process.env.API_ATUA_GRAPHQLAPIENDPOINTOUTPUT;

const GRAPHQL_API_KEY = process.env.API_ATUA_GRAPHQLAPIKEYOUTPUT;

// ============================================================
// BASIC VALIDATION
// ============================================================

if (!GRAPHQL_ENDPOINT) {
  console.warn("WARNING: API_ATUA_GRAPHQLAPIENDPOINTOUTPUT is not configured.");
}

if (!GRAPHQL_API_KEY) {
  console.warn("WARNING: API_ATUA_GRAPHQLAPIKEYOUTPUT is not configured.");
}

// ============================================================
// GRAPHQL HELPER
// ============================================================

async function graphqlRequest(query, variables = {}) {
  if (!GRAPHQL_ENDPOINT) {
    throw new Error("GraphQL endpoint is not configured.");
  }

  if (!GRAPHQL_API_KEY) {
    throw new Error("GraphQL API key is not configured.");
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "x-api-key": GRAPHQL_API_KEY,
    },

    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const responseText = await response.text();

  let data;

  try {
    data = JSON.parse(responseText);
  } catch (error) {
    throw new Error(
      `GraphQL returned a non-JSON response. HTTP ${response.status}: ${responseText}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      `GraphQL HTTP error ${response.status}: ${
        data?.errors ? JSON.stringify(data.errors) : responseText
      }`,
    );
  }

  if (data.errors && data.errors.length > 0) {
    throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`);
  }

  return data.data;
}

// ============================================================
// RESPONSE HELPERS
// ============================================================

function successResponse(body) {
  return {
    statusCode: 200,

    body: JSON.stringify({
      success: true,
      ...body,
    }),
  };
}

function errorResponse(error, extra = {}) {
  console.error("allocateCourierEarnings error:", error);

  return {
    statusCode: 500,

    body: JSON.stringify({
      success: false,
      message: error?.message || "Failed to allocate courier earnings.",

      ...extra,
    }),
  };
}

// ============================================================
// NORMALIZE MONEY
// ============================================================
//
// We use two decimal places for monetary calculations.
//
// Example:
// 10000 → 10000.00
//
// ============================================================

function normalizeMoney(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Number(number.toFixed(2));
}

// ============================================================
// GET ORDER
// ============================================================

async function getOrder(orderID) {
  const query = `
    query GetOrder($id: ID!) {
      getOrder(id: $id) {
        id
        userID

        paymentStatus
        paymentID
        paymentReference

        status

        fundsStatus
        fundsReleaseBlocked
        fundsHoldReason
        fundsHeldBy
        fundsHeldAt

        payoutStatus

        earningsAllocationStatus
        earningsAllocatedAt

        assignedCourierId
        assignmentStatus

        courierEarnings

        earningsAllocationStatus
        earningsAllocatedAt

        fundsReleasedAmount
        pickupFundsReleasedAt
        fundsReleasedAt
        fundsReleaseType

        _version
        _lastChangedAt
        _deleted
      }
    }
  `;

  const data = await graphqlRequest(query, {
    id: orderID,
  });

  return data?.getOrder;
}

// ============================================================
// GET COURIER
// ============================================================

async function getCourier(courierID) {
  const query = `
    query GetCourier($id: ID!) {
      getCourier(id: $id) {
        id
        userID
        walletID
        firstName
        lastName
        email
        phone

        _version
        _lastChangedAt
        _deleted
      }
    }
  `;

  const data = await graphqlRequest(query, {
    id: courierID,
  });

  return data?.getCourier;
}

// ============================================================
// GET WALLET BY ID
// ============================================================

async function getWalletByID(walletID) {
  if (!walletID) {
    return null;
  }

  const query = `
    query GetWallet($id: ID!) {
      getWallet(id: $id) {
        id
        ownerID
        ownerType

        availableBalance
        pendingBalance
        lifetimeEarnings

        transactions

        _version
        _lastChangedAt
        _deleted
      }
    }
  `;

  const data = await graphqlRequest(query, {
    id: walletID,
  });

  return data?.getWallet;
}

// ============================================================
// GET WALLET BY OWNER
// ============================================================
//
// This is the fallback if courier.walletID is missing.
//
// ============================================================

async function getWalletByOwner(courierID) {
  const query = `
    query ListWallets(
      $filter: ModelWalletFilterInput
    ) {
      listWallets(
        filter: $filter
        limit: 10
      ) {
        items {
          id
          ownerID
          ownerType

          availableBalance
          pendingBalance
          lifetimeEarnings

          transactions

          _version
          _lastChangedAt
          _deleted
        }
      }
    }
  `;

  const data = await graphqlRequest(query, {
    filter: {
      ownerID: {
        eq: courierID,
      },

      ownerType: {
        eq: "COURIER",
      },
    },
  });

  const wallets = data?.listWallets?.items || [];

  return (
    wallets.find(
      (wallet) =>
        wallet &&
        wallet._deleted !== true &&
        wallet.ownerID === courierID &&
        wallet.ownerType === "COURIER",
    ) || null
  );
}

// ============================================================
// FIND COURIER WALLET
// ============================================================

async function findCourierWallet(courier) {
  let wallet = null;

  // ----------------------------------------------------------
  // First attempt:
  // use walletID stored on the Courier.
  // ----------------------------------------------------------

  if (courier.walletID) {
    wallet = await getWalletByID(courier.walletID);
  }

  // ----------------------------------------------------------
  // Fallback:
  // search by ownerID + ownerType.
  // ----------------------------------------------------------

  if (!wallet) {
    wallet = await getWalletByOwner(courier.id);
  }

  if (!wallet) {
    throw new Error(`No wallet found for courier ${courier.id}.`);
  }

  // ----------------------------------------------------------
  // Security check:
  // make absolutely sure the wallet belongs to
  // the courier.
  // ----------------------------------------------------------

  if (wallet.ownerID !== courier.id) {
    throw new Error(
      `Wallet ${wallet.id} does not belong to courier ${courier.id}.`,
    );
  }

  if (wallet.ownerType !== "COURIER") {
    throw new Error(`Wallet ${wallet.id} is not a COURIER wallet.`);
  }

  return wallet;
}

// ============================================================
// GET TRANSACTION BY REFERENCE
// ============================================================
//
// Earnings transactions use:
//
// EARNINGS-${orderID}
//
// This makes the operation idempotent.
//
// ============================================================

async function getTransactionByReference(reference) {
  const query = `
    query ListTransactions(
      $filter: ModelTransactionFilterInput
    ) {
      listTransactions(
        filter: $filter
        limit: 10
      ) {
        items {
          id
          walletID
          type
          amount
          description
          orderID
          paymentID
          reference
          status

          _version
          _lastChangedAt
          _deleted
        }
      }
    }
  `;

  const data = await graphqlRequest(query, {
    filter: {
      reference: {
        eq: reference,
      },
    },
  });

  const transactions = data?.listTransactions?.items || [];

  return (
    transactions.find(
      (transaction) =>
        transaction &&
        transaction._deleted !== true &&
        transaction.reference === reference,
    ) || null
  );
}

// ============================================================
// CLAIM ORDER ALLOCATION
// ============================================================
//
// IMPORTANT:
//
// earningsAllocationStatus can initially be:
//   null
//   ""
//   NOT_ALLOCATED
//   FAILED
//
// Because the Paystack webhook intentionally does NOT
// initialize earningsAllocationStatus.
//
// The first successful allocation therefore becomes:
//
// null → PROCESSING
//
// ============================================================

async function claimAllocation(order, previousStatus) {
  const mutation = `
    mutation UpdateOrder(
      $input: UpdateOrderInput!
      $condition: ModelOrderConditionInput
    ) {
      updateOrder(
        input: $input
        condition: $condition
      ) {
        id

        paymentStatus
        paymentID
        paymentReference

        fundsStatus

        earningsAllocationStatus
        earningsAllocatedAt

        assignedCourierId
        courierEarnings

        _version
        _lastChangedAt
      }
    }
  `;

  const input = {
    id: order.id,

    earningsAllocationStatus: "PROCESSING",
  };

  // ----------------------------------------------------------
  // Use optimistic concurrency whenever AppSync/DataStore
  // provides a version.
  // ----------------------------------------------------------

  if (order._version !== undefined && order._version !== null) {
    input._version = order._version;
  }

  // ----------------------------------------------------------
  // IMPORTANT:
  //
  // We construct the condition based on the ACTUAL state
  // we read.
  //
  // If the status is null, condition checks for null.
  //
  // If it is empty string, condition checks for empty string.
  //
  // If it is NOT_ALLOCATED, condition checks that.
  //
  // This prevents two Lambda invocations from both claiming
  // the same order.
  // ----------------------------------------------------------

  let condition;

  if (previousStatus === null || previousStatus === undefined) {
    condition = {
      earningsAllocationStatus: {
        attributeExists: false,
      },
    };
  } else if (previousStatus === "") {
    condition = {
      earningsAllocationStatus: {
        eq: "",
      },
    };
  } else {
    condition = {
      earningsAllocationStatus: {
        eq: previousStatus,
      },
    };
  }

  const data = await graphqlRequest(mutation, {
    input,
    condition,
  });

  return data?.updateOrder;
}

// ============================================================
// CREATE EARNINGS TRANSACTION
// ============================================================

async function createEarningsTransaction({
  walletID,
  orderID,
  paymentID,
  amount,
  reference,
}) {
  const mutation = `
    mutation CreateTransaction(
      $input: CreateTransactionInput!
    ) {
      createTransaction(
        input: $input
      ) {
        id
        walletID
        type
        amount
        description
        orderID
        paymentID
        reference
        status

        _version
        _lastChangedAt
      }
    }
  `;

  const input = {
    walletID,

    type: "CREDIT",

    amount,

    description: "Courier earnings allocated to pending balance",

    orderID,

    paymentID: paymentID || null,

    reference,

    status: "PENDING",
  };

  const data = await graphqlRequest(mutation, {
    input,
  });

  return data?.createTransaction;
}

// ============================================================
// UPDATE TRANSACTION
// ============================================================

async function updateTransaction(transactionID, updates, version) {
  const mutation = `
    mutation UpdateTransaction(
      $input: UpdateTransactionInput!
    ) {
      updateTransaction(
        input: $input
      ) {
        id
        walletID
        type
        amount
        description
        orderID
        paymentID
        reference
        status

        _version
        _lastChangedAt
      }
    }
  `;

  const input = {
    id: transactionID,
    ...updates,
  };

  if (version !== undefined && version !== null) {
    input._version = version;
  }

  const data = await graphqlRequest(mutation, {
    input,
  });

  return data?.updateTransaction;
}

// ============================================================
// UPDATE WALLET
// ============================================================

async function updateWallet(
  wallet,
  availableBalance,
  pendingBalance,
  lifetimeEarnings,
) {
  const mutation = `
    mutation UpdateWallet(
      $input: UpdateWalletInput!
    ) {
      updateWallet(
        input: $input
      ) {
        id
        ownerID
        ownerType

        availableBalance
        pendingBalance
        lifetimeEarnings

        _version
        _lastChangedAt
      }
    }
  `;

  const input = {
    id: wallet.id,

    availableBalance,

    pendingBalance,

    lifetimeEarnings,
  };

  // ----------------------------------------------------------
  // Optimistic concurrency protection.
  // ----------------------------------------------------------

  if (wallet._version !== undefined && wallet._version !== null) {
    input._version = wallet._version;
  }

  const data = await graphqlRequest(mutation, {
    input,
  });

  return data?.updateWallet;
}

// ============================================================
// FINALIZE ORDER
// ============================================================
//
// PROCESSING → ALLOCATED
//
// ============================================================

async function finalizeAllocation(order, earningsAllocatedAt) {
  const mutation = `
    mutation UpdateOrder(
      $input: UpdateOrderInput!
      $condition: ModelOrderConditionInput
    ) {
      updateOrder(
        input: $input
        condition: $condition
      ) {
        id

        earningsAllocationStatus
        earningsAllocatedAt

        paymentStatus
        fundsStatus

        courierEarnings

        _version
        _lastChangedAt
      }
    }
  `;

  const input = {
    id: order.id,

    earningsAllocationStatus: "ALLOCATED",

    earningsAllocatedAt,
  };

  if (order._version !== undefined && order._version !== null) {
    input._version = order._version;
  }

  // ----------------------------------------------------------
  // Only finalize if this Lambda currently owns the
  // PROCESSING state.
  // ----------------------------------------------------------

  const condition = {
    earningsAllocationStatus: {
      eq: "PROCESSING",
    },
  };

  const data = await graphqlRequest(mutation, {
    input,
    condition,
  });

  return data?.updateOrder;
}

// ============================================================
// MARK ALLOCATION AS FAILED
// ============================================================
//
// This is only used when we know the allocation did not
// complete and we are confident that no wallet update needs
// to remain active.
//
// ============================================================

async function markAllocationFailed(orderID, orderVersion) {
  const mutation = `
    mutation UpdateOrder(
      $input: UpdateOrderInput!
      $condition: ModelOrderConditionInput
    ) {
      updateOrder(
        input: $input
        condition: $condition
      ) {
        id

        earningsAllocationStatus
        earningsAllocatedAt

        _version
        _lastChangedAt
      }
    }
  `;

  const input = {
    id: orderID,

    earningsAllocationStatus: "FAILED",
  };

  if (orderVersion !== undefined && orderVersion !== null) {
    input._version = orderVersion;
  }

  const condition = {
    earningsAllocationStatus: {
      eq: "PROCESSING",
    },
  };

  const data = await graphqlRequest(mutation, {
    input,
    condition,
  });

  return data?.updateOrder;
}

// ============================================================
// MARK TRANSACTION FAILED
// ============================================================

async function markTransactionFailed(transaction) {
  if (!transaction) {
    return null;
  }

  if (transaction.status === "FAILED") {
    return transaction;
  }

  try {
    return await updateTransaction(
      transaction.id,

      {
        status: "FAILED",

        description: "Courier earnings allocation failed",
      },

      transaction._version,
    );
  } catch (error) {
    console.error("Failed to mark earnings transaction as FAILED:", error);

    return null;
  }
}

// ============================================================
// MAIN HANDLER
// ============================================================

exports.handler = async (event) => {
  console.log("============================================================");

  console.log("allocateCourierEarnings START");

  console.log("Event:", JSON.stringify(event));

  console.log("============================================================");

  // ----------------------------------------------------------
  // Variables used for compensation/recovery.
  // ----------------------------------------------------------

  let order = null;

  let wallet = null;

  let updatedWallet = null;

  let transaction = null;

  let walletWasUpdated = false;

  let orderWasFinalized = false;

  let transactionWasCreated = false;

  let earnings = 0;

  let walletBeforeUpdate = null;

  try {
    // ========================================================
    // 1. GET ORDER ID
    // ========================================================

    const orderID =
      event?.orderID ||
      event?.arguments?.orderID ||
      event?.detail?.orderID ||
      event?.detail?.orderId;

    if (!orderID) {
      throw new Error("orderID is required.");
    }

    console.log("Order ID:", orderID);

    // ========================================================
    // 2. GET ORDER
    // ========================================================

    order = await getOrder(orderID);

    if (!order) {
      throw new Error(`Order ${orderID} was not found.`);
    }

    if (order._deleted === true) {
      throw new Error(`Order ${orderID} has been deleted.`);
    }

    console.log("Order retrieved:", JSON.stringify(order));

    // ========================================================
    // 3. VERIFY PAYMENT
    // ========================================================
    //
    // The Paystack webhook is responsible for setting:
    //
    // paymentStatus = PAID
    //
    // We do NOT require the webhook to set
    // earningsAllocationStatus.
    //
    // ========================================================

    if (order.paymentStatus !== "PAID") {
      throw new Error(
        `Order ${orderID} is not PAID. Current paymentStatus: ${order.paymentStatus}`,
      );
    }

    // ========================================================
    // 4. VERIFY COURIER ASSIGNMENT
    // ========================================================

    if (!order.assignedCourierId) {
      throw new Error(`Order ${orderID} has no assigned courier.`);
    }

    // ========================================================
    // 5. VERIFY COURIER EARNINGS
    // ========================================================

    earnings = normalizeMoney(order.courierEarnings);

    if (earnings <= 0) {
      throw new Error(
        `Order ${orderID} has invalid courier earnings: ${order.courierEarnings}`,
      );
    }

    console.log("Courier earnings:", earnings);

    // ========================================================
    // 6. CHECK CURRENT ALLOCATION STATE
    // ========================================================
    //
    // IMPORTANT:
    //
    // null / undefined / ""
    //
    // are all treated as a fresh allocation.
    //
    // This is exactly what we want because the Paystack
    // webhook does not initialize this field.
    //
    // ========================================================

    const currentAllocationStatus = order.earningsAllocationStatus;

    console.log("Current earningsAllocationStatus:", currentAllocationStatus);

    // --------------------------------------------------------
    // Already allocated?
    // --------------------------------------------------------

    if (currentAllocationStatus === "ALLOCATED") {
      console.log(`Order ${orderID} is already ALLOCATED.`);

      return successResponse({
        message: "Courier earnings were already allocated.",

        orderID,

        earnings,

        earningsAllocationStatus: "ALLOCATED",

        idempotent: true,
      });
    }

    // --------------------------------------------------------
    // Currently processing?
    // --------------------------------------------------------

    if (currentAllocationStatus === "PROCESSING") {
      console.log(`Order ${orderID} is already PROCESSING.`);

      return successResponse({
        message: "Courier earnings allocation is already processing.",

        orderID,

        earnings,

        earningsAllocationStatus: "PROCESSING",

        alreadyProcessing: true,
      });
    }

    // --------------------------------------------------------
    // Only these states can begin a new allocation:
    //
    // null
    // undefined
    // ""
    // NOT_ALLOCATED
    // FAILED
    // --------------------------------------------------------

    const allowedInitialStates = [
      null,
      undefined,
      "",
      "NOT_ALLOCATED",
      "FAILED",
    ];

    if (!allowedInitialStates.includes(currentAllocationStatus)) {
      throw new Error(
        `Order ${orderID} has an unexpected earningsAllocationStatus: ${currentAllocationStatus}`,
      );
    }

    // ========================================================
    // 7. CLAIM THE ALLOCATION
    // ========================================================
    //
    // This changes:
    //
    // null → PROCESSING
    //
    // or:
    //
    // NOT_ALLOCATED → PROCESSING
    //
    // or:
    //
    // FAILED → PROCESSING
    //
    // The conditional update prevents another Lambda
    // invocation from claiming the same order simultaneously.
    //
    // ========================================================

    console.log(`Claiming earnings allocation for ${orderID}...`);

    const claimedOrder = await claimAllocation(order, currentAllocationStatus);

    if (!claimedOrder) {
      throw new Error(
        `Failed to claim earnings allocation for order ${orderID}.`,
      );
    }

    console.log("Allocation claimed:", JSON.stringify(claimedOrder));

    // --------------------------------------------------------
    // IMPORTANT:
    //
    // From this point forward, use the newly returned Order
    // version for subsequent Order updates.
    // --------------------------------------------------------

    order = claimedOrder;

    // ========================================================
    // 8. GET COURIER
    // ========================================================

    const courier = await getCourier(order.assignedCourierId);

    if (!courier) {
      throw new Error(`Courier ${order.assignedCourierId} was not found.`);
    }

    if (courier._deleted === true) {
      throw new Error(`Courier ${order.assignedCourierId} has been deleted.`);
    }

    console.log("Courier:", JSON.stringify(courier));

    // ========================================================
    // 9. GET COURIER WALLET
    // ========================================================

    wallet = await findCourierWallet(courier);

    console.log("Courier wallet:", JSON.stringify(wallet));

    // ========================================================
    // 10. VALIDATE WALLET BALANCES
    // ========================================================

    const currentAvailableBalance = normalizeMoney(wallet.availableBalance);

    const currentPendingBalance = normalizeMoney(wallet.pendingBalance);

    const currentLifetimeEarnings = normalizeMoney(wallet.lifetimeEarnings);

    if (currentAvailableBalance < 0) {
      throw new Error(`Wallet ${wallet.id} has a negative availableBalance.`);
    }

    if (currentPendingBalance < 0) {
      throw new Error(`Wallet ${wallet.id} has a negative pendingBalance.`);
    }

    if (currentLifetimeEarnings < 0) {
      throw new Error(`Wallet ${wallet.id} has a negative lifetimeEarnings.`);
    }

    // ========================================================
    // 11. SAVE WALLET STATE
    // ========================================================
    //
    // If something fails after the wallet is updated, this
    // allows us to attempt a compensating rollback.
    //
    // ========================================================

    walletBeforeUpdate = {
      availableBalance: currentAvailableBalance,

      pendingBalance: currentPendingBalance,

      lifetimeEarnings: currentLifetimeEarnings,

      _version: wallet._version,
    };

    // ========================================================
    // 12. CALCULATE NEW WALLET BALANCES
    // ========================================================
    //
    // IMPORTANT:
    //
    // availableBalance DOES NOT change.
    //
    // pendingBalance increases.
    //
    // lifetimeEarnings increases.
    //
    // Example:
    //
    // available = 20,000
    // pending   = 5,000
    // earnings  = 10,000
    //
    // becomes:
    //
    // available = 20,000
    // pending   = 15,000
    // lifetime  = lifetime + 10,000
    //
    // ========================================================

    const newAvailableBalance = currentAvailableBalance;

    const newPendingBalance = normalizeMoney(currentPendingBalance + earnings);

    const newLifetimeEarnings = normalizeMoney(
      currentLifetimeEarnings + earnings,
    );

    console.log(
      "Wallet calculation:",
      JSON.stringify({
        currentAvailableBalance,
        currentPendingBalance,
        currentLifetimeEarnings,

        earnings,

        newAvailableBalance,
        newPendingBalance,
        newLifetimeEarnings,
      }),
    );

    // ========================================================
    // 13. EARNINGS TRANSACTION REFERENCE
    // ========================================================

    const transactionReference = `EARNINGS-${order.id}`;

    // ========================================================
    // 14. CHECK WHETHER EARNINGS TRANSACTION ALREADY EXISTS
    // ========================================================
    //
    // This is important for idempotency.
    //
    // If the Lambda runs twice, we must NOT create:
    //
    // EARNINGS-ORD-123
    // EARNINGS-ORD-123
    //
    // twice.
    //
    // ========================================================

    transaction = await getTransactionByReference(transactionReference);

    // ========================================================
    // 15. VALIDATE EXISTING TRANSACTION
    // ========================================================

    if (transaction) {
      console.log(
        "Existing earnings transaction found:",
        JSON.stringify(transaction),
      );

      // ------------------------------------------------------
      // It must belong to this wallet.
      // ------------------------------------------------------

      if (transaction.walletID !== wallet.id) {
        throw new Error(
          `Existing transaction ${transaction.id} belongs to wallet ${transaction.walletID}, not wallet ${wallet.id}.`,
        );
      }

      // ------------------------------------------------------
      // It must be a CREDIT.
      // ------------------------------------------------------

      if (transaction.type !== "CREDIT") {
        throw new Error(
          `Existing transaction ${transaction.id} is not a CREDIT transaction.`,
        );
      }

      // ------------------------------------------------------
      // Amount must match the order's courier earnings.
      // ------------------------------------------------------

      const transactionAmount = normalizeMoney(transaction.amount);

      if (transactionAmount !== earnings) {
        throw new Error(
          `Existing transaction amount ${transactionAmount} does not match courier earnings ${earnings}.`,
        );
      }

      // ------------------------------------------------------
      // If it is already COMPLETED, something unusual happened.
      //
      // Allocation transactions should remain PENDING until
      // releaseFunds / releaseCourierMilestoneFunds.
      // ------------------------------------------------------

      if (transaction.status === "COMPLETED") {
        throw new Error(
          `Transaction ${transaction.id} is already COMPLETED while order allocation is not finalized. Manual reconciliation is required.`,
        );
      }

      // ------------------------------------------------------
      // A FAILED transaction cannot simply be reused because
      // its historical failure should remain meaningful.
      //
      // Create/reconcile carefully instead.
      // ------------------------------------------------------

      if (transaction.status === "FAILED") {
        throw new Error(
          `Transaction ${transaction.id} is already FAILED. Manual reconciliation is required before allocating order ${order.id}.`,
        );
      }

      // ------------------------------------------------------
      // PENDING is the expected state.
      // ------------------------------------------------------

      if (transaction.status !== "PENDING") {
        throw new Error(
          `Transaction ${transaction.id} has unexpected status ${transaction.status}.`,
        );
      }
    }

    // ========================================================
    // 16. CREATE TRANSACTION IF NECESSARY
    // ========================================================

    if (!transaction) {
      console.log("Creating earnings transaction...");

      transaction = await createEarningsTransaction({
        walletID: wallet.id,

        orderID: order.id,

        paymentID: order.paymentID,

        amount: earnings,

        reference: transactionReference,
      });

      if (!transaction) {
        throw new Error("Failed to create earnings transaction.");
      }

      transactionWasCreated = true;

      console.log("Earnings transaction created:", JSON.stringify(transaction));
    }

    // ========================================================
    // 17. UPDATE WALLET
    // ========================================================
    //
    // This is where the actual accounting allocation occurs.
    //
    // Money moves:
    //
    // pendingBalance += courierEarnings
    //
    // lifetimeEarnings += courierEarnings
    //
    // availableBalance remains unchanged.
    //
    // ========================================================

    console.log(`Updating wallet ${wallet.id}...`);

    updatedWallet = await updateWallet(
      wallet,

      newAvailableBalance,

      newPendingBalance,

      newLifetimeEarnings,
    );

    if (!updatedWallet) {
      throw new Error(`Failed to update wallet ${wallet.id}.`);
    }

    walletWasUpdated = true;

    console.log("Wallet updated:", JSON.stringify(updatedWallet));

    // ========================================================
    // 18. FINALIZE ORDER
    // ========================================================
    //
    // PROCESSING → ALLOCATED
    //
    // This is the final accounting state.
    //
    // ========================================================

    const earningsAllocatedAt = new Date().toISOString();

    console.log(`Finalizing earnings allocation for order ${order.id}...`);

    const finalizedOrder = await finalizeAllocation(order, earningsAllocatedAt);

    if (!finalizedOrder) {
      throw new Error(
        `Failed to finalize earnings allocation for order ${order.id}.`,
      );
    }

    orderWasFinalized = true;

    console.log("Order allocation finalized:", JSON.stringify(finalizedOrder));

    // ========================================================
    // 19. SUCCESS
    // ========================================================

    console.log("============================================================");

    console.log("allocateCourierEarnings SUCCESS");

    console.log("============================================================");

    return successResponse({
      message: "Courier earnings successfully allocated.",

      orderID: order.id,

      courierID: order.assignedCourierId,

      walletID: wallet.id,

      earnings,

      earningsAllocationStatus: "ALLOCATED",

      transactionID: transaction.id,

      transactionReference,

      wallet: {
        availableBalance: newAvailableBalance,

        pendingBalance: newPendingBalance,

        lifetimeEarnings: newLifetimeEarnings,
      },
    });
  } catch (error) {
    // ========================================================
    // ERROR / COMPENSATION
    // ========================================================

    console.error(
      "============================================================",
    );

    console.error("allocateCourierEarnings FAILED");

    console.error(error);

    console.error(
      "============================================================",
    );

    // ========================================================
    // COMPENSATING ROLLBACK
    // ========================================================
    //
    // If wallet was changed but the Order could not be
    // finalized, we attempt to restore the wallet to exactly
    // what it was before allocation.
    //
    // This prevents:
    //
    // wallet.pendingBalance increased
    // BUT
    // order remains PROCESSING
    //
    // ========================================================

    if (
      walletWasUpdated &&
      !orderWasFinalized &&
      wallet &&
      walletBeforeUpdate &&
      updatedWallet
    ) {
      console.warn("Attempting wallet rollback...");

      try {
        const rollbackWallet = await updateWallet(
          updatedWallet,

          walletBeforeUpdate.availableBalance,

          walletBeforeUpdate.pendingBalance,

          walletBeforeUpdate.lifetimeEarnings,
        );

        if (rollbackWallet) {
          console.log(
            "Wallet rollback successful:",
            JSON.stringify(rollbackWallet),
          );

          walletWasUpdated = false;
        }
      } catch (rollbackError) {
        console.error("CRITICAL: Wallet rollback failed.", rollbackError);

        // ----------------------------------------------------
        // IMPORTANT:
        //
        // We do NOT mark the Order FAILED here because the
        // wallet may still contain the allocated earnings.
        //
        // Leaving PROCESSING is safer than creating a false
        // FAILED state that could cause another allocation.
        // ----------------------------------------------------

        return errorResponse(error, {
          orderID: order?.id,

          courierID: order?.assignedCourierId,

          reconciliationRequired: true,

          reason:
            "Wallet was updated but rollback failed. Manual reconciliation is required before retrying.",
        });
      }
    }

    // ========================================================
    // TRANSACTION COMPENSATION
    // ========================================================
    //
    // If we created the transaction but the wallet was rolled
    // back, mark the transaction FAILED.
    //
    // ========================================================

    if (transaction && !walletWasUpdated && !orderWasFinalized) {
      await markTransactionFailed(transaction);
    }

    // ========================================================
    // MARK ORDER ALLOCATION FAILED
    // ========================================================
    //
    // We only do this after we have confirmed that the wallet
    // does not remain changed.
    //
    // ========================================================

    if (order && !walletWasUpdated && !orderWasFinalized) {
      try {
        await markAllocationFailed(order.id, order._version);

        console.log(`Order ${order.id} marked as FAILED.`);
      } catch (statusError) {
        console.error("Could not mark allocation as FAILED:", statusError);
      }
    }

    // ========================================================
    // FINAL ERROR RESPONSE
    // ========================================================

    return errorResponse(error, {
      orderID: order?.id || null,

      courierID: order?.assignedCourierId || null,

      reconciliationRequired: false,
    });
  }
};
