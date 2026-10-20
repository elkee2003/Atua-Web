
import { MediaUploadStatus, Order } from "../src/models";
import { DataStore } from "aws-amplify/datastore";
import { uploadData } from "aws-amplify/storage";

const createId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  throw new Error("Secure unique ID generation is not supported by this browser.");
};

const getBlob = async (media) => {
  if (media instanceof Blob) return media;

  if (media?.file instanceof Blob) return media.file;

  if (!media?.uri) {
    throw new Error("Evidence is missing its file or URI.");
  }

  const response = await fetch(media.uri);

  if (!response.ok) {
    throw new Error(`Could not read evidence: ${response.status}`);
  }

  return response.blob();
};

const compressPhoto = async (media) => {
  const original = await getBlob(media);
  const bitmap = await createImageBitmap(original);

  try {
    const maxWidth = 1200;
    const scale = Math.min(1, maxWidth / bitmap.width);
    const canvas = document.createElement("canvas");

    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not prepare the evidence photo.");
    }

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    return await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Could not compress the evidence photo."));
        },
        "image/jpeg",
        0.78,
      );
    });
  } finally {
    bitmap.close();
  }
};

const uploadPhoto = async (photo, userId) => {
  const blob = await compressPhoto(photo);
  const path = `public/orders/${userId}/senderPreTransferPhotos/${createId()}.jpg`;

  const result = await uploadData({
    path,
    data: blob,
    options: { contentType: "image/jpeg" },
  }).result;

  if (!result?.path) {
    throw new Error("Photo upload did not return a storage path.");
  }

  return result.path;
};

const uploadVideo = async (video, userId) => {
  if (!video) return null;

  const blob = await getBlob(video);
  const contentType = blob.type || "video/mp4";
  const extension = contentType.includes("webm") ? "webm" : "mp4";

  const path = `public/orders/${userId}/senderPreTransferVideo/${createId()}.${extension}`;

  const result = await uploadData({
    path,
    data: blob,
    options: { contentType },
  }).result;

  if (!result?.path) {
    throw new Error("Video upload did not return a storage path.");
  }

  return result.path;
};

export const uploadEvidence = async (order, photos = [], video = null) => {
  if (!order?.id || !order?.userID) {
    throw new Error("A valid order with userID is required.");
  }

  const requestedPhotos = Array.isArray(photos) ? photos : [];
  const hasVideo = Boolean(video);

  if (!requestedPhotos.length && !hasVideo) {
    return true;
  }

  try {
    const latestOrder = await DataStore.query(Order, order.id);

    if (!latestOrder) {
      throw new Error("Order could not be found.");
    }

    if (latestOrder.userID !== order.userID) {
      throw new Error("Order owner does not match the upload owner.");
    }

    // Save retry information before starting uploads.
    // Store only serializable references here, not File/Blob objects.
    await DataStore.save(
      Order.copyOf(latestOrder, (updated) => {
        updated.mediaUploadStatus = MediaUploadStatus.UPLOADING;
      }),
    );

    // Fail the entire operation if any requested file fails.
    const uploadedPhotos = await Promise.all(
      requestedPhotos.map((photo) => uploadPhoto(photo, order.userID)),
    );

    const uploadedVideo = hasVideo
      ? await uploadVideo(video, order.userID)
      : null;

    if (uploadedPhotos.length !== requestedPhotos.length) {
      throw new Error("Not all sender photos uploaded successfully.");
    }

    if (hasVideo && !uploadedVideo) {
      throw new Error("Sender video upload did not complete.");
    }

    const currentOrder = await DataStore.query(Order, order.id);

    if (!currentOrder) {
      throw new Error("Order disappeared before upload completion was saved.");
    }

    await DataStore.save(
      Order.copyOf(currentOrder, (updated) => {
        updated.senderPreTransferPhotos = [
          ...(currentOrder.senderPreTransferPhotos || []),
          ...uploadedPhotos,
        ];

        if (uploadedVideo) {
          updated.senderPreTransferVideo = uploadedVideo;
        }

        updated.senderPreTransferLocalPhotos = null;
        updated.senderPreTransferLocalVideo = null;
        updated.mediaUploadStatus = MediaUploadStatus.COMPLETE;
      }),
    );

    console.log("Sender evidence upload complete:", order.id);
    return true;
  } catch (error) {
    console.error("Sender evidence upload failed:", order.id, error);

    try {
      const currentOrder = await DataStore.query(Order, order.id);

      if (currentOrder) {
        await DataStore.save(
          Order.copyOf(currentOrder, (updated) => {
            updated.mediaUploadStatus = MediaUploadStatus.FAILED;
          }),
        );
      }
    } catch (saveError) {
      console.error("Could not save failed upload status:", saveError);
    }

    return false;
  }
};
