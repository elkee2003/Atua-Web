// ============================================================
// REASSIGN ORDER LAMBDA
// ============================================================
//
// PURPOSE
// ============================================================
//
// Handles expired courier offers.
//
// FLOW:
//
// ORDER
//   ↓
// Courier A OFFERED
//   ↓
// 25 seconds
//   ↓
// Courier A does not accept
//   ↓
// OFFER EXPIRES
//   ↓
// Courier A added to dispatchAttemptedCourierIds
//   ↓
// Search for Courier B
//   ↓
// Courier B OFFERED
//   ↓
// 25 seconds
//   ↓
// ...continues...
//
// ============================================================
//
// IMPORTANT
// ============================================================
//
// OFFERED does NOT reserve courier capacity.
//
// currentExpressCount
// currentBatchCount
//
// are changed ONLY when a courier ACCEPTS.
//
// ============================================================
//
// MAXI
// ============================================================
//
// MAXI is NOT handled here.
// MAXI uses the separate marketplace / bidding flow.
//
// ============================================================

// ============================================================
// AWS SDK
// ============================================================

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const {
  DynamoDBDocumentClient,
  QueryCommand,
  TransactWriteCommand,
} = require("@aws-sdk/lib-dynamodb");

// ============================================================
// TRANSPORT COMPATIBILITY
// ============================================================

const { isTransportCompatible } = require("./transportLambda");

// ============================================================
// CLIENT
// ============================================================

const client = new DynamoDBClient({});

const docClient = DynamoDBDocumentClient.from(client);

// ============================================================
// TABLES
// ============================================================

const COURIER_TABLE =
  process.env.COURIER_TABLE || "Courier-n4tb6ywvhnf3zesv5ibhpitqiq-staging";

const ORDER_TABLE =
  process.env.ORDER_TABLE || "Order-n4tb6ywvhnf3zesv5ibhpitqiq-staging";

// ============================================================
// DISPATCH CONFIGURATION
// ============================================================
//
// MICRO:
// 5km → 8km
//
// MOTO:
// 5km → 10km → 15km → 20km → 25km
//
// ============================================================

const MICRO_RADIUS_STEPS = [5, 8];

const MOTO_RADIUS_STEPS = [5, 10, 15, 20, 25];

// ============================================================
// OFFER TIMEOUT
// ============================================================

const ASSIGNMENT_TIMEOUT_MS = 25 * 1000;

// ============================================================
// CAPACITY
// ============================================================

const MAX_BATCH_JOBS = 10;

const MAX_EXPRESS_JOBS = 1;

// ============================================================
// HANDLER
// ============================================================

