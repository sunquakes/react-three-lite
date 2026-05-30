import { Light, AmbientLight } from 'three'

export default function (): Light {
  const light = new AmbientLight(0xffffff, 1)
  light.intensity = 5
  return light
}
