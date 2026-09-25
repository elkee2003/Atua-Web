const fetch = require("node-fetch");

/*
============================================================
ATUA — RELEASE COURIER MILESTONE FUNDS
============================================================

PURPOSE
-------

This Lambda handles ONLY MAXI courier earnings releases.

MAXI earnings are released in two milestones:

    1. PICKED_UP
           ↓
       50% released

    2. DELIVERED
           ↓
       Remaining amount released


============================================================
MAXI FINANCIAL FLOW
============================================================

Payment succeeds
        ↓
Paystack webhook
        ↓
paymentStatus = PAID
fundsStatus = HELD
earningsAllocationStatus = null
        ↓
Courier assigned
        ↓
allocateCourierEarnings
        ↓
earningsAllocationStatus = ALLOCATED
        ↓
100% courier earnings in pendingBalance
        ↓
PICKED_UP
        ↓
50% → availableBalance
        ↓
fundsStatus = PARTIALLY_RELEASED
        ↓
DELIVERED
        ↓
remaining amount → availableBalance
        ↓
fundsStatus = RELEASED


============================================================
IMPORTANT
============================================================

This Lambda:

    DOES NOT process customer payment.

    DOES NOT allocate courier earnings.

    DOES NOT change lifetimeEarnings.

    DOES NOT process Paystack payouts.

    DOES NOT transfer money to the courier's bank.

    DOES NOT handle Micro/Moto normal releases.

    DOES move money:

        pendingBalance
              ↓
        availableBalance


============================================================
MILESTONE ACCOUNTING
============================================================

Example:

    courierEarnings = ₦20,000

At allocation:

    pendingBalance += ₦20,000

At PICKED_UP:

    availableBalance += ₦10,000
    pendingBalance   -= ₦10,000

At DELIVERED:

    availableBalance += ₦10,000
    pendingBalance   -= ₦10,000

Final:

    availableBalance = +₦20,000
    pendingBalance   = original amount
    lifetimeEarnings = +₦20,000


============================================================
ODD AMOUNTS
============================================================

The Lambda calculates the first release as:

    earnings / 2

rounded to 2 decimal places.

Example:

    earnings = ₦20,001

PICKED_UP:

    ₦10,000.50

DELIVERED:

    ₦10,000.50

Total:

    ₦20,001


============================================================
EXPECTED EVENT
============================================================

PICKUP:

{
    "orderID": "ORDER-ID",
    "milestone": "PICKED_UP"
}


DELIVERY:

{
    "orderID": "ORDER-ID",
    "milestone": "DELIVERED"
}


============================================================
*/

/* ==========================================================
   ENVIRONMENT VARIABLES
========================================================== */

const GRAPHQL_ENDPOINT = process.env.API_ATUA_GRAPHQLAPIENDPOINTOUTPUT;

const API_KEY = process.env.API_ATUA_GRAPHQLAPIKEYOUTPUT;

/* ==========================================================
   MAIN HANDLER
========================================================== */