exports.handler = async (event) => {
  const startedAt = Date.now();

  const now = new Date().toISOString();

  console.log("==================================================");
  console.log("🔄 REASSIGN ORDER LAMBDA STARTED");
  console.log("==================================================");

  console.log("Current time:", now);

  console.log("Environment:", {
    ORDER_TABLE,
    COURIER_TABLE,
  });

  console.log("Event:", JSON.stringify(event || {}));

  // ==========================================================
  // FIND EXPIRED OFFERS
  // ==========================================================

  let orders;

  try {
    orders = await getExpiredOffers(now);
  } catch (error) {
    console.error("❌ FAILED TO FIND EXPIRED OFFERS");

    console.error(error);

    throw error;
  }

  console.log(`📦 Found ${orders.length} expired offer(s).`);

  // ==========================================================
  // NOTHING TO DO
  // ==========================================================

  if (orders.length === 0) {
    console.log("ℹ️ No expired offers require reassignment.");

    console.log(`🏁 Finished in ${Date.now() - startedAt}ms`);

    return {
      success: true,
      processed: 0,
      reassigned: 0,
    };
  }

  // ==========================================================
  // PROCESS EACH ORDER
  // ==========================================================

  let processed = 0;

  let reassigned = 0;

  for (const order of orders) {
    processed++;

    try {
      console.log("--------------------------------------------------");

      console.log("♻️ PROCESSING EXPIRED OFFER");

      console.log({
        orderId: order.id,
        userID: order.userID,
        status: order.status,
        paymentStatus: order.paymentStatus,
        transportationType: order.transportationType,
        assignedCourierId: order.assignedCourierId,
        assignmentStatus: order.assignmentStatus,
        assignmentExpiresAt: order.assignmentExpiresAt,
        assignmentAttempts: order.assignmentAttempts,
        dispatchRound: order.dispatchRound,
        dispatchRadiusKm: order.dispatchRadiusKm,
        dispatchAttemptedCourierIds: order.dispatchAttemptedCourierIds,
      });

      // ========================================================
      // MAXI
      // ========================================================

      if (order.transportationType === "MAXI") {
        console.log(
          "🚚 MAXI ORDER — AUTOMATIC REASSIGNMENT SKIPPED:",
          order.id,
        );

        continue;
      }

      // ========================================================
      // ORDER MUST STILL BE READY
      // ========================================================

      if (order.status !== "READY_FOR_PICKUP") {
        console.log("⏭️ ORDER NO LONGER READY_FOR_PICKUP", {
          orderId: order.id,
          status: order.status,
        });

        continue;
      }

      // ========================================================
      // PAYMENT MUST STILL BE PAID
      // ========================================================

      if (order.paymentStatus !== "PAID") {
        console.log("⏭️ ORDER PAYMENT IS NOT PAID", {
          orderId: order.id,
          paymentStatus: order.paymentStatus,
        });

        continue;
      }

      // ========================================================
      // PROCESS
      // ========================================================

      const result = await processExpiredOffer(order);

      if (result?.reassigned) {
        reassigned++;
      }
    } catch (error) {
      console.error("❌ ERROR PROCESSING EXPIRED ORDER", {
        orderId: order.id,
        errorName: error?.name,
        errorMessage: error?.message,
        stack: error?.stack,
      });

      // Continue processing the remaining orders.
      continue;
    }
  }

  // ==========================================================
  // FINISHED
  // ==========================================================

  console.log("==================================================");

  console.log("🏁 REASSIGN ORDER LAMBDA FINISHED");

  console.log({
    processed,
    reassigned,
    durationMs: Date.now() - startedAt,
  });

  console.log("==================================================");

  return {
    success: true,
    processed,
    reassigned,
  };
};

// ============================================================
// FIND EXPIRED OFFERS
// ============================================================
//
// GSI:
//
// byAssignmentStatus
//
// Partition key:
// assignmentStatus
//
// Sort key:
// assignmentExpiresAt
//
// We only want:
//
// assignmentStatus = OFFERED
//
// AND
//
// assignmentExpiresAt <= now
//
// ============================================================

async function getExpiredOffers(now) {
  const items = [];

  let lastKey = undefined;

  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: ORDER_TABLE,

        IndexName: "byAssignmentStatus",

        KeyConditionExpression:
          "assignmentStatus = :offered AND assignmentExpiresAt <= :now",

        ExpressionAttributeValues: {
          ":offered": "OFFERED",

          ":now": now,
        },

        ExclusiveStartKey: lastKey,
      }),
    );

    if (result.Items?.length) {
      items.push(...result.Items);
    }

    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return items;
}

// ============================================================
// PROCESS EXPIRED OFFER
// ============================================================

async function processExpiredOffer(order) {
  const previousCourierId = order.assignedCourierId;

  // ==========================================================
  // SAFETY
  // ==========================================================

  if (!previousCourierId) {
    console.log("⚠️ EXPIRED OFFER HAS NO ASSIGNED COURIER", {
      orderId: order.id,
      assignmentStatus: order.assignmentStatus,
    });

    return {
      reassigned: false,
      reason: "NO_ASSIGNED_COURIER",
    };
  }

  // ==========================================================
  // BUILD ATTEMPTED COURIER LIST
  // ==========================================================

  let attemptedCourierIds = Array.isArray(order.dispatchAttemptedCourierIds)
    ? [...order.dispatchAttemptedCourierIds]
    : [];

  // ==========================================================
  // ADD PREVIOUS COURIER
  // ==========================================================

  if (!attemptedCourierIds.includes(previousCourierId)) {
    attemptedCourierIds.push(previousCourierId);
  }

  // Remove duplicates.

  attemptedCourierIds = Array.from(new Set(attemptedCourierIds));

  console.log("📋 UPDATED ATTEMPTED COURIER LIST", {
    orderId: order.id,
    previousCourierId,
    attemptedCourierIds,
  });

  // ==========================================================
  // EXPIRE CURRENT OFFER ATOMICALLY
  // ==========================================================

  const expired = await expireCurrentOffer(
    order,
    previousCourierId,
    attemptedCourierIds,
  );

  // ==========================================================
  // ANOTHER PROCESS ALREADY HANDLED IT
  // ==========================================================

  if (!expired) {
    console.log("⏭️ OFFER WAS ALREADY HANDLED", {
      orderId: order.id,
    });

    return {
      reassigned: false,
      reason: "ALREADY_HANDLED",
    };
  }

  // ==========================================================
  // RELOAD THE LOGICAL STATE
  // ==========================================================
  //
  // We deliberately use the state we just committed.
  //
  // The order is now:
  //
  // assignmentStatus = EXPIRED
  // assignedCourierId = null
  //
  // ==========================================================

  const dispatchResult = await dispatchNextCourier({
    ...order,

    assignedCourierId: null,

    assignmentStatus: "EXPIRED",

    dispatchAttemptedCourierIds: attemptedCourierIds,
  });

  return {
    reassigned: dispatchResult?.offered === true,
    reason: dispatchResult?.reason,
    courierId: dispatchResult?.courierId,
  };
}

