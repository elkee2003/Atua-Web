// ============================================================
// RESET COURIER IF IDLE
// ============================================================
//
// SAFETY / RECONCILIATION LAMBDA
//
// RESPONSIBILITY
// ------------------------------------------------------------
//
// This Lambda repairs stale Micro/Moto capacity counters.
//
// NORMAL FLOW:
//
//     Courier accepts order
//          ↓
//     capacity +1
//          ↓
//     order progresses
//          ↓
//     DELIVERED
//          ↓
//     OrderProvider releases capacity
//
// THIS LAMBDA IS ONLY A SAFETY NET.
//
// It does NOT:
//   - assign couriers
//   - offer orders
//   - reassign orders
//   - accept orders
//   - increment capacity
//   - decrement capacity during normal operation
//   - handle MAXI capacity
//
// It only repairs a courier when:
//
//     NO ACTIVE ORDERS
//              +
//     capacity counters are still > 0
//
// ============================================================

// ============================================================
// AWS SDK v3
// ============================================================

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const {
  DynamoDBDocumentClient,
  QueryCommand,
  UpdateCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

const { unmarshall } = require("@aws-sdk/util-dynamodb");

// ============================================================
// CLIENT
// ============================================================

const client = new DynamoDBClient({});

const docClient = DynamoDBDocumentClient.from(client);

// ============================================================
// TABLES
// ============================================================
//
// Prefer environment variables so the function follows the
// Amplify environment automatically.
//
// Example:
//
//     staging
//     production
//
// ============================================================

const COURIER_TABLE = process.env.COURIER_TABLE;

const ORDER_TABLE = process.env.ORDER_TABLE;

// ============================================================
// VALIDATE CONFIGURATION
// ============================================================

if (!COURIER_TABLE) {
  console.warn("⚠️ COURIER_TABLE environment variable is not configured.");
}

if (!ORDER_TABLE) {
  console.warn("⚠️ ORDER_TABLE environment variable is not configured.");
}

// ============================================================
// ACTIVE ORDER STATUSES
// ============================================================
//
// These statuses mean that the courier has actually accepted
// the order and the order still occupies courier capacity.
//
// IMPORTANT:
//
// OFFERED is intentionally NOT included.
//
// An OFFERED order has merely been presented to the courier.
// The courier has not accepted it yet.
//
// Therefore:
//
//     OFFERED → capacity unchanged
//
// ============================================================

const ACTIVE_ORDER_STATUSES = [
  "ACCEPTED",
  "ARRIVED_PICKUP",
  "LOADING",
  "PICKED_UP",
  "IN_TRANSIT",
  "ARRIVED_DROPOFF",
  "UNLOADING",
];

// ============================================================
// TERMINAL ORDER STATUSES
// ============================================================
//
// These orders no longer occupy courier capacity.
//
// Normally DELIVERED is the important one.
//
// CANCELLED and DISPUTED are also included as safety cases.
//
// ============================================================

const TERMINAL_ORDER_STATUSES = ["DELIVERED", "CANCELLED", "DISPUTED"];

// ============================================================
// HANDLER
// ============================================================

exports.handler = async (event) => {
  console.log("==================================================");
  console.log("🧹 RESET COURIER IF IDLE");
  console.log("==================================================");

  console.log("📦 Event records:", event?.Records?.length || 0);

  const records = event?.Records || [];

  // ----------------------------------------------------------
  // Nothing to process.
  // ----------------------------------------------------------

  if (!records.length) {
    console.log("⚠️ No DynamoDB records received.");

    return;
  }

  // ----------------------------------------------------------
  // Process every DynamoDB stream record.
  // ----------------------------------------------------------

  for (const record of records) {
    try {
      await processRecord(record);
    } catch (error) {
      console.error("❌ Failed processing record:", {
        eventID: record?.eventID,
        error: error.message,
        stack: error.stack,
      });

      // ------------------------------------------------------
      // Continue processing other records.
      // ------------------------------------------------------

      continue;
    }
  }

  console.log("==================================================");
  console.log("🏁 RESET COURIER IF IDLE FINISHED");
  console.log("==================================================");
};

// ============================================================
// PROCESS ONE STREAM RECORD
// ============================================================

async function processRecord(record) {
  if (!record) {
    return;
  }

  console.log("📨 DynamoDB event:", {
    eventName: record.eventName,
    eventID: record.eventID,
  });

  // ----------------------------------------------------------
  // We only care about MODIFY events.
  //
  // A courier's capacity is normally released because an
  // existing order changes state to DELIVERED/CANCELLED/etc.
  // ----------------------------------------------------------

  if (record.eventName !== "MODIFY") {
    console.log("⏭️ Ignoring non-MODIFY event:", record.eventName);

    return;
  }

  // ----------------------------------------------------------
  // NewImage is required.
  // ----------------------------------------------------------

  if (!record.dynamodb?.NewImage) {
    console.log("⚠️ MODIFY event has no NewImage.");

    return;
  }

  const newOrder = unmarshall(record.dynamodb.NewImage);

  // ----------------------------------------------------------
  // Log the order event.
  // ----------------------------------------------------------

  console.log("📦 Order modification:", {
    orderId: newOrder.id,
    status: newOrder.status,
    transportationType: newOrder.transportationType,
    assignedCourierId: newOrder.assignedCourierId,
  });

  // ----------------------------------------------------------
  // Only terminal states can trigger reconciliation.
  // ----------------------------------------------------------

  if (!TERMINAL_ORDER_STATUSES.includes(newOrder.status)) {
    console.log("⏭️ Order is not terminal:", newOrder.status);

    return;
  }

  // ----------------------------------------------------------
  // We need the courier that owned the order.
  // ----------------------------------------------------------

  const courierId = newOrder.assignedCourierId;

  if (!courierId) {
    console.log("⚠️ Terminal order has no assignedCourierId.");

    return;
  }

  console.log("🔎 Checking courier:", courierId);

  // ==========================================================
  // GET COURIER
  // ==========================================================

  const courier = await getCourier(courierId);

  if (!courier) {
    console.log("⚠️ Courier not found:", courierId);

    return;
  }

  // ----------------------------------------------------------
  // MAXI is a completely different dispatch/capacity system.
  //
  // NEVER reset currentMaxiCount here.
  // ----------------------------------------------------------

  if (courier.transportationType === "MAXI") {
    console.log("⛔ MAXI courier detected.");

    console.log("⛔ Automatic Micro/Moto reconciliation skipped:", courierId);

    return;
  }

  // ==========================================================
  // READ CURRENT CAPACITY
  // ==========================================================

  const currentBatchCount = Number(courier.currentBatchCount || 0);

  const currentExpressCount = Number(courier.currentExpressCount || 0);

  console.log("📊 Current courier capacity:", {
    courierId,
    currentBatchCount,
    currentExpressCount,
  });

  // ==========================================================
  // FIND ACTIVE ORDERS
  // ==========================================================

  const activeOrders = await getCourierActiveOrders(courierId);

  console.log("📊 Active courier orders:", {
    courierId,
    activeOrderCount: activeOrders.length,

    orders: activeOrders.map((order) => ({
      id: order.id,
      status: order.status,
      transportationType: order.transportationType,
    })),
  });

  // ==========================================================
  // CRITICAL SAFETY CHECK
  // ==========================================================
  //
  // If ANY active order exists:
  //
  //     DO NOT RESET
  //
  // Example:
  //
  //     Express A = DELIVERED
  //     Express B = IN_TRANSIT
  //
  // currentExpressCount might still be 1.
  //
  // That is CORRECT.
  //
  // Resetting it to 0 would allow the courier to receive
  // another Express order while already carrying one.
  //
  // ==========================================================

  if (activeOrders.length > 0) {
    console.log("🛑 Courier still has active orders.");

    console.log("🛑 Capacity will NOT be reset:", {
      courierId,
      activeOrderCount: activeOrders.length,
    });

    return;
  }

  // ==========================================================
  // COURIER IS TRULY IDLE
  // ==========================================================
  //
  // At this point:
  //
  //     activeOrders = 0
  //
  // Therefore the courier should have:
  //
  //     currentBatchCount = 0
  //     currentExpressCount = 0
  //
  // ==========================================================

  if (currentBatchCount === 0 && currentExpressCount === 0) {
    console.log("✅ Courier is already correctly idle.");

    return;
  }

  // ==========================================================
  // STALE CAPACITY DETECTED
  // ==========================================================

  console.log("🚨 STALE CAPACITY DETECTED:", {
    courierId,
    currentBatchCount,
    currentExpressCount,
    activeOrderCount: activeOrders.length,
  });

  // ==========================================================
  // REPAIR COUNTERS
  // ==========================================================

  await resetCourier(courierId);

  console.log("✅ Courier capacity reconciled:", courierId);
}

// ============================================================
// GET COURIER
// ============================================================

async function getCourier(courierId) {
  const result = await docClient.send(
    new GetCommand({
      TableName: COURIER_TABLE,

      Key: {
        id: courierId,
      },
    }),
  );

  return result.Item || null;
}

// ============================================================
// GET ACTIVE ORDERS
// ============================================================
//
// Query the courier's assigned orders through:
//
//     byAssignedCourier
//
// Then only retain orders that genuinely occupy capacity.
//
// ============================================================

async function getCourierActiveOrders(courierId) {
  let items = [];

  let lastKey;

  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: ORDER_TABLE,

        IndexName: "byAssignedCourier",

        KeyConditionExpression: "assignedCourierId = :courierId",

        ExpressionAttributeValues: {
          ":courierId": courierId,
        },

        ExclusiveStartKey: lastKey,
      }),
    );

    // --------------------------------------------------------
    // DynamoDB Query retrieves all assigned orders.
    //
    // We filter ACTIVE statuses in JavaScript instead of
    // putting the status in the key condition, because status
    // is not the partition key of this GSI.
    // --------------------------------------------------------

    if (result.Items?.length) {
      const active = result.Items.filter((order) =>
        ACTIVE_ORDER_STATUSES.includes(order.status),
      );

      items.push(...active);
    }

    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  return items;
}

// ============================================================
// RESET COURIER CAPACITY
// ============================================================
//
// This is ONLY called after we have confirmed:
//
//     activeOrders.length === 0
//
// Therefore it is safe to repair stale counters.
//
// IMPORTANT:
//
//     currentMaxiCount
//
// is intentionally untouched.
//
// ============================================================

async function resetCourier(courierId) {
  console.log("🔄 Repairing courier counters:", courierId);

  await docClient.send(
    new UpdateCommand({
      TableName: COURIER_TABLE,

      Key: {
        id: courierId,
      },

      UpdateExpression: `
        SET
          currentBatchCount = :zero,
          currentExpressCount = :zero,
          lastBatchAssignedAt = :null
      `,

      ExpressionAttributeValues: {
        ":zero": 0,

        ":null": null,
      },
    }),
  );

  console.log("✅ Courier counters repaired:", {
    courierId,
    currentBatchCount: 0,
    currentExpressCount: 0,
    lastBatchAssignedAt: null,
  });
}
