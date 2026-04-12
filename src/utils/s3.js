export const getSignedUrl = async (path) => {
  if (!path) return null;

  try {
    // ✅ Normalize path
    const cleanPath = path.startsWith("public/")
      ? path
      : `public/${path}`;

    const result = await getUrl({
      path: cleanPath,
      options: {
        expiresIn: 3600,
      },
    });

    return result.url.toString();
  } catch (err) {
    console.log("S3 URL error:", err, path);
    return null;
  }
};