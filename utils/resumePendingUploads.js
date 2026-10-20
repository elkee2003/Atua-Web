
import { MediaUploadStatus, Order } from "../src/models";
import { DataStore } from "aws-amplify/datastore";
import { uploadEvidence } from "./uploadEvidence";

let isRecovering = false;

export const resumePendingUploads = async (userId) => {
  if (!userId || isRecovering) return;

  isRecovering = true;

  try {
    const statuses = [
      MediaUploadStatus.PENDING,
      MediaUploadStatus.FAILED,
      MediaUploadStatus.UPLOADING,
    ];

    // Restrict recovery to orders owned by this signed-in user.
    const results = await Promise.all(
      statuses.map((status) =>
        DataStore.query(Order, (order) =>
          order.and((order) => [
            order.userID.eq(userId),
            order.mediaUploadStatus.eq(status),
          ]),
        ),
      ),
    );

    const uniqueOrders = [
      ...new Map(
        results.flat().map((order) => [order.id, order]),
      ).values(),
    ];

    for (const order of uniqueOrders) {
      // These fields must contain usable browser-accessible references.
      const photos =
        order.senderPreTransferLocalPhotos?.map((uri) => ({ uri })) || [];

      const video = order.senderPreTransferLocalVideo
        ? { uri: order.senderPreTransferLocalVideo }
        : null;

      if (!photos.length && !video) {
        // Do not falsely mark the order complete merely because a local
        // reference is missing. Check whether uploaded references exist.
        if (
          order.senderPreTransferPhotos?.length ||
          order.senderPreTransferVideo
        ) {
          const latestOrder = await DataStore.query(Order, order.id);

          if (latestOrder) {
            await DataStore.save(
              Order.copyOf(latestOrder, (updated) => {
                updated.mediaUploadStatus = MediaUploadStatus.COMPLETE;
              }),
            );
          }
        } else {
          console.warn(
            "Sender evidence needs to be selected again; no retryable files exist:",
            order.id,
          );
        }

        continue;
      }

      // uploadEvidence returns true on success and false on failure.
      await uploadEvidence(order, photos, video);
    }

    console.log("Sender evidence recovery finished.");
  } catch (error) {
    console.error("Sender evidence recovery failed:", error);
  } finally {
    isRecovering = false;
  }
};