// ============================================================
// EXPIRE CURRENT OFFER
// ============================================================
//
// OFFERED
//    ↓
// EXPIRED
//
// assignedCourierId
//    ↓
// null
//
// dispatchAttemptedCourierIds
//    ↓
// previous courier added
//
// ============================================================
//
// IMPORTANT:
//
// NO COURIER CAPACITY IS CHANGED.
//
// ============================================================

async function expireCurrentOffer(
  order,
  previousCourierId,
  attemptedCourierIds,
) {
  const now = new Date().toISOString();

  try {
    await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: ORDER_TABLE,

              Key: {
                id: order.id,
              },

              UpdateExpression: `
                SET
                  assignmentStatus = :expired,
                  assignedCourierId = :nullCourier,
                  dispatchAttemptedCourierIds = :attemptedIds
              `,

              ConditionExpression: `
                #status = :ready

                AND assignmentStatus = :offered

                AND assignedCourierId = :previousCourier

                AND assignmentExpiresAt <= :now
              `,

              ExpressionAttributeNames: {
                "#status": "status",
              },

              ExpressionAttributeValues: {
                ":expired": "EXPIRED",

                ":offered": "OFFERED",

                ":previousCourier": previousCourierId,

                ":nullCourier": null,

                ":attemptedIds": attemptedCourierIds,

                ":now": now,

                ":ready": "READY_FOR_PICKUP",
              },
            },
          },
        ],
      }),
    );

    console.log("♻️ OFFER EXPIRED SUCCESSFULLY", {
      orderId: order.id,
      previousCourierId,
      assignmentStatus: "EXPIRED",
      assignedCourierId: null,
      attemptedCourierIds,
    });

    return true;
  } catch (error) {
    if (error.name === "TransactionCanceledException") {
      console.log("⚠️ EXPIRATION TRANSACTION CANCELLED", {
        orderId: order.id,
        previousCourierId,
        reason:
          "Offer was probably accepted, replaced, cancelled, or already processed.",
      });

      return false;
    }

    console.error("❌ FAILED TO EXPIRE OFFER", {
      orderId: order.id,
      previousCourierId,
      errorName: error?.name,
      errorMessage: error?.message,
    });

    throw error;
  }
}

// ============================================================
// DISPATCH NEXT COURIER
// ============================================================

