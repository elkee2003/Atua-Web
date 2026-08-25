// ============================================================
// ASSIGN ORDER LAMBDA
// ============================================================
//
// RESPONSIBILITY:
//
// MICRO / MOTO
// -------------------------
// When an order ENTERS READY_FOR_PICKUP and is PAID:
//
// 1. Find eligible courier.
// 2. Start an offer.
// 3. Give courier 25 seconds.
// 4. DO NOT reserve courier capacity.
//
// If courier accepts:
//     accept flow reserves/increments capacity.
//
// If courier rejects/times out:
//     reassignOrder handles the next courier.
//
// MAXI
// -------------------------
// NOT handled here.
// MAXI uses the separate bidding / marketplace flow.
//
// ============================================================

// ============================================================
// AWS SDK v3
// ============================================================

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const {
  DynamoDBDocumentClient,
  QueryCommand,
  TransactWriteCommand,
} = require("@aws-sdk/lib-dynamodb");

const { unmarshall } = require("@aws-sdk/util-dynamodb");

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

// Initial search radius
const INITIAL_RADIUS_KM = 5;

// Maximum radius for MICRO
const MICRO_MAX_RADIUS_KM = 8;

// Maximum radius for MOTO
const MOTO_MAX_RADIUS_KM = 25;

// How long courier has to respond
const ASSIGNMENT_TIMEOUT_MS = 25 * 1000;

// ============================================================
// CAPACITY LIMITS
// ============================================================
//
// IMPORTANT:
//
// These are ONLY eligibility checks.
//
// This Lambda DOES NOT reserve capacity.
//
// The actual acceptance Lambda MUST perform
// the authoritative atomic capacity check.
//
// ============================================================

const MAX_BATCH_JOBS = 10;

const MAX_EXPRESS_JOBS = 1;

// ============================================================
// HANDLER
// ============================================================

