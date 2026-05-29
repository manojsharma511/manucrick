import type { HTMLAttributes } from 'react';

interface CuboidProps extends HTMLAttributes<HTMLDivElement> {
  w: number;
  h: number;
  d: number;
  x: number;
  y: number;
  z: number;
  color: string;
  topColor?: string;
  sideColor?: string;
}

function Cuboid({ w, h, d, x, y, z, color, topColor, sideColor, ...props }: CuboidProps) {
  const topFaceColor = topColor || color;
  const sideFaceColor = sideColor || color;

  return (
    <div
      style={{
        position: 'absolute',
        width: `${w}px`,
        height: `${h}px`,
        transformStyle: 'preserve-3d',
        transform: `translate3d(${x}px, ${y}px, ${z}px)`,
      }}
      {...props}
    >
      {/* Front */}
      <div
        style={{
          position: 'absolute',
          width: `${w}px`,
          height: `${h}px`,
          backgroundColor: color,
          transform: `translate3d(0, 0, ${d / 2}px)`,
          border: '1px solid rgba(0, 0, 0, 0.15)',
        }}
      />
      {/* Back */}
      <div
        style={{
          position: 'absolute',
          width: `${w}px`,
          height: `${h}px`,
          backgroundColor: color,
          transform: `rotateY(180deg) translate3d(0, 0, ${d / 2}px)`,
          border: '1px solid rgba(0, 0, 0, 0.15)',
        }}
      />
      {/* Left */}
      <div
        style={{
          position: 'absolute',
          width: `${d}px`,
          height: `${h}px`,
          backgroundColor: sideFaceColor,
          left: `${(w - d) / 2}px`,
          transform: `rotateY(-90deg) translate3d(0, 0, ${w / 2}px)`,
          border: '1px solid rgba(0, 0, 0, 0.15)',
        }}
      />
      {/* Right */}
      <div
        style={{
          position: 'absolute',
          width: `${d}px`,
          height: `${h}px`,
          backgroundColor: sideFaceColor,
          left: `${(w - d) / 2}px`,
          transform: `rotateY(90deg) translate3d(0, 0, ${w / 2}px)`,
          border: '1px solid rgba(0, 0, 0, 0.15)',
        }}
      />
      {/* Top */}
      <div
        style={{
          position: 'absolute',
          width: `${w}px`,
          height: `${d}px`,
          backgroundColor: topFaceColor,
          top: `${(h - d) / 2}px`,
          transform: `rotateX(90deg) translate3d(0, 0, ${h / 2}px)`,
          border: '1px solid rgba(0, 0, 0, 0.15)',
        }}
      />
      {/* Bottom */}
      <div
        style={{
          position: 'absolute',
          width: `${w}px`,
          height: `${d}px`,
          backgroundColor: topFaceColor,
          top: `${(h - d) / 2}px`,
          transform: `rotateX(-90deg) translate3d(0, 0, ${h / 2}px)`,
          border: '1px solid rgba(0, 0, 0, 0.15)',
        }}
      />
    </div>
  );
}

export function ThreeDBat() {
  return (
    <div
      style={{
        position: 'relative',
        width: '320px',
        height: '420px',
        perspective: '1000px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          transformStyle: 'preserve-3d',
          width: '100%',
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          animation: 'batRotateAndBob 7s infinite ease-in-out',
        }}
      >
        {/* Bat Handle (Grip) - Charcoal */}
        <Cuboid w={14} h={130} d={14} x={0} y={-80} z={0} color="#1C1D21" sideColor="#00FF87" />
        
        {/* Handle rubber ring */}
        <Cuboid w={16} h={8} d={16} x={0} y={-45} z={0} color="var(--primary)" />

        {/* Bat Shoulder / Joint */}
        <Cuboid w={26} h={25} d={18} x={0} y={-10} z={0} color="#CD853F" sideColor="#DEB887" />

        {/* Bat Blade - Light Wood */}
        <Cuboid w={34} h={210} d={22} x={0} y={95} z={0} color="#DEB887" sideColor="#CD853F" topColor="#FFE4B5" />
        
        {/* Brand sticker on front/back of blade */}
        <Cuboid w={35} h={60} d={23} x={0} y={35} z={0} color="var(--secondary)" sideColor="#1C1D21" topColor="var(--primary)" />
      </div>
      
      <style>{`
        @keyframes batRotateAndBob {
          0% {
            transform: rotateX(20deg) rotateY(0deg) translateY(-12px);
          }
          50% {
            transform: rotateX(-15deg) rotateY(180deg) translateY(12px);
          }
          100% {
            transform: rotateX(20deg) rotateY(360deg) translateY(-12px);
          }
        }
      `}</style>
    </div>
  );
}
