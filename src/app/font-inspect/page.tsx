"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";

interface Dimensions {
  width: number;
  height: number;
}

export default function FontDimensionExplorer() {
  // This flag makes sure we only render once on the client (avoiding SSR/CSR mismatches)
  const [hasMounted, setHasMounted] = useState<boolean>(false);

  // State for font upload and styling
  const [fontLoaded, setFontLoaded] = useState<boolean>(false);
  const [text, setText] = useState<string>("Hello");
  const [fontSizeValue, setFontSizeValue] = useState<number>(16);
  const [fontSizeUnit, setFontSizeUnit] = useState<string>("px");

  // State for measured dimensions (in pixels)
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 0,
    height: 0,
  });
  // Ref for the text span element we want to measure
  const textRef = useRef<HTMLSpanElement | null>(null);

  // Set hasMounted after first render to ensure client-only measurements are done only on the client.
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Handle the font file upload
  const handleFontFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const fontFace = new FontFace("customFont", `url(${url})`);
      fontFace
        .load()
        .then((loadedFace) => {
          document.fonts.add(loadedFace);
          setFontLoaded(true);
        })
        .catch((err) => console.error("Font loading failed:", err));
    }
  };

  // Measure the text element's dimensions whenever relevant state changes.
  useEffect(() => {
    if (textRef.current) {
      const rect = textRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    }
  }, [text, fontSizeValue, fontSizeUnit, fontLoaded]);

  // Helper function to convert px values to the chosen unit (em/rem based on the root font size)
  const convertDimension = (px: number): number => {
    if (fontSizeUnit === "px") return px;
    if (fontSizeUnit === "em" || fontSizeUnit === "rem") {
      const rootFontSize = parseFloat(
        getComputedStyle(document.documentElement).fontSize
      );
      return px / rootFontSize;
    }
    return px;
  };

  // Until we're on the client, render nothing (this avoids hydration errors)
  if (!hasMounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="relative border border-gray-300 p-6 rounded-lg w-full max-w-lg">
        {/* Upload Font Section */}
        <div className="mb-4">
          <label
            htmlFor="fontUpload"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Upload Font
          </label>
          <input
            id="fontUpload"
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            onChange={handleFontFileChange}
            className="block w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Text Input Section */}
        <div className="mb-4">
          <label
            htmlFor="textInput"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Enter Text
          </label>
          <input
            id="textInput"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="block w-full border border-gray-300 rounded-md p-2"
          />
        </div>

        {/* Font Size Input Section */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Font Size
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={fontSizeValue}
              onChange={(e) => setFontSizeValue(Number(e.target.value))}
              className="w-20 border border-gray-300 rounded-md p-2"
            />
            <select
              value={fontSizeUnit}
              onChange={(e) => setFontSizeUnit(e.target.value)}
              className="border border-gray-300 rounded-md p-2"
            >
              <option value="px">px</option>
              <option value="em">em</option>
              <option value="rem">rem</option>
            </select>
          </div>
        </div>

        {/* Display Measured Dimensions */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700">Text Dimensions:</p>
          <p className="text-sm text-gray-600">
            Width: {dimensions.width.toFixed(2)} px (
            {convertDimension(dimensions.width).toFixed(2)} {fontSizeUnit})
          </p>
          <p className="text-sm text-gray-600">
            Height: {dimensions.height.toFixed(2)} px (
            {convertDimension(dimensions.height).toFixed(2)} {fontSizeUnit})
          </p>
        </div>

        {/* Rendered Text with custom font if loaded */}
        <div
          className="border border-gray-300 rounded-md p-4 text-center"
          style={{
            fontFamily: fontLoaded ? "customFont" : "sans-serif",
            fontSize: `${fontSizeValue}${fontSizeUnit}`,
          }}
        >
          <span ref={textRef}>{text}</span>
        </div>
      </div>
    </div>
  );
}
