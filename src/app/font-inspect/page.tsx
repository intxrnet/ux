"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";

interface Dimensions {
  width: number;
  height: number;
}

interface CharStat {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
}

interface CharStats {
  all: CharStat;
  letters: CharStat;
  numbers: CharStat;
  symbols: CharStat;
}

export default function FontDimensionExplorer() {
  // Avoid hydration mismatches by ensuring client-only code runs after mount.
  const [hasMounted, setHasMounted] = useState<boolean>(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // State for font upload and styling.
  const [fontLoaded, setFontLoaded] = useState<boolean>(false);
  const [text, setText] = useState<string>("Hello");
  const [fontSizeValue, setFontSizeValue] = useState<number>(16);
  const [fontSizeUnit, setFontSizeUnit] = useState<string>("px");
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 0,
    height: 0,
  });
  const [charStats, setCharStats] = useState<CharStats | null>(null);

  // A ref for measuring the rendered text.
  const textRef = useRef<HTMLSpanElement | null>(null);

  // Handle font upload using the FontFace API.
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

  // Measure the dimensions of the rendered text.
  useEffect(() => {
    if (textRef.current) {
      const rect = textRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    }
  }, [text, fontSizeValue, fontSizeUnit, fontLoaded]);

  // Helper: convert a pixel value to the selected unit.
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

  // Compute character stats for various categories (all, letters, numbers, symbols)
  useEffect(() => {
    if (!hasMounted) return;

    // Define the style to be applied during measurements.
    const textStyle = {
      fontFamily: fontLoaded ? "customFont" : "sans-serif",
      fontSize: `${fontSizeValue}${fontSizeUnit}`,
    };

    // Helper: measure one character using a hidden element.
    const measureCharacter = (
      char: string
    ): { width: number; height: number } => {
      const span = document.createElement("span");
      span.textContent = char;
      span.style.fontFamily = textStyle.fontFamily;
      span.style.fontSize = textStyle.fontSize;
      span.style.position = "absolute";
      span.style.visibility = "hidden";
      span.style.whiteSpace = "nowrap";
      document.body.appendChild(span);
      const rect = span.getBoundingClientRect();
      document.body.removeChild(span);
      return { width: rect.width, height: rect.height };
    };

    // Define our character sets.
    const letters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split("");
    const numbers = "0123456789".split("");
    const symbols = "!@#$%^&*()-_=+[]{};:'\",.<>/?\\|`~".split("");
    // All unique characters.
    const allChars = Array.from(new Set([...letters, ...numbers, ...symbols]));

    // Helper: compute stats (min/max width/height) for an array of characters.
    const computeStatsForCategory = (chars: string[]): CharStat => {
      let minWidth = Infinity,
        maxWidth = -Infinity,
        minHeight = Infinity,
        maxHeight = -Infinity;
      chars.forEach((char) => {
        const { width, height } = measureCharacter(char);
        if (width < minWidth) minWidth = width;
        if (width > maxWidth) maxWidth = width;
        if (height < minHeight) minHeight = height;
        if (height > maxHeight) maxHeight = height;
      });
      // Fallback if the category is empty.
      if (chars.length === 0) {
        minWidth = 0;
        maxWidth = 0;
        minHeight = 0;
        maxHeight = 0;
      }
      return { minWidth, maxWidth, minHeight, maxHeight };
    };

    const stats: CharStats = {
      all: computeStatsForCategory(allChars),
      letters: computeStatsForCategory(letters),
      numbers: computeStatsForCategory(numbers),
      symbols: computeStatsForCategory(symbols),
    };

    setCharStats(stats);
  }, [hasMounted, fontLoaded, fontSizeValue, fontSizeUnit]);

  // Until we're on the client, render nothing (this avoids hydration errors)
  if (!hasMounted) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 space-y-8">
      {/* Island 1: Upload Controls */}
      <div className="relative border border-gray-300 p-6 rounded-lg w-full max-w-lg">
        <input
          id="fontUpload"
          type="file"
          accept=".ttf,.otf,.woff,.woff2"
          onChange={handleFontFileChange}
          className="block w-full border border-gray-300 rounded-md p-2"
        />
      </div>

      {/* Island 2: Text and Font Display */}
      <div className="relative border border-gray-300 p-6 rounded-lg w-full max-w-lg">
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
        <div
          className="border border-gray-300 rounded-md p-4 text-center"
          style={{
            fontFamily: fontLoaded ? "customFont" : "sans-serif",
            fontSize: `${fontSizeValue}${fontSizeUnit}`,
          }}
        >
          <span ref={textRef}>{text}</span>
        </div>
        <div className="mt-4 text-center">
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
      </div>

      {/* Island 3: Character Stats */}
      <div className="relative border border-gray-300 p-6 rounded-lg w-full max-w-lg">
        {charStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(charStats).map(([category, stats]) => (
              <div
                key={category}
                className="p-4 border border-gray-200 rounded"
              >
                <h3 className="text-sm font-semibold capitalize mb-2">
                  {category}
                </h3>
                <p className="text-xs text-gray-600">
                  Min Width: {stats.minWidth.toFixed(2)} px (
                  {convertDimension(stats.minWidth).toFixed(2)} {fontSizeUnit})
                </p>
                <p className="text-xs text-gray-600">
                  Max Width: {stats.maxWidth.toFixed(2)} px (
                  {convertDimension(stats.maxWidth).toFixed(2)} {fontSizeUnit})
                </p>
                <p className="text-xs text-gray-600">
                  Min Height: {stats.minHeight.toFixed(2)} px (
                  {convertDimension(stats.minHeight).toFixed(2)} {fontSizeUnit})
                </p>
                <p className="text-xs text-gray-600">
                  Max Height: {stats.maxHeight.toFixed(2)} px (
                  {convertDimension(stats.maxHeight).toFixed(2)} {fontSizeUnit})
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">Calculating stats...</p>
        )}
      </div>
    </div>
  );
}
