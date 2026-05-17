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

export function MermaidMessage({ chart }) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
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
        const result = await mermaid.render(chartId, chart);
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
  }, [chart, chartId]);

  if (error) {
    return (
      <pre className="guild-orb-mermaid-fallback">
        <code>{chart}</code>
      </pre>
    );
  }

  if (!svg) {
    return <div className="guild-orb-mermaid-loading">Menggambar rune...</div>;
  }

  return (
    <div
      className="guild-orb-mermaid"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
