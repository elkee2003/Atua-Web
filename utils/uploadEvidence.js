
import { MediaUploadStatus, Order } from "../src/models";
import { DataStore } from "aws-amplify/datastore";
import { uploadData } from "aws-amplify/storage";
import imageCompression from "browser-image-compression";

// ======================================================
// HELPERS
// ======================================================

const generateFileId = () => {
  return crypto.randomUUID();
};

const getBlobFromUri = async (uri) => {
  const response = await fetch(uri);

  if (!response.ok) {
    throw new Error(`Failed to read media: ${response.status}`);
  }

  return response.blob();
};

// ======================================================
// UPLOAD SENDER PHOTOS
// ======================================================

export const uploadSenderPhotos = async (photos, userId) => {
  if (!photos?.length) return [];

  const uploaded = [];

  for (const photo of photos) {
    try {
      // Convert the selected/local image URI to a File.
      const originalBlob = photo.file
        ? photo.file
        : await getBlobFromUri(photo.uri);

      const originalFile = new File(
        [originalBlob],
        photo.name || "sender-evidence.jpg",
        {
          type: originalBlob.type || "image/jpeg",
        },
      );

      // Resize and compress in the browser.
      const compressedFile = await imageCompression(originalFile, {
        maxWidthOrHeight: 900,
        initialQuality: 0.7,
        useWebWorker: true,
        fileType: "image/jpeg",
      });

      const key =
        `public/orders/${userId}/senderPreTransferPhotos/` +
        `${generateFileId()}.jpg`;

      const result = await uploadData({
        path: key,
        data: compressedFile,
        options: {
          contentType: "image/jpeg",
        },
      }).result;

      uploaded.push(result.path);
    } catch (error) {
      console.error("Photo upload failed:", error);
    }
  }

  return uploaded;
};

// ======================================================
// UPLOAD SENDER VIDEO
// ======================================================

export const uploadSenderVideo = async (video, userId) => {
  if (!video?.uri && !video?.file) return null;

  try {
    const blob = video.file
      ? video.file
      : await getBlobFromUri(video.uri);

    // Preserve the video type where possible.
    const contentType = blob.type || "video/mp4";
    const extension = contentType.includes("webm")
      ? "webm"
      : contentType.includes("quicktime")
        ? "mov"
        : "mp4";

    const key =
      `public/orders/${userId}/senderPreTransferVideo/` +
      `${generateFileId()}.${extension}`;

    const result = await uploadData({
      path: key,
      data: blob,
      options: {
        contentType,
      },
    }).result;

    return result.path;
  } catch (error) {
    console.error("Video upload failed:", error);
    return null;
  }
};

// ======================================================
// UPLOAD ALL EVIDENCE
// ======================================================

export const uploadEvidence = async (order, photos, video) => {
  try {
    // Tell the driver that evidence is being uploaded.
    await DataStore.save(
      Order.copyOf(order, (updated) => {
        updated.mediaUploadStatus = MediaUploadStatus.UPLOADING;
      }),
    );

    const [uploadedPhotos, uploadedVideo] = await Promise.all([
      uploadSenderPhotos(photos, order.userID),
      uploadSenderVideo(video, order.userID),
    ]);

    // Save the uploaded S3 paths and clear local references.
    const latestOrder = await DataStore.query(Order, order.id);

    if (!latestOrder) {
      throw new Error("Order not found while saving evidence.");
    }

    await DataStore.save(
      Order.copyOf(latestOrder, (updated) => {
        updated.senderPreTransferPhotos = uploadedPhotos;
        updated.senderPreTransferVideo = uploadedVideo;

        updated.senderPreTransferLocalPhotos = null;
        updated.senderPreTransferLocalVideo = null;

        updated.mediaUploadStatus = MediaUploadStatus.COMPLETE;
      }),
    );

    console.log("Evidence upload complete");
  } catch (error) {
    console.error("Evidence upload error:", error);

    try {
      const latestOrder = await DataStore.query(Order, order.id);

      if (latestOrder) {
        await DataStore.save(
          Order.copyOf(latestOrder, (updated) => {
            updated.mediaUploadStatus = MediaUploadStatus.FAILED;
          }),
        );
      }
    } catch (saveError) {
      console.error("Failed to save evidence upload status:", saveError);
    }
  }
};