async function dispatchNextCourier(order) {
  // ==========================================================
  // MAXI
  // ==========================================================

  if (order.transportationType === "MAXI") {
    console.log("🚚 MAXI — AUTOMATIC DISPATCH DISABLED", order.id);

    return {
      offered: false,
      reason: "MAXI",
    };
  }

  // ==========================================================
  // LOCATION VALIDATION
  // ==========================================================

  if (
    typeof order.originLat !== "number" ||
    typeof order.originLng !== "number"
  ) {
    console.log("❌ INVALID PICKUP COORDINATES", {
      orderId: order.id,
      originLat: order.originLat,
      originLng: order.originLng,
    });

    return {
      offered: false,
      reason: "INVALID_COORDINATES",
    };
  }

  // ==========================================================
  // RADIUS CONFIGURATION
  // ==========================================================

  const radiusSteps = getRadiusSteps(order.transportationType);

  if (!radiusSteps.length) {
    console.log("🚫 NO RADIUS CONFIGURATION", {
      orderId: order.id,
      transportationType: order.transportationType,
    });

    return {
      offered: false,
      reason: "NO_RADIUS_CONFIGURATION",
    };
  }

  // ==========================================================
  // CURRENT ROUND
  // ==========================================================

  let dispatchRound = Number(order.dispatchRound) || 1;

  // ==========================================================
  // CURRENT RADIUS
  // ==========================================================

  let currentRadius = Number(order.dispatchRadiusKm) || radiusSteps[0];

  // ==========================================================
  // NORMALIZE RADIUS
  // ==========================================================

  if (!radiusSteps.includes(currentRadius)) {
    currentRadius = radiusSteps[0];
  }

  // ==========================================================
  // ATTEMPTED COURIERS
  // ==========================================================

  let attemptedCourierIds = Array.isArray(order.dispatchAttemptedCourierIds)
    ? [...new Set(order.dispatchAttemptedCourierIds)]
    : [];

  console.log("📡 CURRENT DISPATCH STATE", {
    orderId: order.id,
    dispatchRound,
    currentRadius,
    radiusSteps,
    attemptedCourierCount: attemptedCourierIds.length,
    attemptedCourierIds,
  });

  // ==========================================================
  // GET AVAILABLE COURIERS
  // ==========================================================

  const couriers = await getAvailableCouriers();

  console.log("👥 AVAILABLE COURIERS", {
    orderId: order.id,
    count: couriers.length,
  });

  if (!couriers.length) {
    console.log("⚠️ NO ONLINE + APPROVED COURIERS", order.id);

    return {
      offered: false,
      reason: "NO_AVAILABLE_COURIERS",
    };
  }

  // ==========================================================
  // SEARCH CURRENT RADIUS
  // ==========================================================

  let candidates = getCandidates(
    order,
    couriers,
    currentRadius,
    attemptedCourierIds,
  );

  console.log("📍 CURRENT RADIUS SEARCH", {
    orderId: order.id,
    radius: currentRadius,
    candidateCount: candidates.length,
  });

  // ==========================================================
  // TRY CANDIDATES
  // ==========================================================

  for (const candidate of candidates) {
    const courier = candidate.courier;

    const distance = candidate.distance;

    console.log("🔎 EVALUATING COURIER", {
      orderId: order.id,

      courierId: courier.id,

      distanceKm: Number(distance.toFixed(2)),

      transportationType: courier.transportationType,

      vehicleClass: courier.vehicleClass,

      isOnline: courier.isOnline,

      isApproved: courier.isApproved,

      isBlocked: courier.isBlocked,

      currentBatchCount: courier.currentBatchCount || 0,

      currentExpressCount: courier.currentExpressCount || 0,
    });

    // ========================================================
    // TRANSPORT COMPATIBILITY
    // ========================================================

    if (!isTransportCompatible(order, courier)) {
      console.log("🚫 TRANSPORT INCOMPATIBLE", courier.id);

      continue;
    }

    // ========================================================
    // CAPACITY
    // ========================================================

    if (!canAccept(courier, order)) {
      console.log("🚫 COURIER HAS NO CURRENT CAPACITY", {
        courierId: courier.id,

        currentBatchCount: courier.currentBatchCount || 0,

        currentExpressCount: courier.currentExpressCount || 0,
      });

      continue;
    }

    // ========================================================
    // CREATE OFFER
    // ========================================================

    const success = await createOffer(
      order,
      courier,
      currentRadius,
      dispatchRound,
      attemptedCourierIds,
    );

    // ========================================================
    // OFFER CREATED
    // ========================================================

    if (success) {
      console.log("==================================================");

      console.log("✅ COURIER OFFERED ORDER", {
        orderId: order.id,

        courierId: courier.id,

        distanceKm: Number(distance.toFixed(2)),

        dispatchRound,

        dispatchRadiusKm: currentRadius,

        assignmentStatus: "OFFERED",

        expiresInSeconds: 25,

        capacityReserved: false,
      });

      console.log("==================================================");

      return {
        offered: true,
        reason: "OFFER_CREATED",
        courierId: courier.id,
      };
    }

    // ========================================================
    // OFFER FAILED
    // ========================================================

    console.log("⚠️ OFFER TRANSACTION FAILED — TRYING NEXT COURIER", {
      orderId: order.id,
      courierId: courier.id,
    });
  }

  // ==========================================================
  // CURRENT RADIUS EXHAUSTED
  // ==========================================================

  console.log("⚠️ NO COURIER COULD RECEIVE OFFER AT CURRENT RADIUS", {
    orderId: order.id,
    currentRadius,
    dispatchRound,
  });

  // ==========================================================
  // MOVE TO NEXT RADIUS
  // ==========================================================

  const radiusIndex = radiusSteps.indexOf(currentRadius);

  const nextRadius = radiusSteps[radiusIndex + 1];

  if (nextRadius !== undefined) {
    console.log("📈 EXPANDING DISPATCH RADIUS", {
      orderId: order.id,

      previousRadius: currentRadius,

      nextRadius,

      dispatchRound,
    });

    const updated = await updateDispatchState(order, {
      dispatchRound,

      dispatchRadiusKm: nextRadius,

      dispatchAttemptedCourierIds: attemptedCourierIds,
    });

    if (!updated) {
      console.log("⏭️ RADIUS UPDATE CANCELLED — ORDER STATE CHANGED", order.id);

      return {
        offered: false,
        reason: "STATE_CHANGED",
      };
    }

    // ========================================================
    // SEARCH NEXT RADIUS IMMEDIATELY
    // ========================================================

    return dispatchNextCourier({
      ...order,

      dispatchRound,

      dispatchRadiusKm: nextRadius,

      dispatchAttemptedCourierIds: attemptedCourierIds,

      assignmentStatus: "EXPIRED",

      assignedCourierId: null,
    });
  }

  // ==========================================================
  // MAXIMUM RADIUS EXHAUSTED
  // ==========================================================

  console.log("🔚 MAXIMUM RADIUS EXHAUSTED", {
    orderId: order.id,

    dispatchRound,

    maximumRadius: radiusSteps[radiusSteps.length - 1],

    attemptedCourierCount: attemptedCourierIds.length,
  });

  // ==========================================================
  // START NEW DISPATCH ROUND
  // ==========================================================

  dispatchRound += 1;

  const resetRadius = radiusSteps[0];

  console.log("🔄 STARTING NEW DISPATCH ROUND", {
    orderId: order.id,

    previousRound: dispatchRound - 1,

    newRound: dispatchRound,

    resetRadius,
  });

  // ==========================================================
  // RESET ATTEMPTED COURIERS
  // ==========================================================

  attemptedCourierIds = [];

  const updated = await updateDispatchState(order, {
    dispatchRound,

    dispatchRadiusKm: resetRadius,

    dispatchAttemptedCourierIds: [],
  });

  if (!updated) {
    console.log(
      "⏭️ NEW DISPATCH ROUND CANCELLED — ORDER STATE CHANGED",
      order.id,
    );

    return {
      offered: false,
      reason: "STATE_CHANGED",
    };
  }

  // ==========================================================
  // START NEW ROUND
  // ==========================================================

  return dispatchNextCourier({
    ...order,

    dispatchRound,

    dispatchRadiusKm: resetRadius,

    dispatchAttemptedCourierIds: [],

    assignmentStatus: "EXPIRED",

    assignedCourierId: null,
  });
}

