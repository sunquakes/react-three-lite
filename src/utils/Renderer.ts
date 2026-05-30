import { WebGLRenderer } from 'three'

export default function (): WebGLRenderer {
  const renderer = new WebGLRenderer({
    antialias: true,
    alpha: true
  })
  return renderer
}
