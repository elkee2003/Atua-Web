// ============================================================
// FORCE DISPATCH LAMBDA
// ============================================================
//
// RESPONSIBILITY
// ------------------------------------------------------------
//
// Starts orders that have ALREADY been ACCEPTED by a courier.
//
// This function does NOT:
//   - assign couriers
//   - offer orders
//   - reassign orders
//   - release offers
//   - increment courier capacity
//   - decrement courier capacity
//   - reset courier capacity
//   - handle MAXI orders
//
// CAPACITY RULE
// ------------------------------------------------------------
//
// Capacity is incremented when the courier ACCEPTS an order.
//
// Capacity remains reserved while the order is:
//   ACCEPTED
//   PICKED_UP
//   IN_TRANSIT
//
// Capacity is released only when the order reaches:
//   DELIVERED
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
} = require("@aws-sdk/lib-dynamodb");

// ============================================================
// CLIENT
// ============================================================

const client = new DynamoDBClient({});

const docClient = DynamoDBDocumentClient.from(client);

// ============================================================
// TABLES
// ============================================================
//
// Keep these aligned with your Amplify environment.
// Ideally these should eventually be environment variables,
// but using your current staging table names keeps this
// compatible with your existing function.
//

const COURIER_TABLE = "Courier-n4tb6ywvhnf3zesv5ibhpitqiq-staging";

const ORDER_TABLE = "Order-n4tb6ywvhnf3zesv5ibhpitqiq-staging";

// ============================================================
// HANDLER
// ============================================================

exports.handler = async () => {
  console.log("==================================================");
  console.log("🚀 FORCE DISPATCH LAMBDA STARTED");
  console.log("==================================================");

  try {
    // ----------------------------------------------------------
    // Find couriers who are currently online and approved.
    // ----------------------------------------------------------

    const couriers = await getOnlineCouriers();

    console.log(`👥 Found ${couriers.length} ONLINE + APPROVED courier(s).`);

    // ----------------------------------------------------------
    // Process each courier independently.
    // ----------------------------------------------------------

    for (const courier of couriers) {
      try {
        // ------------------------------------------------------
        // MAXI does not use this dispatch system.
        // ------------------------------------------------------

        if (courier.transportationType === "MAXI") {
          console.log("⛔ Skipping MAXI courier:", courier.id);

          continue;
        }

        await processCourier(courier);
      } catch (error) {
        console.error("❌ Failed processing courier:", {
          courierId: courier.id,
          error: error.message,
        });

        // Continue processing other couriers.
        continue;
      }
    }

    console.log("==================================================");
    console.log("🏁 FORCE DISPATCH LAMBDA FINISHED");
    console.log("==================================================");
  } catch (error) {
    console.error("❌ FORCE DISPATCH LAMBDA FAILED:", error);

    throw error;
  }
};

// ============================================================
// GET ONLINE + APPROVED COURIERS
// ============================================================
//
// Uses:
//
//     byStatus
//
// statusKey:
//
//     ONLINE#APPROVED
//
// ============================================================

async function getOnlineCouriers() {
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

  // ----------------------------------------------------------
  // Extra safety filtering.
  // ----------------------------------------------------------

  return items.filter((courier) => {
    return (
      courier.isOnline === true &&
      courier.isApproved === true &&
      courier.isBlocked !== true
    );
  });
}

// ============================================================
// PROCESS COURIER
// ============================================================
//
// IMPORTANT:
//
// We do NOT use currentExpressCount/currentBatchCount to
// determine whether an order should be started.
//
// Those fields represent CAPACITY.
//
// The actual source of truth for whether a courier has an
// accepted delivery waiting to start is the Order table.
//
// ============================================================

async function processCourier(courier) {
  console.log("🔎 Checking accepted orders for courier:", courier.id);

  const orders = await getAcceptedOrders(courier.id);

  if (!orders.length) {
    console.log("⏭️ No ACCEPTED orders waiting to start:", courier.id);

    return;
  }

  console.log(`📦 Found ${orders.length} ACCEPTED order(s):`, courier.id);

  // ----------------------------------------------------------
  // Start each accepted order.
  // ----------------------------------------------------------

  for (const order of orders) {
    await startAcceptedOrder(order, courier.id);
  }
}