// ============================================================
// CREATE NEW OFFER
// ============================================================
//
// OFFERED:
//
// assignedCourierId = courier
// assignmentStatus = OFFERED
// assignmentExpiresAt = now + 25 seconds
//
// NO COURIER CAPACITY UPDATE.
//
// ============================================================

async function createOffer(
  order,
  courier,
  radiusKm,
  dispatchRound,
  attemptedCourierIds,
) {
  const now = new Date();

  const expiresAt = new Date(
    now.getTime() + ASSIGNMENT_TIMEOUT_MS,
  ).toISOString();

  const nowISO = now.toISOString();

  // ==========================================================
  // ADD COURIER TO ATTEMPTED LIST
  // ==========================================================

  const updatedAttemptedIds = Array.from(
    new Set([...(attemptedCourierIds || []), courier.id]),
  );

  // ==========================================================
  // ATTEMPT COUNT
  // ==========================================================

  const assignmentAttempts = Number(order.assignmentAttempts || 0) + 1;

  try {
    await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: ORDER_TABLE,

              Key: {
                id: order.id,
              },

              // =================================================
              // CREATE OFFER
              // =================================================

              UpdateExpression: `
                SET
                  assignedCourierId = :courierId,
                  assignmentStatus = :offered,
                  assignmentExpiresAt = :expiresAt,
                  assignmentAttempts = :attempts,
                  lastAssignedAt = :now,
                  dispatchAttemptedCourierIds = :attemptedIds,
                  dispatchRound = :dispatchRound,
                  dispatchRadiusKm = :radiusKm
              `,

              // =================================================
              // CRITICAL CONDITION
              // =================================================
              //
              // Only create an offer when:
              //
              // READY_FOR_PICKUP
              // PAID
              // EXPIRED
              // unassigned
              //
              // =================================================

              ConditionExpression: `
                #status = :ready

                AND paymentStatus = :paid

                AND assignmentStatus = :expired

                AND (
                  attribute_not_exists(assignedCourierId)

                  OR

                  assignedCourierId = :nullCourier
                )
              `,

              ExpressionAttributeNames: {
                "#status": "status",
              },

              ExpressionAttributeValues: {
                ":courierId": courier.id,

                ":offered": "OFFERED",

                ":expiresAt": expiresAt,

                ":attempts": assignmentAttempts,

                ":now": nowISO,

                ":attemptedIds": updatedAttemptedIds,

                ":dispatchRound": dispatchRound,

                ":radiusKm": radiusKm,

                ":ready": "READY_FOR_PICKUP",

                ":paid": "PAID",

                ":expired": "EXPIRED",

                ":nullCourier": null,
              },
            },
          },
        ],
      }),
    );

    console.log("✅ NEW OFFER CREATED", {
      orderId: order.id,

      courierId: courier.id,

      expiresAt,

      dispatchRound,

      radiusKm,

      assignmentAttempts,

      assignmentStatus: "OFFERED",

      capacityReserved: false,

      attemptedCourierIds: updatedAttemptedIds,
    });

    return true;
  } catch (error) {
    if (error.name === "TransactionCanceledException") {
      console.log("⚠️ CREATE OFFER TRANSACTION CANCELLED", {
        orderId: order.id,

        courierId: courier.id,

        reason: "Order state changed before offer could be created.",
      });

      return false;
    }

    console.error("❌ CREATE OFFER FAILED", {
      orderId: order.id,

      courierId: courier.id,

      errorName: error?.name,

      errorMessage: error?.message,
    });

    throw error;
  }
}

