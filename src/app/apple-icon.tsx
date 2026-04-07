import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          background: '#3B5BDB',
          borderRadius: 40,
          padding: 36,
          gap: 14,
        }}
      >
        <div style={{ width: 22, height: 44, background: '#fff', borderRadius: 4 }} />
        <div style={{ width: 22, height: 68, background: '#fff', borderRadius: 4 }} />
        <div style={{ width: 22, height: 92, background: '#fff', borderRadius: 4 }} />
      </div>
    ),
    { ...size },
  )
}
