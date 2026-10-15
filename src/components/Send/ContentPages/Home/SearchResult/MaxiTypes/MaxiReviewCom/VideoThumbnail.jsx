export default function VideoThumbnail({ uri, style, className }) {
  return (
    <video
      src={uri}
      style={style}
      className={className}
      muted
      playsInline
      controls={false}
      preload="metadata"
    />
  );
}
