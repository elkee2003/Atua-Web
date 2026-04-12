import { useJsApiLoader } from "@react-google-maps/api";

export default function GoogleMapsProvider({ children }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_API_KEY ?? "",
    libraries: ["places", "marker"], // include everything you’ll need
  });

  if (loadError) return <p>Google Maps failed to load.</p>;
  if (!isLoaded) return <p>Loading Google Maps...</p>;

  return children;
}