exports.handler = async (event) => {
  console.log("==================================================");

  console.log("ATUA — RELEASE COURIER MILESTONE FUNDS");

  console.log("EVENT:", JSON.stringify(event));

  console.log("==================================================");

  let orderID = null;

  let order = null;

  let wallet = null;

  let transaction = null;

  let updatedWallet = null;

  let walletUpdated = false;

  let transactionUpdated = false;

  let orderUpdated = false;

  let walletBeforeRelease = null;

  try {
    /* ======================================================
       1. GET ORDER ID
    ====================================================== */

    orderID =
      event?.orderID ||
      event?.arguments?.orderID ||
      event?.detail?.orderID ||
      event?.detail?.orderId;

    if (!orderID) {
      throw new Error("orderID is required.");
    }

    /* ======================================================
       2. GET MILESTONE
    ====================================================== */

    let milestone =
      event?.milestone ||
      event?.arguments?.milestone ||
      event?.detail?.milestone ||
      null;

    if (!milestone) {
      throw new Error("milestone is required. Use PICKED_UP or DELIVERED.");
    }

    milestone = String(milestone).toUpperCase();

    if (milestone !== "PICKED_UP" && milestone !== "DELIVERED") {
      throw new Error(
        `Unsupported milestone: ${milestone}. Use PICKED_UP or DELIVERED.`,
      );
    }

    console.log("ORDER ID:", orderID);

    console.log("MILESTONE:", milestone);

    /* ======================================================
       3. GET ORDER
    ====================================================== */

    order = await getOrder(orderID);

    if (!order) {
      throw new Error(`Order ${orderID} was not found.`);
    }

    if (order._deleted === true) {
      throw new Error(`Order ${orderID} has been deleted.`);
    }

    console.log("ORDER:", JSON.stringify(order));

    /* ======================================================
       4. VERIFY PAYMENT
    ====================================================== */

    if (order.paymentStatus !== "PAID") {
      throw new Error(
        `Order ${orderID} is not PAID. Current paymentStatus: ${order.paymentStatus}`,
      );
    }

    /* ======================================================
       5. VERIFY EARNINGS ALLOCATION
    ====================================================== */

    if (order.earningsAllocationStatus !== "ALLOCATED") {
      throw new Error(
        `Courier earnings have not been allocated for order ${orderID}. Current earningsAllocationStatus: ${order.earningsAllocationStatus}`,
      );
    }

    /* ======================================================
       6. VERIFY COURIER
    ====================================================== */

    const courierID = order.assignedCourierId;

    if (!courierID) {
      throw new Error(`Order ${orderID} has no assigned courier.`);
    }

    /* ======================================================
       7. VERIFY COURIER EARNINGS
    ====================================================== */

    const earnings = normalizeMoney(order.courierEarnings);

    if (earnings <= 0) {
      throw new Error(
        `Invalid courier earnings for order ${orderID}: ${order.courierEarnings}`,
      );
    }

    console.log("COURIER:", courierID);

    console.log("TOTAL COURIER EARNINGS:", earnings);

    /* ======================================================
       8. VERIFY THIS IS A MAXI ORDER
    ====================================================== */

    const transportationType = String(
      order.transportationType || "",
    ).toUpperCase();

    const vehicleClass = String(order.vehicleClass || "").toUpperCase();

    const isMaxi = transportationType === "MAXI" || vehicleClass === "MAXI";

    if (!isMaxi) {
      throw new Error(
        `Order ${orderID} is not a MAXI order. Normal Micro/Moto orders must use releaseFunds.`,
      );
    }

    /* ======================================================
       9. CHECK ADMIN HOLD
    ====================================================== */

    if (order.fundsReleaseBlocked === true) {
      console.log(`Funds release blocked by admin for order ${orderID}.`);

      return successResponse({
        message: "Funds release is blocked by admin.",

        orderID,

        courierID,

        milestone,

        amount: earnings,

        fundsStatus: order.fundsStatus,

        fundsReleasedAmount: normalizeMoney(order.fundsReleasedAmount),

        holdReason: order.fundsHoldReason || null,

        heldBy: order.fundsHeldBy || null,

        heldAt: order.fundsHeldAt || null,

        releaseBlocked: true,
      });
    }

    /* ======================================================
       10. GET COURIER
    ====================================================== */

    const courier = await getCourier(courierID);

    if (!courier) {
      throw new Error(`Courier ${courierID} was not found.`);
    }

    if (courier._deleted === true) {
      throw new Error(`Courier ${courierID} has been deleted.`);
    }

    /* ======================================================
       11. GET COURIER WALLET
    ====================================================== */

    wallet = await findCourierWallet(courier);

    if (!wallet) {
      throw new Error(`No wallet was found for courier ${courierID}.`);
    }

    /* ======================================================
       12. VERIFY WALLET OWNER
    ====================================================== */

    if (wallet.ownerID !== courierID) {
      throw new Error(
        `Wallet ${wallet.id} does not belong to courier ${courierID}.`,
      );
    }

    if (wallet.ownerType !== "COURIER") {
      throw new Error(`Wallet ${wallet.id} is not a COURIER wallet.`);
    }

    console.log("WALLET:", JSON.stringify(wallet));

    /* ======================================================
       13. READ WALLET BALANCES
    ====================================================== */

    const currentPendingBalance = normalizeMoney(wallet.pendingBalance);

    const currentAvailableBalance = normalizeMoney(wallet.availableBalance);

    const currentLifetimeEarnings = normalizeMoney(wallet.lifetimeEarnings);

    /* ======================================================
       14. VERIFY WALLET BALANCES
    ====================================================== */

    if (currentPendingBalance < 0) {
      throw new Error(`Wallet ${wallet.id} has a negative pendingBalance.`);
    }

    if (currentAvailableBalance < 0) {
      throw new Error(`Wallet ${wallet.id} has a negative availableBalance.`);
    }

    /* ======================================================
       15. GET CURRENTLY RELEASED AMOUNT
    ====================================================== */

    const currentReleasedAmount = normalizeMoney(order.fundsReleasedAmount);

    if (currentReleasedAmount < 0) {
      throw new Error(`Order ${orderID} has an invalid fundsReleasedAmount.`);
    }

    if (currentReleasedAmount > earnings) {
      throw new Error(
        `Order ${orderID} has already released ${currentReleasedAmount}, which is greater than total courier earnings ${earnings}.`,
      );
    }

    /* ======================================================
       16. PICKED_UP MILESTONE
    ====================================================== */

    if (milestone === "PICKED_UP") {
      /*
       * PICKED_UP is the first Maxi release.
       *
       * We release exactly 50% of the total earnings.
       */

      const firstReleaseAmount = normalizeMoney(earnings / 2);

      /* ====================================================
         IDEMPOTENCY CHECK
      ====================================================

         If fundsStatus is already PARTIALLY_RELEASED or
         RELEASED, pickup has already been processed.

      ==================================================== */

      if (
        order.fundsStatus === "PARTIALLY_RELEASED" ||
        order.fundsStatus === "RELEASED"
      ) {
        console.log(`Pickup release already processed for order ${orderID}.`);

        return successResponse({
          message: "Maxi pickup funds have already been released.",

          orderID,

          courierID,

          milestone: "PICKED_UP",

          amountReleased: currentReleasedAmount,

          totalCourierEarnings: earnings,

          fundsReleasedAmount: currentReleasedAmount,

          fundsStatus: order.fundsStatus,

          alreadyProcessed: true,
        });
      }

      /* ====================================================
         PICKUP MUST START FROM HELD
      ==================================================== */

      if (order.fundsStatus !== "HELD") {
        throw new Error(
          `Order ${orderID} has fundsStatus ${order.fundsStatus}. Maxi pickup release requires HELD.`,
        );
      }

      /* ====================================================
         VERIFY NO MONEY HAS ALREADY BEEN RELEASED
      ==================================================== */

      if (currentReleasedAmount > 0) {
        throw new Error(
          `Order ${orderID} has fundsReleasedAmount ${currentReleasedAmount} but fundsStatus is HELD. Manual reconciliation is required.`,
        );
      }

      /* ====================================================
         VERIFY PENDING BALANCE
      ==================================================== */

      if (currentPendingBalance < firstReleaseAmount) {
        throw new Error(
          `Insufficient pending balance. Pending: ${currentPendingBalance}. Required for pickup release: ${firstReleaseAmount}.`,
        );
      }

      /* ====================================================
         SAVE WALLET FOR ROLLBACK
      ==================================================== */

      walletBeforeRelease = {
        availableBalance: currentAvailableBalance,

        pendingBalance: currentPendingBalance,

        lifetimeEarnings: currentLifetimeEarnings,

        _version: wallet._version,
      };

      /* ====================================================
         CALCULATE PICKUP BALANCES
      ==================================================== */

      const newPendingBalance = normalizeMoney(
        currentPendingBalance - firstReleaseAmount,
      );

      const newAvailableBalance = normalizeMoney(
        currentAvailableBalance + firstReleaseAmount,
      );

      console.log(
        "MAXI PICKUP CALCULATION:",
        JSON.stringify({
          totalEarnings: earnings,

          releaseAmount: firstReleaseAmount,

          previousPendingBalance: currentPendingBalance,

          newPendingBalance,

          previousAvailableBalance: currentAvailableBalance,

          newAvailableBalance,

          lifetimeEarnings: currentLifetimeEarnings,
        }),
      );

      /* ====================================================
         FIND EARNINGS TRANSACTION
      ==================================================== */

      const transactionReference = `EARNINGS-${orderID}`;

      transaction = await getTransactionByReference(transactionReference);

      if (!transaction) {
        throw new Error(
          `Earnings transaction ${transactionReference} was not found. Allocation ledger must be reconciled before Maxi funds can be released.`,
        );
      }

      /* ====================================================
         VERIFY TRANSACTION
      ==================================================== */

      verifyEarningsTransaction({
        transaction,

        walletID: wallet.id,

        earnings,
      });

      /* ====================================================
         UPDATE WALLET
      ==================================================== */

      updatedWallet = await updateWallet(
        wallet,

        newAvailableBalance,

        newPendingBalance,

        currentLifetimeEarnings,
      );

      if (!updatedWallet) {
        throw new Error(
          `Wallet ${wallet.id} could not be updated for Maxi pickup release.`,
        );
      }

      walletUpdated = true;

      console.log("WALLET UPDATED AT PICKUP:", JSON.stringify(updatedWallet));

      /* ====================================================
         UPDATE ORDER
      ==================================================== */

      const pickupTimestamp = new Date().toISOString();

      const updatedOrder = await finalizePickupRelease({
        order,

        firstReleaseAmount,

        pickupTimestamp,
      });

      if (!updatedOrder) {
        throw new Error(
          `Order ${orderID} could not be marked PARTIALLY_RELEASED after pickup.`,
        );
      }

      orderUpdated = true;

      console.log("ORDER UPDATED AT PICKUP:", JSON.stringify(updatedOrder));

      /* ====================================================
         SUCCESS — PICKUP
      ==================================================== */

      return successResponse({
        message: "50% of Maxi courier earnings released at pickup.",

        orderID,

        courierID,

        milestone: "PICKED_UP",

        amountReleased: firstReleaseAmount,

        totalCourierEarnings: earnings,

        fundsReleasedAmount: firstReleaseAmount,

        remainingPendingBalance: newPendingBalance,

        availableBalance: newAvailableBalance,

        lifetimeEarnings: currentLifetimeEarnings,

        fundsStatus: "PARTIALLY_RELEASED",

        pickupFundsReleasedAt: pickupTimestamp,

        releaseType: "MAXI_PICKUP",
      });
    }

    /* ======================================================
       17. DELIVERED MILESTONE
    ====================================================== */

    if (milestone === "DELIVERED") {
      /*
       * Delivery releases whatever remains.
       *
       * This is safer than simply saying "release 50%"
       * because it handles odd amounts correctly.
       *
       * Example:
       *
       * ₦20,001
       *
       * Pickup:
       * ₦10,000.50
       *
       * Delivery:
       * ₦10,000.50
       */

      const remainingAmount = normalizeMoney(earnings - currentReleasedAmount);

      /* ====================================================
         IDEMPOTENCY
      ==================================================== */

      if (order.fundsStatus === "RELEASED") {
        console.log(`Maxi funds already fully released for order ${orderID}.`);

        return successResponse({
          message: "Maxi courier earnings are already fully released.",

          orderID,

          courierID,

          milestone: "DELIVERED",

          amountReleased: earnings,

          totalCourierEarnings: earnings,

          fundsReleasedAmount: earnings,

          fundsStatus: "RELEASED",

          alreadyProcessed: true,
        });
      }

      /* ====================================================
         REMAINING AMOUNT MUST EXIST
      ==================================================== */

      if (remainingAmount <= 0) {
        throw new Error(`Order ${orderID} has no remaining amount to release.`);
      }

      /* ====================================================
         VALID DELIVERY STATES
      ====================================================

         Normally:

             PARTIALLY_RELEASED

         is expected.

         HELD is accepted only if no amount has previously
         been released. In that situation, the remaining
         amount equals 100%.

         We do NOT silently convert HELD into a normal
         100% release without recording the Maxi delivery
         release explicitly.

      ==================================================== */

      if (
        order.fundsStatus !== "PARTIALLY_RELEASED" &&
        order.fundsStatus !== "HELD"
      ) {
        throw new Error(
          `Order ${orderID} has unexpected fundsStatus ${order.fundsStatus} for Maxi delivery release.`,
        );
      }

      /* ====================================================
         IMPORTANT SAFETY CHECK
      ====================================================

         If status is HELD but some amount has already been
         recorded as released, something is inconsistent.

      ==================================================== */

      if (order.fundsStatus === "HELD" && currentReleasedAmount > 0) {
        throw new Error(
          `Order ${orderID} is HELD but already has ${currentReleasedAmount} released. Manual reconciliation is required.`,
        );
      }

      /* ====================================================
         VERIFY PENDING BALANCE
      ==================================================== */

      if (currentPendingBalance < remainingAmount) {
        throw new Error(
          `Insufficient pending balance. Pending: ${currentPendingBalance}. Required: ${remainingAmount}.`,
        );
      }

      /* ====================================================
         SAVE WALLET FOR ROLLBACK
      ==================================================== */

      walletBeforeRelease = {
        availableBalance: currentAvailableBalance,

        pendingBalance: currentPendingBalance,

        lifetimeEarnings: currentLifetimeEarnings,

        _version: wallet._version,
      };

      /* ====================================================
         CALCULATE DELIVERY BALANCES
      ==================================================== */

      const newPendingBalance = normalizeMoney(
        currentPendingBalance - remainingAmount,
      );

      const newAvailableBalance = normalizeMoney(
        currentAvailableBalance + remainingAmount,
      );

      console.log(
        "MAXI DELIVERY CALCULATION:",
        JSON.stringify({
          totalEarnings: earnings,

          previouslyReleased: currentReleasedAmount,

          remainingAmount,

          previousPendingBalance: currentPendingBalance,

          newPendingBalance,

          previousAvailableBalance: currentAvailableBalance,

          newAvailableBalance,

          lifetimeEarnings: currentLifetimeEarnings,
        }),
      );

      /* ====================================================
         FIND EARNINGS TRANSACTION
      ==================================================== */

      const transactionReference = `EARNINGS-${orderID}`;

      transaction = await getTransactionByReference(transactionReference);

      if (!transaction) {
        throw new Error(
          `Earnings transaction ${transactionReference} was not found. Allocation ledger must be reconciled before Maxi funds can be released.`,
        );
      }

      /* ====================================================
         VERIFY TRANSACTION
      ==================================================== */

      verifyEarningsTransaction({
        transaction,

        walletID: wallet.id,

        earnings,
      });

      /* ====================================================
         UPDATE WALLET
      ==================================================== */

      updatedWallet = await updateWallet(
        wallet,

        newAvailableBalance,

        newPendingBalance,

        currentLifetimeEarnings,
      );

      if (!updatedWallet) {
        throw new Error(
          `Wallet ${wallet.id} could not be updated for Maxi delivery release.`,
        );
      }

      walletUpdated = true;

      console.log("WALLET UPDATED AT DELIVERY:", JSON.stringify(updatedWallet));

      /* ====================================================
         UPDATE ORDER
      ==================================================== */

      const deliveryTimestamp = new Date().toISOString();

      const finalReleasedAmount = earnings;

      const updatedOrder = await finalizeDeliveryRelease({
        order,

        finalReleasedAmount,

        deliveryTimestamp,
      });

      if (!updatedOrder) {
        throw new Error(
          `Order ${orderID} could not be marked RELEASED after Maxi delivery.`,
        );
      }

      orderUpdated = true;

      console.log("ORDER UPDATED AT DELIVERY:", JSON.stringify(updatedOrder));

      /* ====================================================
         SUCCESS — DELIVERY
      ==================================================== */

      return successResponse({
        message: "Remaining Maxi courier earnings released at delivery.",

        orderID,

        courierID,

        milestone: "DELIVERED",

        amountReleased: remainingAmount,

        totalCourierEarnings: earnings,

        previouslyReleased: currentReleasedAmount,

        fundsReleasedAmount: finalReleasedAmount,

        remainingPendingBalance: newPendingBalance,

        availableBalance: newAvailableBalance,

        lifetimeEarnings: currentLifetimeEarnings,

        fundsStatus: "RELEASED",

        fundsReleasedAt: deliveryTimestamp,

        releaseType: "MAXI_DELIVERY",
      });
    }

    throw new Error(`Unsupported milestone: ${milestone}`);
  } catch (error) {
    /* ======================================================
       ERROR LOGGING
    ====================================================== */

    console.error("==================================================");

    console.error("ATUA — MAXI MILESTONE RELEASE FAILED");

    console.error("MESSAGE:", error?.message);

    console.error("STACK:", error?.stack);

    console.error("==================================================");

    /* ======================================================
       COMPENSATING WALLET ROLLBACK
    ======================================================

       If wallet was changed but Order was not successfully
       finalized, restore the wallet.

    ====================================================== */

    if (
      walletUpdated &&
      !orderUpdated &&
      updatedWallet &&
      walletBeforeRelease
    ) {
      console.warn("Attempting Maxi wallet rollback...");

      try {
        const rolledBackWallet = await updateWallet(
          updatedWallet,

          walletBeforeRelease.availableBalance,

          walletBeforeRelease.pendingBalance,

          walletBeforeRelease.lifetimeEarnings,
        );

        if (!rolledBackWallet) {
          throw new Error("Wallet rollback returned no wallet.");
        }

        walletUpdated = false;

        console.log(
          "MAXI WALLET ROLLBACK SUCCESS:",
          JSON.stringify(rolledBackWallet),
        );
      } catch (rollbackError) {
        console.error("CRITICAL: MAXI WALLET ROLLBACK FAILED", rollbackError);

        return errorResponse(error, {
          orderID,

          courierID: order?.assignedCourierId || null,

          milestone: event?.milestone || event?.arguments?.milestone || null,

          reconciliationRequired: true,

          reason:
            "Wallet was changed during the Maxi milestone release but could not be safely rolled back. Manual reconciliation is required before retrying.",
        });
      }
    }

    /* ======================================================
       FINAL ERROR RESPONSE
    ====================================================== */

    return errorResponse(error, {
      orderID,

      courierID: order?.assignedCourierId || null,

      milestone: event?.milestone || event?.arguments?.milestone || null,

      reconciliationRequired: false,
    });
  }
};

