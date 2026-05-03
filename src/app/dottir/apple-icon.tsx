import { ImageResponse } from 'next/og'

/** Apple touch — samme motiv som Dottir-SVG-en. */
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

const BG = '#3B5BDB'
const W = 512

function circleStyle(cx: number, cy: number, r: number, opacity: number, scale: number) {
  const d = 2 * r * scale
  return {
    position: 'absolute' as const,
    left: (cx - r) * scale,
    top: (cy - r) * scale,
    width: d,
    height: d,
    borderRadius: 9999,
    background: `rgba(255,255,255,${opacity})`,
  }
}

export default function AppleIcon() {
  const s = size.width / W
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: size.width,
          height: size.height,
          background: BG,
          borderRadius: 96 * s,
        }}
      >
        <div style={{ position: 'relative', width: size.width, height: size.height, display: 'flex' }}>
          <div style={circleStyle(200, 256, 28, 0.25, s)} />
          <div style={circleStyle(262, 256, 36, 0.45, s)} />
          <div style={circleStyle(340, 256, 48, 1, s)} />
        </div>
      </div>
    ),
    { ...size },
  )
}
