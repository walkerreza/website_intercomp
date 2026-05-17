import { useEffect, useMemo, useState } from "react";

let mermaidLoadPromise = null;

function loadMermaid() {
  if (window.mermaid) return Promise.resolve(window.mermaid);

  if (!mermaidLoadPromise) {
    mermaidLoadPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector("script[data-questify-mermaid]");
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(window.mermaid));
        existingScript.addEventListener("error", reject);
        return;
      }

      const script = document.createElement("script");
      script.dataset.questifyMermaid = "true";
      script.src = "https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js";
      script.async = true;
      script.onload = () => resolve(window.mermaid);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  return mermaidLoadPromise;
}

function normalizeMermaidChart(chart = "") {
  return chart
    .trim()
    .replace(/^\s*lowchart\b/i, "flowchart");
}

export function MermaidMessage({ chart }) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const normalizedChart = useMemo(() => normalizeMermaidChart(chart), [chart]);
  const chartId = useMemo(
    () => `questify-mermaid-${Math.random().toString(36).slice(2)}`,
    [],
  );

  useEffect(() => {
    let isMounted = true;

    async function renderChart() {
      try {
        setError("");
        const mermaid = await loadMermaid();
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: document.documentElement.dataset.theme === "light" ? "neutral" : "dark",
        });
        await mermaid.parse(normalizedChart, { suppressErrors: false });
        const result = await mermaid.render(chartId, normalizedChart);
        if (isMounted) setSvg(result.svg);
      } catch {
        if (isMounted) {
          setError("Diagram rune tidak bisa dirender.");
          setSvg("");
        }
      }
    }

    renderChart();

    return () => {
      isMounted = false;
    };
  }, [normalizedChart, chartId]);

  if (error) {
    return (
      <pre className="guild-orb-mermaid-fallback">
        <code>{normalizedChart}</code>
      </pre>
    );
  }

  if (!svg) {
    return <div className="guild-orb-mermaid-loading">Menggambar rune...</div>;
  }

  return (
    <div className={`guild-orb-mermaid-viewer ${isExpanded ? "is-expanded" : ""}`}>
      <div className="guild-orb-mermaid-toolbar">
        <span>Rune Diagram</span>
        <div>
          <button onClick={() => setZoom((value) => Math.max(0.55, value - 0.15))} type="button">
            -
          </button>
          <button onClick={() => setZoom(1)} type="button">
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={() => setZoom((value) => Math.min(1.9, value + 0.15))} type="button">
            +
          </button>
          <button onClick={() => setIsExpanded((value) => !value)} type="button">
            {isExpanded ? "Kecilkan" : "Perlebar"}
          </button>
        </div>
      </div>
      <div className="guild-orb-mermaid">
        <div
          className="guild-orb-mermaid-canvas"
          dangerouslySetInnerHTML={{ __html: svg }}
          style={{
            "--guild-orb-diagram-min-width": `${Math.round(760 * zoom)}px`,
            "--guild-orb-diagram-width": `${Math.round(100 * zoom)}%`,
          }}
        />
      </div>
    </div>
  );
}