/* ==========================================================
   GET ORDER
========================================================== */

async function getOrder(orderID) {
  const query = `
    query GetOrder($id: ID!) {

      getOrder(id: $id) {

        id

        status

        paymentStatus

        paymentID

        paymentReference

        payoutStatus

        fundsStatus

        fundsReleaseBlocked

        fundsHoldReason

        fundsHeldBy

        fundsHeldAt

        fundsReleasedAmount

        pickupFundsReleasedAt

        fundsReleasedAt

        fundsReleaseType

        earningsAllocationStatus

        earningsAllocatedAt

        assignedCourierId

        courierEarnings

        transportationType

        vehicleClass

        _version

        _lastChangedAt

        _deleted

      }

    }
  `;

  const data = await graphqlRequest(query, {
    id: orderID,
  });

  return data?.getOrder || null;
}

/* ==========================================================
   GET COURIER
========================================================== */

async function getCourier(courierID) {
  const query = `
    query GetCourier($id: ID!) {

      getCourier(id: $id) {

        id

        firstName

        lastName

        walletID

        _version

        _lastChangedAt

        _deleted

      }

    }
  `;

  const data = await graphqlRequest(query, {
    id: courierID,
  });

  return data?.getCourier || null;
}

/* ==========================================================
   FIND COURIER WALLET
========================================================== */