exports.handler = async (event) => {
  console.log("==================================================");
  console.log("🚀 ASSIGN ORDER LAMBDA TRIGGERED");
  console.log("Records:", event?.Records?.length || 0);
  console.log("==================================================");

  for (const record of event?.Records || []) {
    try {
      // ========================================================
      // EVENT TYPE
      // ========================================================

      console.log("📨 DynamoDB event:", {
        eventName: record.eventName,
        eventID: record.eventID,
      });

      // Only INSERT and MODIFY are relevant.
      if (record.eventName !== "INSERT" && record.eventName !== "MODIFY") {
        console.log("⏭️ Ignoring event:", record.eventName);
        continue;
      }

      // ========================================================
      // NEW IMAGE
      // ========================================================

      if (!record.dynamodb?.NewImage) {
        console.log("⚠️ No NewImage found. Skipping.");
        continue;
      }

      // ========================================================
      // CONVERT DYNAMODB IMAGE
      // ========================================================

      const order = unmarshall(record.dynamodb.NewImage);

      if (!order) {
        console.log("⚠️ Could not read order.");
        continue;
      }

      // ========================================================
      // LOG ORDER
      // ========================================================

      console.log("📦 ORDER EVENT RECEIVED:", {
        orderId: order.id,
        eventName: record.eventName,
        status: order.status,
        paymentStatus: order.paymentStatus,
        transportationType: order.transportationType,
        assignedCourierId: order.assignedCourierId,
        assignmentStatus: order.assignmentStatus,
        assignmentAttempts: order.assignmentAttempts,
        dispatchRound: order.dispatchRound,
        dispatchRadiusKm: order.dispatchRadiusKm,
        dispatchAttemptedCourierIds: order.dispatchAttemptedCourierIds,
      });

      // ========================================================
      // ONLY READY_FOR_PICKUP
      // ========================================================

      if (order.status !== "READY_FOR_PICKUP") {
        console.log("⏭️ Order is not READY_FOR_PICKUP:", order.id);

        continue;
      }

      // ========================================================
      // PAYMENT SAFETY
      // ========================================================

      if (order.paymentStatus !== "PAID") {
        console.log("⏭️ READY_FOR_PICKUP but payment is not PAID:", {
          orderId: order.id,
          paymentStatus: order.paymentStatus,
        });

        continue;
      }

      // ========================================================
      // ONLY ASSIGN WHEN ENTERING READY_FOR_PICKUP
      // ========================================================

      if (record.eventName === "MODIFY") {
        if (!record.dynamodb?.OldImage) {
          console.log("⚠️ MODIFY event has no OldImage:", order.id);

          continue;
        }

        const previousOrder = unmarshall(record.dynamodb.OldImage);

        console.log("🔄 Previous order state:", {
          orderId: order.id,
          previousStatus: previousOrder.status,
          newStatus: order.status,
          previousAssignmentStatus: previousOrder.assignmentStatus,
          newAssignmentStatus: order.assignmentStatus,
        });

        // ------------------------------------------------------
        // IMPORTANT
        // ------------------------------------------------------
        //
        // Do not start a new dispatch merely because another
        // field on the order changed.
        //
        // The initial assignment happens when the order
        // ENTERS READY_FOR_PICKUP.
        //
        // ------------------------------------------------------

        if (previousOrder.status === "READY_FOR_PICKUP") {
          console.log("⏭️ Order was already READY_FOR_PICKUP:", order.id);

          continue;
        }
      }

      // ========================================================
      // ALREADY HAS ACTIVE OFFER
      // ========================================================

      if (order.assignedCourierId && order.assignmentStatus === "OFFERED") {
        console.log("⏭️ Order already has an active courier offer:", {
          orderId: order.id,
          courierId: order.assignedCourierId,
          expiresAt: order.assignmentExpiresAt,
        });

        continue;
      }

      // ========================================================
      // ALREADY ACCEPTED
      // ========================================================

      if (order.assignedCourierId && order.assignmentStatus === "ACCEPTED") {
        console.log("⏭️ Order has already been accepted:", {
          orderId: order.id,
          courierId: order.assignedCourierId,
        });

        continue;
      }

      // ========================================================
      // MAXI
      // ========================================================

      if (order.transportationType === "MAXI") {
        console.log("🚚 MAXI ORDER — automatic assignment skipped:", order.id);

        continue;
      }

      // ========================================================
      // MICRO / MOTO ONLY
      // ========================================================

      if (
        order.transportationType !== "MICRO_EXPRESS" &&
        order.transportationType !== "MICRO_BATCH" &&
        order.transportationType !== "MOTO_EXPRESS" &&
        order.transportationType !== "MOTO_BATCH"
      ) {
        console.log(
          "🚫 Unsupported transportation type:",
          order.transportationType,
        );

        continue;
      }

      // ========================================================
      // LOCATION VALIDATION
      // ========================================================

      if (
        typeof order.originLat !== "number" ||
        typeof order.originLng !== "number"
      ) {
        console.log("❌ Order has invalid pickup coordinates:", {
          orderId: order.id,
          originLat: order.originLat,
          originLng: order.originLng,
        });

        continue;
      }

      // ========================================================
      // START DISPATCH
      // ========================================================

      console.log("🎯 STARTING DISPATCH:", {
        orderId: order.id,
        transportationType: order.transportationType,
      });

      await createFirstOffer(order);
    } catch (error) {
      console.error("❌ Error processing stream record:", error);

      // Let DynamoDB Streams retry genuine errors.
      throw error;
    }
  }

  console.log("==================================================");
  console.log("🏁 ASSIGN ORDER LAMBDA FINISHED");
  console.log("==================================================");
};

// ============================================================
// CREATE FIRST OFFER
// ============================================================