// ============================================================
// GET ACCEPTED ORDERS
// ============================================================
//
// Only orders that have actually been accepted by this courier
// are returned.
//
// OFFERED orders are NOT touched.
//
// READY_FOR_PICKUP orders are NOT touched.
//
// PENDING orders are NOT touched.
//
// ============================================================

async function getAcceptedOrders(courierId) {
  let items = [];

  let lastKey;

  do {
    const result = await docClient.send(
      new QueryCommand({
        TableName: ORDER_TABLE,

        IndexName: "byAssignedCourier",

        KeyConditionExpression: "assignedCourierId = :courierId",

        FilterExpression: "#status = :accepted",

        ExpressionAttributeNames: {
          "#status": "status",
        },

        ExpressionAttributeValues: {
          ":courierId": courierId,

          ":accepted": "ACCEPTED",
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
// START ACCEPTED ORDER
// ============================================================
//
// ACCEPTED
//     ↓
// IN_TRANSIT
//
// The condition protects against race conditions.
//
// If another process changes the order first, this update
// simply fails safely.
//
// ============================================================

async function startAcceptedOrder(order, courierId) {
  // ----------------------------------------------------------
  // Safety checks.
  // ----------------------------------------------------------

  if (!order?.id) {
    console.log("⚠️ Skipping invalid order.");

    return;
  }

  // ----------------------------------------------------------
  // MAXI safety.
  // ----------------------------------------------------------

  if (order.transportationType === "MAXI") {
    console.log("⛔ Skipping MAXI order:", order.id);

    return;
  }

  // ----------------------------------------------------------
  // Only supported Micro/Moto orders.
  // ----------------------------------------------------------

  const supportedType =
    order.transportationType === "MICRO_EXPRESS" ||
    order.transportationType === "MICRO_BATCH" ||
    order.transportationType === "MOTO_EXPRESS" ||
    order.transportationType === "MOTO_BATCH";

  if (!supportedType) {
    console.log("⏭️ Unsupported transportation type:", {
      orderId: order.id,
      transportationType: order.transportationType,
    });

    return;
  }

  // ----------------------------------------------------------
  // Make sure this order is actually assigned to this courier.
  // ----------------------------------------------------------

  if (order.assignedCourierId !== courierId) {
    console.log("⛔ Order is not assigned to this courier:", {
      orderId: order.id,
      assignedCourierId: order.assignedCourierId,
      courierId,
    });

    return;
  }

  // ----------------------------------------------------------
  // Move ACCEPTED → IN_TRANSIT.
  // ----------------------------------------------------------

  try {
    await docClient.send(
      new UpdateCommand({
        TableName: ORDER_TABLE,

        Key: {
          id: order.id,
        },

        UpdateExpression: "SET #status = :inTransit",

        ExpressionAttributeNames: {
          "#status": "status",
        },

        ExpressionAttributeValues: {
          ":accepted": "ACCEPTED",

          ":inTransit": "IN_TRANSIT",
        },

        // ----------------------------------------------------
        // Critical race-condition protection.
        // ----------------------------------------------------

        ConditionExpression: "#status = :accepted",
      }),
    );

    console.log("🚚 ORDER STARTED:", {
      orderId: order.id,

      courierId,

      transportationType: order.transportationType,

      previousStatus: "ACCEPTED",

      newStatus: "IN_TRANSIT",
    });
  } catch (error) {
    // --------------------------------------------------------
    // Another process changed the order before us.
    // --------------------------------------------------------

    if (error.name === "ConditionalCheckFailedException") {
      console.log("⏭️ Order state changed before force dispatch:", order.id);

      return;
    }

    console.error("❌ Failed to start accepted order:", {
      orderId: order.id,
      courierId,
      error: error.message,
    });
  }
}
