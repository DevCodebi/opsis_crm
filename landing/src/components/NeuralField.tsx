import { useEffect, useRef } from "react";

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  pulse: number;
};

/**
 * Fundo animado estilo rede neural / grafo tech (canvas 2D).
 * Respeita prefers-reduced-motion e reduz densidade no mobile.
 */
export function NeuralField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 640px)").matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let nodes: Node[] = [];
    let raf = 0;
    let running = true;

    const olive = { r: 197, g: 208, b: 168 };
    const linkDist = isMobile ? 110 : 150;
    const count = reduceMotion ? (isMobile ? 18 : 28) : isMobile ? 36 : 58;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (nodes.length === 0) {
        nodes = Array.from({ length: count }, () => spawn());
      } else {
        for (const n of nodes) {
          n.x = Math.min(Math.max(n.x, 0), width);
          n.y = Math.min(Math.max(n.y, 0), height);
        }
      }
    };

    const spawn = (): Node => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * (reduceMotion ? 0.08 : 0.28),
      vy: (Math.random() - 0.5) * (reduceMotion ? 0.08 : 0.28),
      r: 1.2 + Math.random() * 1.8,
      pulse: Math.random() * Math.PI * 2,
    });

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > linkDist) continue;
          const alpha = (1 - dist / linkDist) * 0.22;
          ctx.strokeStyle = `rgba(${olive.r},${olive.g},${olive.b},${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        ctx.fillStyle = `rgba(${olive.r},${olive.g},${olive.b},0.55)`;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        n.pulse += 0.02;
        if (n.x < -20 || n.x > width + 20) n.vx *= -1;
        if (n.y < -20 || n.y > height + 20) n.vy *= -1;
      }

      // conexões + “sinapses” ocasionais
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > linkDist) continue;
          const alpha = (1 - dist / linkDist) * 0.28;
          ctx.strokeStyle = `rgba(${olive.r},${olive.g},${olive.b},${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();

          // pulso viajando na aresta
          if (!reduceMotion && dist < linkDist * 0.55 && (i + j) % 7 === 0) {
            const t = (Math.sin(a.pulse + j) + 1) / 2;
            const px = a.x + (b.x - a.x) * t;
            const py = a.y + (b.y - a.y) * t;
            ctx.fillStyle = `rgba(${olive.r},${olive.g},${olive.b},${0.35 + t * 0.35})`;
            ctx.beginPath();
            ctx.arc(px, py, 1.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        const glow = 0.45 + Math.sin(a.pulse) * 0.25;
        ctx.fillStyle = `rgba(${olive.r},${olive.g},${olive.b},${glow})`;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);

    if (reduceMotion) {
      drawStatic();
    } else {
      raf = requestAnimationFrame(tick);
    }

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!reduceMotion) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="neural-field" aria-hidden="true" />;
}