async function findCourierWallet(courier) {
  let wallet = null;

  /* ========================================================
     FIRST: Courier.walletID
  ======================================================== */

  if (courier.walletID) {
    wallet = await getWalletByID(courier.walletID);
  }

  /* ========================================================
     FALLBACK: ownerID + ownerType
  ======================================================== */

  if (!wallet) {
    wallet = await getWalletByOwner(courier.id);
  }

  return wallet || null;
}

/* ==========================================================
   GET WALLET BY ID
========================================================== */

async function getWalletByID(walletID) {
  const query = `
    query GetWallet($id: ID!) {

      getWallet(id: $id) {

        id

        ownerID

        ownerType

        availableBalance

        pendingBalance

        lifetimeEarnings

        _version

        _lastChangedAt

        _deleted

      }

    }
  `;

  const data = await graphqlRequest(query, {
    id: walletID,
  });

  return data?.getWallet || null;
}

/* ==========================================================
   GET WALLET BY OWNER
========================================================== */

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

/* ==========================================================
   GET EARNINGS TRANSACTION
========================================================== */

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

/* ==========================================================
   VERIFY EARNINGS TRANSACTION
========================================================== */

function verifyEarningsTransaction({ transaction, walletID, earnings }) {
  /* ========================================================
     WALLET
  ======================================================== */

  if (transaction.walletID !== walletID) {
    throw new Error(
      `Earnings transaction ${transaction.id} belongs to wallet ${transaction.walletID}, not wallet ${walletID}.`,
    );
  }

  /* ========================================================
     TYPE
  ======================================================== */

  if (transaction.type !== "CREDIT") {
    throw new Error(
      `Earnings transaction ${transaction.id} is not a CREDIT transaction.`,
    );
  }

  /* ========================================================
     AMOUNT
  ======================================================== */

  const transactionAmount = normalizeMoney(transaction.amount);

  if (Math.abs(transactionAmount - earnings) > 0.01) {
    throw new Error(
      `Transaction amount ${transactionAmount} does not match courier earnings ${earnings}.`,
    );
  }

  /* ========================================================
     STATUS
  ========================================================

     The transaction created by allocateCourierEarnings
     should still be PENDING while the courier's earnings
     are pending.

     We intentionally do not change the transaction here.

  ======================================================== */

  if (transaction.status !== "PENDING" && transaction.status !== "COMPLETED") {
    throw new Error(
      `Earnings transaction ${transaction.id} has unexpected status ${transaction.status}.`,
    );
  }
}

