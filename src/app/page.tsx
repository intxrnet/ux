import CenterCloud from "./components/center-cloud";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-start min-h-screen">
      <div className="h-[4vh]"></div>
      <CenterCloud
        items={[
          {
            text: "colors",
            description: "find your color palette",
          },
          {
            text: "fonts",
            description: "explore typeface combinations",
          },
          {
            text: "icons",
            description: "explore icon packs combinations",
          },
          {
            text: "svg blobs",
            description: "fluid shapes",
          },
          {
            text: "svg hero patterns",
            description: "repeatable vector designs",
          },
          {
            text: "svg textures",
            description: "static textures and grains",
          },
        ]}
      ></CenterCloud>
    </div>
  );
}
