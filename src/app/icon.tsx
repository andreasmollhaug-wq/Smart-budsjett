import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
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
          borderRadius: 8,
          padding: 6,
          gap: 3,
        }}
      >
        <div style={{ width: 4, height: 8, background: '#fff', borderRadius: 1 }} />
        <div style={{ width: 4, height: 12, background: '#fff', borderRadius: 1 }} />
        <div style={{ width: 4, height: 16, background: '#fff', borderRadius: 1 }} />
      </div>
    ),
    { ...size },
  )
}