// ============================================================
// UPDATE DISPATCH STATE
// ============================================================
//
// Used for:
//
// 5 → 8
// 5 → 10
// 10 → 15
// 15 → 20
// 20 → 25
//
// OR
//
// starting a new dispatch round.
//
// ============================================================

async function updateDispatchState(order, state) {
  try {
    await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: ORDER_TABLE,

              Key: {
                id: order.id,
              },

              UpdateExpression: `
                SET
                  dispatchRound = :dispatchRound,
                  dispatchRadiusKm = :radiusKm,
                  dispatchAttemptedCourierIds = :attemptedIds
              `,

              ConditionExpression: `
                #status = :ready

                AND assignmentStatus = :expired

                AND (
                  attribute_not_exists(assignedCourierId)

                  OR

                  assignedCourierId = :nullCourier
                )
              `,

              ExpressionAttributeNames: {
                "#status": "status",
              },

              ExpressionAttributeValues: {
                ":dispatchRound": state.dispatchRound,

                ":radiusKm": state.dispatchRadiusKm,

                ":attemptedIds": state.dispatchAttemptedCourierIds,

                ":ready": "READY_FOR_PICKUP",

                ":expired": "EXPIRED",

                ":nullCourier": null,
              },
            },
          },
        ],
      }),
    );

    console.log("📡 DISPATCH STATE UPDATED", {
      orderId: order.id,

      dispatchRound: state.dispatchRound,

      dispatchRadiusKm: state.dispatchRadiusKm,

      attemptedCourierCount: state.dispatchAttemptedCourierIds.length,
    });

    return true;
  } catch (error) {
    if (error.name === "TransactionCanceledException") {
      console.log("⚠️ DISPATCH STATE UPDATE CANCELLED", order.id);

      return false;
    }

    console.error("❌ DISPATCH STATE UPDATE FAILED", {
      orderId: order.id,

      errorName: error?.name,

      errorMessage: error?.message,
    });

    throw error;
  }
}