/* ==========================================================
   UPDATE WALLET
========================================================== */

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

    availableBalance: normalizeMoney(availableBalance),

    pendingBalance: normalizeMoney(pendingBalance),

    lifetimeEarnings: normalizeMoney(lifetimeEarnings),
  };

  if (wallet._version !== undefined && wallet._version !== null) {
    input._version = wallet._version;
  }

  const data = await graphqlRequest(mutation, {
    input,
  });

  return data?.updateWallet || null;
}

/* ==========================================================
   FINALIZE PICKUP RELEASE
========================================================== */

async function finalizePickupRelease({
  order,
  firstReleaseAmount,
  pickupTimestamp,
}) {
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

        status

        paymentStatus

        fundsStatus

        fundsReleasedAmount

        pickupFundsReleasedAt

        fundsReleasedAt

        fundsReleaseType

        earningsAllocationStatus

        _version

        _lastChangedAt

      }

    }
  `;

  const input = {
    id: order.id,

    fundsStatus: "PARTIALLY_RELEASED",

    fundsReleasedAmount: normalizeMoney(firstReleaseAmount),

    pickupFundsReleasedAt: pickupTimestamp,

    fundsReleaseType: "MAXI_PICKUP",
  };

  if (order._version !== undefined && order._version !== null) {
    input._version = order._version;
  }

  const condition = {
    fundsStatus: {
      eq: "HELD",
    },

    earningsAllocationStatus: {
      eq: "ALLOCATED",
    },
  };

  const data = await graphqlRequest(mutation, {
    input,

    condition,
  });

  return data?.updateOrder || null;
}

/* ==========================================================
   FINALIZE DELIVERY RELEASE
========================================================== */

async function finalizeDeliveryRelease({
  order,
  finalReleasedAmount,
  deliveryTimestamp,
}) {
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

        status

        paymentStatus

        fundsStatus

        fundsReleasedAmount

        pickupFundsReleasedAt

        fundsReleasedAt

        fundsReleaseType

        earningsAllocationStatus

        _version

        _lastChangedAt

      }

    }
  `;

  const input = {
    id: order.id,

    fundsStatus: "RELEASED",

    fundsReleasedAmount: normalizeMoney(finalReleasedAmount),

    fundsReleasedAt: deliveryTimestamp,

    fundsReleaseType: "MAXI_DELIVERY",
  };

  if (order._version !== undefined && order._version !== null) {
    input._version = order._version;
  }

  /*
   * Normally the order should be:

       PARTIALLY_RELEASED

   after pickup.

   We also permit:

       HELD

   only when fundsReleasedAmount is zero.

   The caller has already validated this state.
  */

  const condition = {
    earningsAllocationStatus: {
      eq: "ALLOCATED",
    },
  };

  const data = await graphqlRequest(mutation, {
    input,

    condition,
  });

  return data?.updateOrder || null;
}