async function createFirstOffer(order) {
  // ==========================================================
  // DETERMINE MAX RADIUS
  // ==========================================================

  const maxRadius = getMaximumRadius(order.transportationType);

  // ==========================================================
  // INITIAL DISPATCH STATE
  // ==========================================================

  const currentRadius = Number(order.dispatchRadiusKm) || INITIAL_RADIUS_KM;

  const dispatchRound = Number(order.dispatchRound) || 1;

  // ==========================================================
  // ATTEMPTED COURIERS
  // ==========================================================

  const attemptedCourierIds = Array.isArray(order.dispatchAttemptedCourierIds)
    ? [...order.dispatchAttemptedCourierIds]
    : [];

  console.log("📡 Dispatch configuration:", {
    orderId: order.id,
    initialRadiusKm: currentRadius,
    maxRadiusKm: maxRadius,
    dispatchRound,
    attemptedCouriers: attemptedCourierIds.length,
  });

  // ==========================================================
  // GET AVAILABLE COURIERS
  // ==========================================================

  const couriers = await getAvailableCouriers();

  if (!couriers.length) {
    console.log("⚠️ No ONLINE + APPROVED couriers found.");

    return;
  }

  console.log(`👥 Found ${couriers.length} ONLINE + APPROVED couriers.`);

  // ==========================================================
  // FILTER + SORT
  // ==========================================================

  const candidates = couriers
    .map((courier) => {
      if (typeof courier.lat !== "number" || typeof courier.lng !== "number") {
        return null;
      }

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

    .filter(Boolean)

    // Current radius
    .filter(({ distance }) => distance <= currentRadius)

    // Do not offer again to a courier already
    // attempted during this dispatch round.
    .filter(({ courier }) => !attemptedCourierIds.includes(courier.id))

    // Nearest first
    .sort((a, b) => a.distance - b.distance);

  console.log(
    `📍 ${candidates.length} eligible courier(s) within ${currentRadius}km.`,
  );

  // ==========================================================
  // FIND FIRST ELIGIBLE COURIER
  // ==========================================================

  for (const candidate of candidates) {
    const courier = candidate.courier;

    const distance = candidate.distance;

    console.log("🔎 Evaluating courier:", {
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
    // BLOCKED
    // ========================================================

    if (courier.isBlocked === true) {
      console.log("🚫 Courier is blocked:", courier.id);

      continue;
    }

    // ========================================================
    // ONLINE
    // ========================================================

    if (courier.isOnline !== true) {
      console.log("🚫 Courier is not online:", courier.id);

      continue;
    }

    // ========================================================
    // APPROVED
    // ========================================================

    if (courier.isApproved !== true) {
      console.log("🚫 Courier is not approved:", courier.id);

      continue;
    }

    // ========================================================
    // TRANSPORT COMPATIBILITY
    // ========================================================

    if (!isTransportCompatible(order, courier)) {
      console.log("🚫 Transport incompatible:", {
        orderId: order.id,
        courierId: courier.id,
        orderTransportationType: order.transportationType,
        courierTransportationType: courier.transportationType,
        vehicleClass: courier.vehicleClass,
      });

      continue;
    }

    // ========================================================
    // CAPACITY ELIGIBILITY CHECK
    // ========================================================
    //
    // IMPORTANT:
    //
    // This is ONLY a snapshot check.
    //
    // We DO NOT reserve capacity here.
    //
    // The courier acceptance Lambda MUST perform
    // the authoritative atomic capacity check.
    //
    // ========================================================

    if (!canAccept(courier, order)) {
      console.log("🚫 Courier currently has no capacity:", {
        courierId: courier.id,
        currentBatchCount: courier.currentBatchCount || 0,
        currentExpressCount: courier.currentExpressCount || 0,
        transportationType: order.transportationType,
      });

      continue;
    }

    // ========================================================
    // CREATE OFFER
    // ========================================================

    console.log("🎯 Creating courier offer:", {
      orderId: order.id,
      courierId: courier.id,
      distanceKm: Number(distance.toFixed(2)),
    });

    const success = await createOffer(
      order,
      courier,
      currentRadius,
      maxRadius,
      dispatchRound,
      attemptedCourierIds,
    );

    if (success) {
      console.log("==================================================");

      console.log("✅ OFFER CREATED:", {
        orderId: order.id,
        courierId: courier.id,
        distanceKm: Number(distance.toFixed(2)),
        assignmentStatus: "OFFERED",
        capacityReserved: false,
        expiresInSeconds: 25,
      });

      console.log("==================================================");

      return;
    }

    console.log("⚠️ Offer transaction failed. Trying next courier.");
  }

  // ==========================================================
  // NO COURIER IN CURRENT RADIUS
  // ==========================================================

  console.log("❌ NO ELIGIBLE COURIER FOUND IN CURRENT RADIUS:", {
    orderId: order.id,
    radiusKm: currentRadius,
    maxRadiusKm: maxRadius,
    attemptedCourierCount: attemptedCourierIds.length,
  });

  // ==========================================================
  // IMPORTANT
  // ==========================================================
  //
  // assignOrder DOES NOT expand the radius.
  //
  // reassignOrder is responsible for:
  //
  // 1. Expiring current offers.
  // 2. Moving to the next courier.
  // 3. Expanding the radius.
  // 4. Starting a new dispatch round if your
  //    reassignment policy allows it.
  //
  // This keeps the initial assignment deterministic.
  //
  // ==========================================================
}

// ============================================================
// CREATE OFFER TRANSACTION
// ============================================================
//
// IMPORTANT:
//
// This transaction ONLY updates the ORDER.
//
// It does NOT update the Courier.
//
// Therefore:
//
//     OFFERED → capacity unchanged
//
// The courier's capacity changes ONLY when the courier
// actually ACCEPTS the order.
//
// ============================================================

async function createOffer(
  order,
  courier,
  radiusKm,
  maxRadiusKm,
  dispatchRound,
  attemptedCourierIds,
) {
  const now = new Date();

  // ==========================================================
  // OFFER EXPIRATION
  // ==========================================================

  const expiresAt = new Date(
    now.getTime() + ASSIGNMENT_TIMEOUT_MS,
  ).toISOString();

  const nowISO = now.toISOString();

  // ==========================================================
  // UPDATE ATTEMPTED COURIERS
  // ==========================================================

  const updatedAttemptedCourierIds = Array.from(
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
              // OFFER STATE
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
                  dispatchRadiusKm = :radiusKm,
                  dispatchMaxRadiusKm = :maxRadiusKm
              `,

              // =================================================
              // SAFETY CONDITION
              // =================================================
              //
              // We only create the first offer when:
              //
              // 1. Order is READY_FOR_PICKUP
              // 2. Payment is PAID
              // 3. There is no active courier
              // 4. There is no active offer
              //
              // =================================================

              ConditionExpression: `
                #status = :ready

                AND paymentStatus = :paid

                AND (
                  attribute_not_exists(assignedCourierId)
                  OR assignedCourierId = :nullCourier
                )

                AND (
                  attribute_not_exists(assignmentStatus)
                  OR assignmentStatus = :none
                  OR assignmentStatus = :expired
                  OR assignmentStatus = :rejected
                  OR assignmentStatus = :cancelled
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

                ":ready": "READY_FOR_PICKUP",

                ":paid": "PAID",

                ":nullCourier": null,

                ":none": "NONE",

                ":expired": "EXPIRED",

                ":rejected": "REJECTED",

                ":cancelled": "CANCELLED",

                ":attemptedIds": updatedAttemptedCourierIds,

                ":dispatchRound": dispatchRound,

                ":radiusKm": radiusKm,

                ":maxRadiusKm": maxRadiusKm,
              },
            },
          },
        ],
      }),
    );

    console.log("✅ Offer transaction succeeded:", {
      orderId: order.id,
      courierId: courier.id,
      assignmentStatus: "OFFERED",
      expiresAt,
      assignmentAttempts,
      dispatchRound,
      radiusKm,
      maxRadiusKm,
      attemptedCourierIds: updatedAttemptedCourierIds,
      capacityChanged: false,
    });

    return true;
  } catch (error) {
    // ========================================================
    // TRANSACTION FAILED
    // ========================================================

    if (error.name === "TransactionCanceledException") {
      console.log("⚠️ Offer transaction cancelled:", {
        orderId: order.id,
        courierId: courier.id,
        reason:
          "Order may already have an offer, may have been accepted, or may no longer be READY_FOR_PICKUP.",
      });

      return false;
    }

    console.error("❌ Offer transaction error:", {
      orderId: order.id,
      courierId: courier.id,
      error,
    });

    throw error;
  }
}

