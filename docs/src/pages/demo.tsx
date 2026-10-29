import { useState } from 'react'
import Head from '@docusaurus/Head'
import Link from '@docusaurus/Link'
import { translate } from '@docusaurus/Translate'
import ComplexSceneDemo from '@site/src/components/ComplexSceneDemo'
import type { SceneCaptions } from '@site/src/components/ComplexSceneDemo'

export default function DemoPage() {
  const [rendererType, setRendererType] = useState<'webgpu' | 'webgl'>('webgpu')

  const panelStyle = {
    background: 'rgba(18, 9, 8, 0.62)',
    border: '1px solid rgba(255, 176, 102, 0.28)',
    borderRadius: '12px',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)'
  }

  const buttonStyle = (active: boolean) => ({
    padding: '6px 14px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    color: active ? '#1a0f00' : '#f0c9a6',
    background: active
      ? 'linear-gradient(180deg, #ffb066 0%, #e6641a 100%)'
      : 'rgba(255, 255, 255, 0.06)',
    transition: 'all 0.2s ease'
  })

  const title = translate({
    id: 'demo.page.title',
    message: 'A Martian Adventure',
    description: 'The title of the Mars scene demo page'
  })

  const captions: SceneCaptions = {
    intro: translate({
      id: 'demo.caption.intro',
      message: 'Qiusuo · Mars Dream',
      description: 'Caption shown at the start of the Mars scene demo'
    }),
    survey: translate({
      id: 'demo.caption.survey',
      message: 'Survey stop · Sampling the regolith',
      description: 'Caption shown while the rover halts at a survey stop'
    }),
    driving: translate({
      id: 'demo.caption.driving',
      message: 'SOL 118 · Searching the dune plain',
      description: 'Caption shown while the rover drives across the dunes'
    }),
    parked: translate({
      id: 'demo.caption.parked',
      message: 'Parked at the crater rim',
      description: 'Caption shown once the rover parks at the crater rim'
    }),
    acquiring: translate({
      id: 'demo.caption.acquiring',
      message: 'Acquiring the Deep Space Network downlink',
      description: 'Caption shown while the downlink is being acquired'
    }),
    finding: translate({
      id: 'demo.caption.finding',
      message: 'Something green in the regolith',
      description: 'Caption shown when the fern patch is revealed'
    }),
    downlink: translate({
      id: 'demo.caption.downlink',
      message: "Downlink locked · streaming Qiusuo's data to Earth",
      description: 'Caption shown once the downlink to Earth is locked'
    })
  }

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content={translate({
            id: 'demo.page.description',
            message: 'A complete Martian scene built with React Three Lite',
            description: 'The meta description of the Mars scene demo page'
          })}
        />
      </Head>

      <main style={{ position: 'fixed', inset: 0, overflow: 'hidden', padding: 0, margin: 0 }}>
        <ComplexSceneDemo key={rendererType} rendererType={rendererType} captions={captions} />

        <div
          style={{
            ...panelStyle,
            position: 'absolute',
            top: '24px',
            left: '24px',
            zIndex: 1000,
            padding: '16px 20px',
            maxWidth: '330px',
            pointerEvents: 'auto'
          }}
        >
          <Link
            to="/guide/getting-started"
            style={{
              display: 'inline-block',
              marginBottom: '10px',
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              textDecoration: 'none',
              color: '#ffb066'
            }}
          >
            {translate({
              id: 'demo.page.back',
              message: '← Back to Guide',
              description: 'The link back to the docs from the Mars scene demo page'
            })}
          </Link>
          <h1
            style={{
              margin: 0,
              fontSize: '26px',
              lineHeight: 1.15,
              fontWeight: 800,
              color: '#ffe3c4',
              letterSpacing: '0.01em'
            }}
          >
            {title}
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: '13px', lineHeight: 1.55, color: '#d8b59a' }}>
            {translate({
              id: 'demo.page.blurb',
              message:
                'Qiusuo the rover rolls across the rust-red dunes toward an impact crater, parks at the rim beside the Deep Space Network relay station, and streams its data toward the pale blue Earth in the black sky, while a fern patch opens up in the regolith beside it.',
              description: 'The introduction paragraph of the Mars scene demo page'
            })}
          </p>
        </div>

        <div
          style={{
            ...panelStyle,
            position: 'absolute',
            top: '24px',
            right: '24px',
            zIndex: 1000,
            padding: '8px',
            display: 'flex',
            gap: '6px'
          }}
        >
          <button
            type="button"
            style={buttonStyle(rendererType === 'webgpu')}
            onClick={() => setRendererType('webgpu')}
          >
            WebGPU
          </button>
          <button
            type="button"
            style={buttonStyle(rendererType === 'webgl')}
            onClick={() => setRendererType('webgl')}
          >
            WebGL
          </button>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            padding: '6px 14px',
            fontSize: '12px',
            letterSpacing: '0.04em',
            color: 'rgba(232, 196, 166, 0.85)',
            ...panelStyle
          }}
        >
          {translate({
            id: 'demo.page.orbitHint',
            message: 'Drag to orbit · Scroll to zoom',
            description: 'The camera controls hint on the Mars scene demo page'
          })}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '24px',
            zIndex: 1000,
            fontSize: '11px',
            color: 'rgba(232, 196, 166, 0.7)',
            textAlign: 'right'
          }}
        >
          {translate({
            id: 'demo.page.credits',
            message: '3D models: NASA/JPL-Caltech · fern patch by Poly Haven (CC0)',
            description: 'The asset credits on the Mars scene demo page'
          })}
        </div>
      </main>
    </>
  )
}
