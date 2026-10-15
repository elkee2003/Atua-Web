
import { DataStore } from "aws-amplify/datastore";
import { uploadData } from "aws-amplify/storage";
import { MediaUploadStatus, Order } from "../src/models";

// Generate a unique filename using the browser's Crypto API.
const generateUUID = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  throw new Error("crypto.randomUUID() is not supported in this browser.");
};

// Resize and compress an image using browser Canvas APIs.
const compressImage = (file, maxWidth = 900, quality = 0.7) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      try {
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement("canvas");

        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error("Could not create canvas context.");
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(objectUrl);

            if (!blob) {
              reject(new Error("Image compression failed."));
              return;
            }

            resolve(blob);
          },
          "image/jpeg",
          quality,
        );
      } catch (error) {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load image for compression."));
    };

    image.src = objectUrl;
  });

// Upload sender photos to S3.
export const uploadSenderPhotos = async (photos, userId) => {
  if (!photos?.length) return [];

  const uploaded = [];

  for (const photo of photos) {
    try {
      // Supports a browser File, Blob, or an object containing a File/Blob.
      const file = photo instanceof Blob ? photo : photo?.file;

      if (!file) {
        throw new Error(
          "Invalid photo. Expected a File, Blob, or { file: File } object.",
        );
      }

      const compressedBlob = await compressImage(file, 900, 0.7);

      const key = `public/orders/${userId}/senderPreTransferPhotos/${generateUUID()}.jpg`;

      const result = await uploadData({
        path: key,
        data: compressedBlob,
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

// Upload sender video to S3.
export const uploadSenderVideo = async (video, userId) => {
  if (!video) return null;

  try {
    // Accept a File, Blob, or an object containing a File/Blob.
    const file = video instanceof Blob ? video : video?.file;

    if (!file) {
      throw new Error(
        "Invalid video. Expected a File, Blob, or { file: File } object.",
      );
    }

    const key = `public/orders/${userId}/senderPreTransferVideo/${generateUUID()}.mp4`;

    const result = await uploadData({
      path: key,
      data: file,
      options: {
        contentType: "video/mp4",
      },
    }).result;

    return result.path;
  } catch (error) {
    console.error("Video upload failed:", error);
    return null;
  }
};

// Upload evidence and update the order's upload status.
export const uploadEvidence = async (order, photos, video) => {
  try {
    await DataStore.save(
      Order.copyOf(order, (updated) => {
        updated.mediaUploadStatus = MediaUploadStatus.UPLOADING;
      }),
    );

    const [uploadedPhotos, uploadedVideo] = await Promise.all([
      uploadSenderPhotos(photos, order.userID),
      uploadSenderVideo(video, order.userID),
    ]);

    await DataStore.save(
      Order.copyOf(order, (updated) => {
        updated.senderPreTransferPhotos = uploadedPhotos;
        updated.senderPreTransferVideo = uploadedVideo;

        // Clear local evidence references after the upload attempt.
        updated.senderPreTransferLocalPhotos = null;
        updated.senderPreTransferLocalVideo = null;

        updated.mediaUploadStatus = MediaUploadStatus.COMPLETE;
      }),
    );

    console.log("Evidence upload complete");
  } catch (error) {
    console.error("Evidence upload error:", error);

    try {
      await DataStore.save(
        Order.copyOf(order, (updated) => {
          updated.mediaUploadStatus = MediaUploadStatus.FAILED;
        }),
      );
    } catch (statusError) {
      console.error("Failed to update evidence upload status:", statusError);
    }
  }
};
