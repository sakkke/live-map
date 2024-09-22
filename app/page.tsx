import { MapPageComponent } from "@/components/map-page";

export default function Home() {
  return (
    <MapPageComponent
      initialLng={-70.9}
      initialLat={42.35}
      initialZoom={9}
    />
  );
}
