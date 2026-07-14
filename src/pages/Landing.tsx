import { useNavigate } from 'react-router-dom';
import { Network, ArrowRight, ShieldCheck, Zap, GitBranch, Shield } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

// ── Canvas sci-fi network animation ─────────────────────────────────────────
interface Particle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  radius: number; color: string;
}

interface Packet {
  from: number; to: number;
  t: number; speed: number; color: string;
}

const COLORS = ['#3B82F6', '#6366F1', '#8B5CF6', '#60A5FA', '#a5b4fc'];

function initCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  const W = canvas.width  = window.innerWidth;
  const H = canvas.height = window.innerHeight;

  // Create nodes floating in 3D pseudo-space
  const particles: Particle[] = Array.from({ length: 120 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    z: Math.random() * 2 + 0.2,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    vz: (Math.random() - 0.5) * 0.005,
    radius: Math.random() * 2 + 1,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));

  // Edges: pairs within distance threshold
  const edges: [number, number][] = [];
  for (let i = 0; i < particles.length; i++)
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      if (Math.sqrt(dx * dx + dy * dy) < 160) edges.push([i, j]);
    }

  // Travelling packets along edges
  const packets: Packet[] = Array.from({ length: 30 }, () => ({
    from: Math.floor(Math.random() * edges.length),
    to: 0,
    t: Math.random(),
    speed: Math.random() * 0.004 + 0.002,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));

  let raf: number;

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Update particles
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.z += p.vz;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      if (p.z < 0.2 || p.z > 2.2) p.vz *= -1;
    }

    // Draw edges
    for (const [a, b] of edges) {
      const pa = particles[a], pb = particles[b];
      const dx = pa.x - pb.x, dy = pa.y - pb.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 160) continue;
      const alpha = (1 - dist / 160) * 0.25;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.strokeStyle = `rgba(99,102,241,${alpha})`;
      ctx.lineWidth = 0.7;
      ctx.stroke();
    }

    // Draw packets
    for (const pkt of packets) {
      const edge = edges[pkt.from];
      if (!edge) continue;
      const [a, b] = edge;
      const pa = particles[a], pb = particles[b];
      const x = pa.x + (pb.x - pa.x) * pkt.t;
      const y = pa.y + (pb.y - pa.y) * pkt.t;

      // Glow trail
      const grd = ctx.createRadialGradient(x, y, 0, x, y, 6);
      grd.addColorStop(0, pkt.color + 'ff');
      grd.addColorStop(1, pkt.color + '00');
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      pkt.t += pkt.speed;
      if (pkt.t > 1) {
        pkt.t = 0;
        pkt.from = Math.floor(Math.random() * edges.length);
        pkt.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      }
    }

    // Draw nodes
    for (const p of particles) {
      const r = p.radius * p.z * 0.8;
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
      grd.addColorStop(0, p.color + 'cc');
      grd.addColorStop(1, p.color + '00');
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    raf = requestAnimationFrame(draw);
  }

  draw();
  return () => cancelAnimationFrame(raf);
}

// ── Component ────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { users, trustData } = useApp();

  const nodeCount = users.length.toLocaleString();
  const edgeCount = Object.values(trustData).reduce((acc, edges) => acc + Object.keys(edges).length, 0).toLocaleString();

  useEffect(() => {
    if (!canvasRef.current) return;
    const cleanup = initCanvas(canvasRef.current);
    const resize = () => {
      if (canvasRef.current) initCanvas(canvasRef.current);
    };
    window.addEventListener('resize', resize);
    return () => {
      cleanup();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#020617] text-white flex items-center justify-center">
      {/* Sci-Fi Canvas Background */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Radial vignette */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(2,6,23,0) 20%, rgba(2,6,23,0.75) 65%, rgba(2,6,23,1) 100%)',
        }}
      />

      {/* Scanlines overlay for sci-fi feel */}
      <div
        className="absolute inset-0 z-10 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center text-center max-w-5xl px-6">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-blue-400 mb-8"
          style={{
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.3)',
            animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
          }}
        >
          <Zap className="w-4 h-4" />
          <span className="text-sm font-semibold tracking-widest uppercase">
            DAA PBL Project · 2026
          </span>
        </div>

        {/* Title */}
        <h1
          className="text-5xl md:text-7xl font-extrabold tracking-tight mb-4"
          style={{
            background:
              'linear-gradient(135deg, #60a5fa 0%, #a5b4fc 50%, #c084fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 20px rgba(99,102,241,0.5))',
          }}
        >
          Trust-Based Priority Inheritance
        </h1>
        <p className="text-2xl md:text-3xl font-light text-slate-400 mb-6 tracking-wide">
          for Message Routing in Social Networks
        </p>

        {/* Sub text */}
        <p className="text-base md:text-lg text-slate-500 mb-10 max-w-2xl leading-relaxed">
          Nodes. Edges. Trust. — A graph-theoretic approach to dynamic priority
          inheritance using
          <span className="text-blue-400 font-medium">
            {' '}
            Dijkstra's Algorithm
          </span>{' '}
          and
          <span className="text-violet-400 font-medium"> Priority Queues</span>.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          {[
            'BFS / Dijkstra',
            'Weighted Graphs',
            'Priority Queue',
            'Trust Scoring',
            'Real-time Routing',
          ].map((f) => (
            <span
              key={f}
              className="px-3 py-1.5 text-xs font-semibold text-slate-300 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {f}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <button
            onClick={() => navigate('/app')}
            className="group relative px-8 py-4 text-white font-bold rounded-xl text-lg flex items-center gap-3 overflow-hidden transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              boxShadow: '0 0 40px -10px rgba(99,102,241,0.7)',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow =
                '0 0 60px -5px rgba(99,102,241,0.9)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow =
                '0 0 40px -10px rgba(99,102,241,0.7)')
            }
          >
            <Network className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            Initialize Simulation
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            className="px-8 py-4 font-bold rounded-xl text-lg text-slate-300 hover:text-white flex items-center gap-3 transition-colors"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <ShieldCheck className="w-6 h-6" />
            View Architecture
          </button>
        </div>

        {/* Stats Row */}
        <div className="mt-14 grid grid-cols-3 gap-8">
          {[
            { label: 'Graph Nodes', value: nodeCount, icon: Network },
            { label: 'Trust Edges', value: edgeCount, icon: GitBranch },
            { label: 'Algorithms', value: '4', icon: Shield },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <Icon className="w-5 h-5 text-blue-400 mb-1" />
              <span className="text-2xl font-bold text-white">{value}</span>
              <span className="text-xs text-slate-500 uppercase tracking-widest">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