/* ==========================================================
   MONEY NORMALIZER
========================================================== */

function normalizeMoney(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return 0;
  }

  return Number(number.toFixed(2));
}

/* ==========================================================
   SUCCESS RESPONSE
========================================================== */

function successResponse(data) {
  return {
    statusCode: 200,

    body: JSON.stringify({
      success: true,

      ...data,
    }),
  };
}

/* ==========================================================
   ERROR RESPONSE
========================================================== */

function errorResponse(error, extra = {}) {
  return {
    statusCode: 500,

    body: JSON.stringify({
      success: false,

      message: error?.message || "Maxi milestone funds release failed.",

      ...extra,
    }),
  };
}

/* ==========================================================
   GRAPHQL REQUEST HELPER
========================================================== */

async function graphqlRequest(query, variables = {}) {
  if (!GRAPHQL_ENDPOINT) {
    throw new Error("Missing API_ATUA_GRAPHQLAPIENDPOINTOUTPUT.");
  }

  if (!API_KEY) {
    throw new Error("Missing API_ATUA_GRAPHQLAPIKEYOUTPUT.");
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",

      "x-api-key": API_KEY,
    },

    body: JSON.stringify({
      query,

      variables,
    }),
  });

  const responseText = await response.text();

  let responseData;

  try {
    responseData = JSON.parse(responseText);
  } catch (parseError) {
    throw new Error(`GraphQL returned invalid JSON: ${responseText}`);
  }

  if (!response.ok) {
    throw new Error(`GraphQL HTTP ${response.status}: ${responseText}`);
  }

  if (responseData?.errors?.length) {
    throw new Error(
      responseData.errors
        .map((error) => error?.message)
        .filter(Boolean)
        .join(" | "),
    );
  }

  return responseData;
}