// ============================================================
// GET AVAILABLE COURIERS
// ============================================================

async function getAvailableCouriers() {
  let items = [];

  let lastKey;

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

  // ==========================================================
  // EXTRA SAFETY FILTER
  // ==========================================================

  return items.filter((courier) => {
    return (
      courier.isOnline === true &&
      courier.isApproved === true &&
      courier.isBlocked !== true
    );
  });
}

// ============================================================
// CAPACITY CHECK
// ============================================================
//
// IMPORTANT:
//
// This is NOT the authoritative acceptance check.
//
// It is only used to avoid offering an order to an obviously
// unavailable courier.
//
// The ACCEPT transaction must check capacity atomically again.
//
// ============================================================

function canAccept(courier, order) {
  const batch = Number(courier.currentBatchCount || 0);

  const express = Number(courier.currentExpressCount || 0);

  const isExpress = isExpressOrder(order);

  const isBatch = isBatchOrder(order);

  // ==========================================================
  // UNKNOWN ORDER TYPE
  // ==========================================================

  if (!isExpress && !isBatch) {
    return false;
  }

  // ==========================================================
  // EXPRESS
  // ==========================================================

  if (isExpress) {
    // Only one Express order.
    if (express >= MAX_EXPRESS_JOBS) {
      return false;
    }

    // Batch blocks Express.
    if (batch > 0) {
      return false;
    }

    return true;
  }

  // ==========================================================
  // BATCH
  // ==========================================================

  if (isBatch) {
    // Express blocks Batch.
    if (express > 0) {
      return false;
    }

    // Maximum 10 Batch orders.
    if (batch >= MAX_BATCH_JOBS) {
      return false;
    }

    return true;
  }

  return false;
}

// ============================================================
// ORDER TYPE HELPERS
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
// GET MAXIMUM RADIUS
// ============================================================

function getMaximumRadius(transportationType) {
  switch (transportationType) {
    case "MICRO_EXPRESS":
    case "MICRO_BATCH":
      return MICRO_MAX_RADIUS_KM;

    case "MOTO_EXPRESS":
    case "MOTO_BATCH":
      return MOTO_MAX_RADIUS_KM;

    default:
      return 0;
  }
}

// ============================================================
// DISTANCE
// ============================================================
//
// Haversine distance.
//
// Returns kilometers.
//
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
