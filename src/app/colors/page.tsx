"use client";

import { useState, useEffect, useRef } from "react";

interface ColorPoint {
  hue: number;
  saturation: number;
  brightness: number;
}

export default function ColorGradientGenerator() {
  const [hasMounted, setHasMounted] = useState<boolean>(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const [numColors, setNumColors] = useState<number>(3);
  const [colorPoints, setColorPoints] = useState<ColorPoint[]>([]);
  const [globalSaturation, setGlobalSaturation] = useState<number>(0.8);
  const [globalBrightness, setGlobalBrightness] = useState<number>(0.8);
  const [useGlobalValues, setUseGlobalValues] = useState<boolean>(true);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [gradientType, setGradientType] = useState<string>("noise");
  const [activeMarkerIndex, setActiveMarkerIndex] = useState<number | null>(
    null
  );

  const hueBarRef = useRef<HTMLCanvasElement>(null);
  const gradientCanvasRef = useRef<HTMLCanvasElement>(null);
  const barWidth = 600;
  const barHeight = 80;

  useEffect(() => {
    const newColors: ColorPoint[] = [];
    for (let i = 0; i < numColors; i++) {
      const hue = (360 / numColors) * i;

      newColors.push({
        hue,
        saturation: globalSaturation,
        brightness: globalBrightness,
      });
    }
    setColorPoints(newColors);
  }, [numColors]);

  const renderHueBar = () => {
    if (!hueBarRef.current) return;

    const canvas = hueBarRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = barWidth;
    canvas.height = barHeight;

    // Clear the canvas
    ctx.clearRect(0, 0, barWidth, barHeight);

    // Draw background
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, barWidth, barHeight);

    // Draw hue spectrum as a horizontal bar
    const spectrumHeight = 40;
    const spectrumY = 10;

    // Draw border for the spectrum
    ctx.strokeStyle = "#dee2e6";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, spectrumY, barWidth, spectrumHeight);

    // Draw the spectrum gradient
    for (let x = 0; x < barWidth; x++) {
      const hue = (x / barWidth) * 360;
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.fillRect(x, spectrumY, 1, spectrumHeight);
    }

    // Draw color markers (triangles)
    colorPoints.forEach((point, index) => {
      const x = (point.hue / 360) * barWidth;
      const isActive = index === activeMarkerIndex;

      // Draw triangle pointing to the spectrum
      const triangleHeight = 15;
      const triangleWidth = 10;
      const triangleY = spectrumY + spectrumHeight + 2;

      ctx.beginPath();
      ctx.moveTo(x, triangleY); // Top point
      ctx.lineTo(x - triangleWidth / 2, triangleY + triangleHeight); // Bottom left
      ctx.lineTo(x + triangleWidth / 2, triangleY + triangleHeight); // Bottom right
      ctx.closePath();

      // Fill with the color
      const s = useGlobalValues ? globalSaturation : point.saturation;
      const b = useGlobalValues ? globalBrightness : point.brightness;
      ctx.fillStyle = `hsl(${point.hue}, ${s * 100}%, ${b * 100}%)`;
      ctx.fill();

      // Add stroke
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.strokeStyle = isActive ? "#3b82f6" : "rgba(0,0,0,0.3)";
      ctx.stroke();

      // Draw color index
      ctx.fillStyle = b > 0.5 ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)";
      ctx.font = "10px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`${index + 1}`, x, triangleY + triangleHeight - 4);
    });
  };

  useEffect(() => {
    if (!hasMounted) return;
    renderHueBar();
  }, [
    hasMounted,
    colorPoints,
    globalSaturation,
    globalBrightness,
    useGlobalValues,
    activeMarkerIndex,
  ]);

  // Function to distribute hues evenly
  const distributeHuesEvenly = () => {
    const newPoints = [...colorPoints];
    for (let i = 0; i < newPoints.length; i++) {
      newPoints[i] = {
        ...newPoints[i],
        hue: (i * 360) / newPoints.length,
      };
    }
    setColorPoints(newPoints);
  };

  // Update gradient render
  useEffect(() => {
    if (!hasMounted || !gradientCanvasRef.current || colorPoints.length === 0)
      return;

    const canvas = gradientCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;

    const colors = colorPoints.map((point) => ({
      h: point.hue,
      s: useGlobalValues ? globalSaturation : point.saturation,
      v: useGlobalValues ? globalBrightness : point.brightness,
    }));

    // Draw based on gradient type
    switch (gradientType) {
      case "noise":
        renderNoiseGradient(ctx, size, colors);
        break;
      case "linear":
        renderLinearGradient(ctx, size, colors);
        break;
      case "radial":
        renderRadialGradient(ctx, size, colors);
        break;
      case "angular":
        renderAngularGradient(ctx, size, colors);
        break;
      default:
        renderNoiseGradient(ctx, size, colors);
    }
  }, [
    hasMounted,
    colorPoints,
    globalSaturation,
    globalBrightness,
    useGlobalValues,
    gradientType,
  ]);

  // Noise gradient
  const renderNoiseGradient = (
    ctx: CanvasRenderingContext2D,
    size: number,
    colors: { h: number; s: number; v: number }[]
  ) => {
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    const frequency = 0.01;
    const noiseScale = 0.05;

    const noise = (nx: number, ny: number) => {
      return (
        Math.sin(nx * frequency) * Math.cos(ny * frequency) +
        Math.sin((nx + ny) * frequency * 1.5) * 0.5
      );
    };

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const nx = x * noiseScale;
        const ny = y * noiseScale;
        const n1 = noise(nx, ny);
        const n2 = noise(nx * 2, ny * 2) * 0.5;
        const n3 = noise(nx * 4, ny * 4) * 0.25;

        let noiseValue = (n1 + n2 + n3) * 0.35 + 0.5;
        noiseValue = Math.max(0, Math.min(1, noiseValue));

        let r = 0,
          g = 0,
          b = 0;

        if (colors.length === 2) {
          const c1 = hsvToRgb(colors[0].h, colors[0].s, colors[0].v);
          const c2 = hsvToRgb(colors[1].h, colors[1].s, colors[1].v);
          r = c1.r + noiseValue * (c2.r - c1.r);
          g = c1.g + noiseValue * (c2.g - c1.g);
          b = c1.b + noiseValue * (c2.b - c1.b);
        } else {
          const segmentSize = 1 / (colors.length - 1);
          const segment = Math.min(
            Math.floor(noiseValue / segmentSize),
            colors.length - 2
          );
          const localNoise = (noiseValue - segment * segmentSize) / segmentSize;

          const c1 = hsvToRgb(
            colors[segment].h,
            colors[segment].s,
            colors[segment].v
          );
          const c2 = hsvToRgb(
            colors[segment + 1].h,
            colors[segment + 1].s,
            colors[segment + 1].v
          );

          r = c1.r + localNoise * (c2.r - c1.r);
          g = c1.g + localNoise * (c2.g - c1.g);
          b = c1.b + localNoise * (c2.b - c1.b);
        }

        const i = (y * size + x) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  // Linear gradient
  const renderLinearGradient = (
    ctx: CanvasRenderingContext2D,
    size: number,
    colors: { h: number; s: number; v: number }[]
  ) => {
    const gradient = ctx.createLinearGradient(0, 0, size, size);

    colors.forEach((color, index) => {
      const rgb = hsvToRgb(color.h, color.s, color.v);
      const rgbString = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      gradient.addColorStop(index / (colors.length - 1), rgbString);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  };

  // Radial gradient
  const renderRadialGradient = (
    ctx: CanvasRenderingContext2D,
    size: number,
    colors: { h: number; s: number; v: number }[]
  ) => {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;

    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius
    );

    colors.forEach((color, index) => {
      const rgb = hsvToRgb(color.h, color.s, color.v);
      const rgbString = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      gradient.addColorStop(index / (colors.length - 1), rgbString);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  };

  // Angular gradient
  const renderAngularGradient = (
    ctx: CanvasRenderingContext2D,
    size: number,
    colors: { h: number; s: number; v: number }[]
  ) => {
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2;

    // Draw sections for each color
    const angleStep = (2 * Math.PI) / colors.length;

    for (let i = 0; i < colors.length; i++) {
      const startAngle = i * angleStep;
      const endAngle = (i + 1) * angleStep;

      const rgb = hsvToRgb(colors[i].h, colors[i].s, colors[i].v);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
      ctx.fill();
    }
  };

  const hsvToRgb = (h: number, s: number, v: number) => {
    let r = 0,
      g = 0,
      b = 0;

    const i = Math.floor(h / 60) % 6;
    const f = h / 60 - Math.floor(h / 60);
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i) {
      case 0:
        r = v;
        g = t;
        b = p;
        break;
      case 1:
        r = q;
        g = v;
        b = p;
        break;
      case 2:
        r = p;
        g = v;
        b = t;
        break;
      case 3:
        r = p;
        g = q;
        b = v;
        break;
      case 4:
        r = t;
        g = p;
        b = v;
        break;
      case 5:
        r = v;
        g = p;
        b = q;
        break;
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  };

  // Convert RGB to Hex
  const rgbToHex = (r: number, g: number, b: number) => {
    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };

  // Get hex value for a color
  const getHexValue = (point: ColorPoint) => {
    const s = useGlobalValues ? globalSaturation : point.saturation;
    const b = useGlobalValues ? globalBrightness : point.brightness;
    const rgb = hsvToRgb(point.hue, s, b);
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  };

  // Copy hex to clipboard
  const copyHex = (hexValue: string, index: number) => {
    navigator.clipboard.writeText(hexValue);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!hueBarRef.current) return;

    const rect = hueBarRef.current.getBoundingClientRect();
    const canvasX =
      (e.clientX - rect.left) * (hueBarRef.current.width / rect.width);

    // Find the closest marker
    let closestIndex = -1;
    let closestDistance = Number.MAX_VALUE;

    colorPoints.forEach((point, index) => {
      const markerX = (point.hue / 360) * barWidth;
      const distance = Math.abs(canvasX - markerX);

      if (distance < closestDistance && distance < 20) {
        // 20px tolerance
        closestDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex >= 0) {
      setActiveMarkerIndex(closestIndex);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!hueBarRef.current) return;

        const moveRect = hueBarRef.current.getBoundingClientRect();
        const moveCanvasX =
          (moveEvent.clientX - moveRect.left) *
          (hueBarRef.current.width / moveRect.width);

        // Convert to hue (0-360)
        const hue = Math.max(0, Math.min(360, (moveCanvasX / barWidth) * 360));

        // Update the color point
        const newPoints = [...colorPoints];
        newPoints[closestIndex] = {
          ...newPoints[closestIndex],
          hue,
        };

        setColorPoints(newPoints);
      };

      const handleMouseUp = () => {
        setActiveMarkerIndex(null);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
  };

  // Update individual or all colors' saturation/brightness
  const updateColorProperty = (
    index: number,
    property: "saturation" | "brightness",
    value: number
  ) => {
    const newPoints = [...colorPoints];
    newPoints[index] = {
      ...newPoints[index],
      [property]: value,
    };
    setColorPoints(newPoints);
  };

  if (!hasMounted) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 space-y-6 md:space-y-8 max-w-5xl mx-auto">
      {/* Color Count Selection */}
      <div className="relative border border-gray-300 p-4 md:p-6 rounded-lg w-full shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Select Number of Colors</h2>
        <div className="flex flex-wrap gap-2 justify-center">
          {[2, 3, 4, 5, 6, 7, 8].map((num) => (
            <button
              key={num}
              onClick={() => setNumColors(num)}
              className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md ${
                numColors === num
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Gradient Preview - Now at the top */}
      <div className="relative border border-gray-300 p-4 md:p-6 rounded-lg w-full shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Gradient Preview</h3>

        {/* Gradient Style Selector */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {["noise", "linear", "radial", "angular"].map((style) => (
              <button
                key={style}
                onClick={() => setGradientType(style)}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-md capitalize ${
                  gradientType === style
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center items-center">
          <canvas
            ref={gradientCanvasRef}
            width={300}
            height={300}
            className="rounded-lg shadow-md max-w-full h-auto"
          />
        </div>
      </div>

      {/* Color Selection Bar */}
      <div className="relative border border-gray-300 p-4 md:p-6 rounded-lg w-full shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold">Color Selection</h3>
            <button
              onClick={distributeHuesEvenly}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Distribute Evenly
            </button>
          </div>

          <div className="flex justify-center">
            <canvas
              ref={hueBarRef}
              width={barWidth}
              height={barHeight}
              onMouseDown={handleMouseDown}
              className="cursor-pointer max-w-full h-auto"
            />
          </div>

          <div className="text-xs text-gray-500 text-center">
            Drag the triangles to adjust hue values
          </div>

          {useGlobalValues && (
            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Global Saturation
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={globalSaturation}
                  onChange={(e) =>
                    setGlobalSaturation(parseFloat(e.target.value))
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Global Brightness
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={globalBrightness}
                  onChange={(e) =>
                    setGlobalBrightness(parseFloat(e.target.value))
                  }
                  className="w-full"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useGlobalValues"
              checked={useGlobalValues}
              onChange={(e) => setUseGlobalValues(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="useGlobalValues" className="text-sm">
              Use global saturation & brightness for all colors
            </label>
          </div>
        </div>
      </div>

      {/* Color Swatches */}
      <div className="relative border border-gray-300 p-4 md:p-6 rounded-lg w-full shadow-sm">
        <h3 className="text-sm font-semibold mb-4">Selected Colors</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {colorPoints.map((point, index) => {
            const hexValue = getHexValue(point);
            return (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-3 transition-all"
              >
                <div className="flex items-center mb-3">
                  <div
                    className={`w-12 h-12 rounded-md mr-3 cursor-pointer transition-all ${
                      copiedIndex === index ? "ring-2 ring-blue-500" : ""
                    }`}
                    style={{
                      backgroundColor: `hsl(${point.hue}, ${
                        (useGlobalValues
                          ? globalSaturation
                          : point.saturation) * 100
                      }%, ${
                        (useGlobalValues
                          ? globalBrightness
                          : point.brightness) * 100
                      }%)`,
                      border: "1px solid #e5e7eb",
                    }}
                    onClick={() => copyHex(hexValue, index)}
                  ></div>
                  <div>
                    <p className="text-xs">Hue: {Math.round(point.hue)}°</p>
                    <div
                      className={`mt-1 cursor-pointer transition-all ${
                        copiedIndex === index ? "text-blue-500" : ""
                      }`}
                      onClick={() => copyHex(hexValue, index)}
                    >
                      <p className="text-xs font-mono bg-gray-100 px-1 py-0.5 rounded">
                        {hexValue}
                        {copiedIndex === index && (
                          <span className="ml-2 text-xs text-blue-500">✓</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {!useGlobalValues && (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Saturation
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={point.saturation}
                        onChange={(e) =>
                          updateColorProperty(
                            index,
                            "saturation",
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Brightness
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={point.brightness}
                        onChange={(e) =>
                          updateColorProperty(
                            index,
                            "brightness",
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