// ============================================================
// GET AVAILABLE COURIERS
// ============================================================

async function getAvailableCouriers() {
  const items = [];

  let lastKey = undefined;

  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: COURIER_TABLE,

        IndexName: "byStatus",

        KeyConditionExpression: "statusKey = :status",

        ExpressionAttributeValues: {
          ":status": "ONLINE#APPROVED",
        },

        ExclusiveStartKey: lastKey,
      }),
    );

    if (result.Items?.length) {
      items.push(...result.Items);
    }

    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return items.filter((courier) => {
    return (
      courier.isOnline === true &&
      courier.isApproved === true &&
      courier.isBlocked !== true
    );
  });
}

// ============================================================
// GET CANDIDATES
// ============================================================

function getCandidates(order, couriers, radius, attemptedCourierIds) {
  const attempted = new Set(attemptedCourierIds || []);

  return (
    couriers

      // ========================================================
      // BASIC FILTER
      // ========================================================

      .filter((courier) => {
        if (
          typeof courier.lat !== "number" ||
          typeof courier.lng !== "number"
        ) {
          return false;
        }

        if (courier.isOnline !== true) {
          return false;
        }

        if (courier.isApproved !== true) {
          return false;
        }

        if (courier.isBlocked === true) {
          return false;
        }

        // Already attempted in this round.

        if (attempted.has(courier.id)) {
          return false;
        }

        const distance = getDistance(
          courier.lat,
          courier.lng,
          order.originLat,
          order.originLng,
        );

        return distance <= radius;
      })

      // ========================================================
      // DISTANCE
      // ========================================================

      .map((courier) => {
        const distance = getDistance(
          courier.lat,
          courier.lng,
          order.originLat,
          order.originLng,
        );

        return {
          courier,
          distance,
        };
      })

      // ========================================================
      // NEAREST FIRST
      // ========================================================

      .sort((a, b) => a.distance - b.distance)
  );
}

// ============================================================
// RADIUS CONFIGURATION
// ============================================================

function getRadiusSteps(transportationType) {
  switch (transportationType) {
    case "MICRO_EXPRESS":

    case "MICRO_BATCH":
      return [...MICRO_RADIUS_STEPS];

    case "MOTO_EXPRESS":

    case "MOTO_BATCH":
      return [...MOTO_RADIUS_STEPS];

    case "MAXI":
      return [];

    default:
      return [];
  }
}

// ============================================================
// ORDER TYPE
// ============================================================

function isExpressOrder(order) {
  return (
    typeof order?.transportationType === "string" &&
    order.transportationType.endsWith("_EXPRESS")
  );
}

function isBatchOrder(order) {
  return (
    typeof order?.transportationType === "string" &&
    order.transportationType.endsWith("_BATCH")
  );
}

// ============================================================
// CAPACITY CHECK
// ============================================================
//
// IMPORTANT:
//
// This only determines whether a courier is currently
// eligible.
//
// It does NOT reserve capacity.
//
// ============================================================

function canAccept(courier, order) {
  const batch = Number(courier.currentBatchCount || 0);

  const express = Number(courier.currentExpressCount || 0);

  const isExpress = isExpressOrder(order);

  const isBatch = isBatchOrder(order);

  // ==========================================================
  // UNKNOWN
  // ==========================================================

  if (!isExpress && !isBatch) {
    return false;
  }

  // ==========================================================
  // EXPRESS
  // ==========================================================

  if (isExpress) {
    if (express >= MAX_EXPRESS_JOBS) {
      return false;
    }

    // Batch jobs prevent Express.

    if (batch > 0) {
      return false;
    }

    return true;
  }

  // ==========================================================
  // BATCH
  // ==========================================================

  if (isBatch) {
    // Express prevents Batch.

    if (express > 0) {
      return false;
    }

    if (batch >= MAX_BATCH_JOBS) {
      return false;
    }

    return true;
  }

  return false;
}

// ============================================================
// HAVERSINE DISTANCE
// ============================================================

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;

  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
