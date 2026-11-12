---
title: 互动水池
---

## 类型

组件

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'
import WaterPool from '@site/src/components/effects/WaterPool'
import WaterPoolIrregular from '@site/src/components/effects/WaterPoolIrregular'

## 默认用法

下面的每个示例都可以用 **WebGPU**（默认）或 **WebGL** 渲染器查看 —— 切换标签页进行对比。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <WaterPool />

    ```tsx
    import { useCallback, useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { GLTFLoader, Scene, SkyDome, WaterPool, globalParameterBus } from 'react-three-lite'
    import type { SceneComponents, WaterPoolOutline } from 'react-three-lite'

    // 池深随水面一起缩放，因此水面始终位于 0.7 个单位的深度上。
    const WATER_SCALE = 0.7

    // 模型尺寸为 0.86 x 0.74 x 1.64，缸底位于 y = 0，缸沿位于 y = 0.53，
    // 内开口为 0.66 x 1.44。这两个缩放把开口变成 1.05 x 1.25 的池子，
    // 刚好落在相机下方，高度让缸沿高出水面 9 cm。
    const TUB_SCALE: [number, number, number] = [1.59, 1.15, 0.868]
    const TUB_Y = 0.09 - 0.53 * TUB_SCALE[1]

    // 水面沿缸口并向瓷器壁下多塞 2 cm，因此四周都贴住缸壁、不会露出缝隙。
    // 轮廓位于水池自身坐标系中，由 WaterPool 按 WATER_SCALE 缩放。
    const WATER_HALF_X = (0.33 * TUB_SCALE[0] + 0.02) / WATER_SCALE
    const WATER_HALF_Z = (0.72 * TUB_SCALE[2] + 0.02) / WATER_SCALE
    const WATER_OUTLINE: WaterPoolOutline = [
      [-WATER_HALF_X, -WATER_HALF_Z],
      [WATER_HALF_X, -WATER_HALF_Z],
      [WATER_HALF_X, WATER_HALF_Z],
      [-WATER_HALF_X, WATER_HALF_Z]
    ]

    export default function App() {
      const skyRef = useRef<SkyDome | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components

        // 太阳角度高一些折射光更清晰；所有效果共用这个方向。
        globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))

        camera.position.set(1.75, 2.2, 2.0)
        controls.target.set(0, 0, 0)
        camera.lookAt(0, 0, 0)

        // WaterPool 只绘制水面，天空和太阳由 SkyDome 提供。
        // 这里选用的色板与水面着色器反射时追踪的天空一致。
        skyRef.current = new SkyDome({
          horizonColor: 0x94c2f0,
          lowerSkyColor: 0x7fb4ec,
          upperSkyColor: 0x3d7bd5,
          zenithColor: 0x296bc7,
          glowColor: 0xfff1d8,
          sunColor: 0xfff7e6,
          sunIntensity: 2.2,
          sunSize: 5
        })
        scene.add(skyRef.current)
      }

      // 加载组件会把浴缸加进场景，这里只需要调整高度，
      // 让缸沿一圈刚好高出水面。
      const handleTubLoaded = useCallback((tub: THREE.Group) => {
        tub.position.set(0, TUB_Y, 0)
      }, [])

      // 卸载时清理
      useEffect(() => {
        return () => {
          skyRef.current?.dispose()
          skyRef.current = null
        }
      }, [])

      return (
        <Scene
          bgColor="rgb(40, 42, 54)"
          axesHelper={false}
          gridHelper={false}
          style={{ width: '100%', height: '300px' }}
          onCreated={handleCreated}
        >
          <WaterPool shape={WATER_OUTLINE} scale={WATER_SCALE} />
          <GLTFLoader
            modelUrl="/models/water-tub.glb"
            useDraco={false}
            scale={TUB_SCALE}
            onLoaded={handleTubLoaded}
          />
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <WaterPool rendererType="webgl" />

    ```tsx
    import { useCallback, useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { GLTFLoader, Scene, SkyDome, WaterPool, globalParameterBus } from 'react-three-lite'
    import type { SceneComponents, WaterPoolOutline } from 'react-three-lite'

    // 池深随水面一起缩放，因此水面始终位于 0.7 个单位的深度上。
    const WATER_SCALE = 0.7

    // 模型尺寸为 0.86 x 0.74 x 1.64，缸底位于 y = 0，缸沿位于 y = 0.53，
    // 内开口为 0.66 x 1.44。这两个缩放把开口变成 1.05 x 1.25 的池子，
    // 刚好落在相机下方，高度让缸沿高出水面 9 cm。
    const TUB_SCALE: [number, number, number] = [1.59, 1.15, 0.868]
    const TUB_Y = 0.09 - 0.53 * TUB_SCALE[1]

    // 水面沿缸口并向瓷器壁下多塞 2 cm，因此四周都贴住缸壁、不会露出缝隙。
    // 轮廓位于水池自身坐标系中，由 WaterPool 按 WATER_SCALE 缩放。
    const WATER_HALF_X = (0.33 * TUB_SCALE[0] + 0.02) / WATER_SCALE
    const WATER_HALF_Z = (0.72 * TUB_SCALE[2] + 0.02) / WATER_SCALE
    const WATER_OUTLINE: WaterPoolOutline = [
      [-WATER_HALF_X, -WATER_HALF_Z],
      [WATER_HALF_X, -WATER_HALF_Z],
      [WATER_HALF_X, WATER_HALF_Z],
      [-WATER_HALF_X, WATER_HALF_Z]
    ]

    export default function App() {
      const skyRef = useRef<SkyDome | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components
        globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))
        camera.position.set(1.75, 2.2, 2.0)
        controls.target.set(0, 0, 0)
        camera.lookAt(0, 0, 0)

        // WaterPool 只绘制水面，天空和太阳由 SkyDome 提供。
        skyRef.current = new SkyDome({
          horizonColor: 0x94c2f0,
          lowerSkyColor: 0x7fb4ec,
          upperSkyColor: 0x3d7bd5,
          zenithColor: 0x296bc7,
          glowColor: 0xfff1d8,
          sunColor: 0xfff7e6,
          sunIntensity: 2.2,
          sunSize: 5
        })
        scene.add(skyRef.current)
      }

      // 加载组件会把浴缸加进场景，这里只需要调整高度，
      // 让缸沿一圈刚好高出水面。
      const handleTubLoaded = useCallback((tub: THREE.Group) => {
        tub.position.set(0, TUB_Y, 0)
      }, [])

      // 卸载时清理
      useEffect(() => {
        return () => {
          skyRef.current?.dispose()
          skyRef.current = null
        }
      }, [])

      return (
        <Scene
          rendererType="webgl"
          bgColor="rgb(40, 42, 54)"
          axesHelper={false}
          gridHelper={false}
          style={{ width: '100%', height: '300px' }}
          onCreated={handleCreated}
        >
          <WaterPool shape={WATER_OUTLINE} scale={WATER_SCALE} />
          <GLTFLoader
            modelUrl="/models/water-tub.glb"
            useDraco={false}
            scale={TUB_SCALE}
            onLoaded={handleTubLoaded}
          />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

在水池内拖动可以产生涟漪，在水池外拖动可以旋转相机。

示例自己传入了 `shape`：水面沿浴缸开口（一个普通矩形）铺开，而不是默认的不规则立方体轮廓，因此水面四周都贴住缸壁、不会在瓷器边留下缝隙。传入 `shape` 即可替换。

`WaterPool` 只绘制水面。天空和太阳由 `handleCreated` 中创建的 `SkyDome` 提供，它的色板与水面着色器反射时追踪的天空一致，因此肉眼看到的天空和倒影里的天空能够对上。卸载时与场景其他资源一起释放即可。

水面外围的浴缸是一个用 `GLTFLoader` 组件加载的浴缸 GLB。它的尺寸为 0.86 × 0.74 × 1.64 个单位，缸底位于 `y = 0`，缸沿位于 `y = 0.53`，内开口为 0.66 × 1.44，因此示例把它缩放到 1.59 × 1.15 × 0.868（1.05 × 1.25 的池子），并向下移动到缸沿高出水面 9 cm。`WATER_OUTLINE` 就是这个开口并向瓷器壁下多塞 2 cm，因此水面四周都贴住缸壁。该模型只用于显示 —— 着色器仍然只追踪水面之下的池底，因此着色开销不变。

## 自定义形状

通过 `shape` 传入轮廓或任意 `THREE.BufferGeometry` 即可替换默认的不规则立方体。轮廓点是 XZ 平面上的 `[x, z]` 坐标，几何体的顶点会投影到 XZ 平面，两者都会先取凸包。轮廓必须包含原点且位于 -1…1 范围内，涟漪才能覆盖整个水面。传 `shape="box"` 则得到方形水池。

这个示例把水放进下载的浴缸里，而不是方形浴缸。下面的轮廓就是浴缸开口的俯视形状 —— 一个细长的圆角矩形 —— 因此水面四周都贴住内壁，水池本身也按模型缩放并抬升到缸内。

<Tabs groupId="renderer">
  <TabItem value="webgpu" label="WebGPU" default>
    <WaterPoolIrregular />

    ```tsx
    import { useCallback, useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { GLTFLoader, Scene, SkyDome, WaterPool, globalParameterBus } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    // 浴缸尺寸为 1.19 x 0.56，缸沿位于 y = 0.35，缸底位于 y = 0。
    const TUB_SCALE = 1.7
    const TUB_SCALE_VEC: [number, number, number] = [TUB_SCALE, TUB_SCALE, TUB_SCALE]
    // 轮廓按开口半宽 0.536 归一化，因此水池的 scale 就是该半宽的世界尺寸，
    // 水深也与之匹配。
    const WATER_SCALE = 0.536 * TUB_SCALE
    const WATER_Y = 0.33 * TUB_SCALE

    // 浴缸开口的俯视轮廓：一个细长的圆角矩形，跟随内缸沿。
    // 水面使用同一轮廓，因此四周都能贴到缸壁。
    const TUB_OUTLINE: [number, number][] = [
      [-1, 0],
      [-0.987, -0.106],
      [-0.945, -0.207],
      [-0.879, -0.291],
      [-0.795, -0.358],
      [-0.694, -0.399],
      [-0.588, -0.412],
      [0.513, -0.412],
      [0.619, -0.399],
      [0.72, -0.358],
      [0.804, -0.291],
      [0.871, -0.207],
      [0.981, -0.028],
      [0.981, 0.028],
      [0.871, 0.207],
      [0.804, 0.291],
      [0.72, 0.358],
      [0.619, 0.399],
      [0.513, 0.412],
      [-0.588, 0.412],
      [-0.694, 0.399],
      [-0.795, 0.358],
      [-0.879, 0.291],
      [-0.945, 0.207],
      [-0.987, 0.106]
    ]

    export default function App() {
      const skyRef = useRef<SkyDome | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components
        globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))
        camera.position.set(1.7, 1.35, 1.9)
        controls.target.set(0, 0.3, 0)
        camera.lookAt(0, 0.3, 0)

        skyRef.current = new SkyDome({
          horizonColor: 0x94c2f0,
          lowerSkyColor: 0x7fb4ec,
          upperSkyColor: 0x3d7bd5,
          zenithColor: 0x296bc7,
          glowColor: 0xfff1d8,
          sunColor: 0xfff7e6,
          sunIntensity: 2.2,
          sunSize: 5
        })
        scene.add(skyRef.current)
      }

      // 模型的坐标原点在角落，因此整体平移回水面正中。
      const handleTubLoaded = useCallback((tub: THREE.Group) => {
        tub.position.set(-0.595 * TUB_SCALE, 0, 0.28 * TUB_SCALE)
      }, [])

      // 卸载时清理
      useEffect(() => {
        return () => {
          skyRef.current?.dispose()
          skyRef.current = null
        }
      }, [])

      return (
        <Scene
          bgColor="rgb(40, 42, 54)"
          axesHelper={false}
          gridHelper={false}
          style={{ width: '100%', height: '300px' }}
          onCreated={handleCreated}
        >
          <WaterPool shape={TUB_OUTLINE} scale={WATER_SCALE} position={[0, WATER_Y, 0]} />
          <GLTFLoader
            modelUrl="/models/bathtub.glb"
            useDraco={false}
            scale={TUB_SCALE_VEC}
            onLoaded={handleTubLoaded}
          />
        </Scene>
      )
    }
    ```
  </TabItem>
  <TabItem value="webgl" label="WebGL">
    <WaterPoolIrregular rendererType="webgl" />

    ```tsx
    import { useCallback, useEffect, useRef } from 'react'
    import * as THREE from 'three'
    import { GLTFLoader, Scene, SkyDome, WaterPool, globalParameterBus } from 'react-three-lite'
    import type { SceneComponents } from 'react-three-lite'

    // 浴缸尺寸为 1.19 x 0.56，缸沿位于 y = 0.35，缸底位于 y = 0。
    const TUB_SCALE = 1.7
    const TUB_SCALE_VEC: [number, number, number] = [TUB_SCALE, TUB_SCALE, TUB_SCALE]
    // 轮廓按缸口半宽（0.536）归一化，因此水池缩放就是缸口的半宽，水深也随之一致。
    const WATER_SCALE = 0.536 * TUB_SCALE
    const WATER_Y = 0.33 * TUB_SCALE

    // 浴缸开口的俯视轮廓：沿内壁的细长圆角矩形。
    // 水面使用同一轮廓，因此四周都能贴到缸壁。
    const TUB_OUTLINE: [number, number][] = [
      [-1, 0],
      [-0.987, -0.106],
      [-0.945, -0.207],
      [-0.879, -0.291],
      [-0.795, -0.358],
      [-0.694, -0.399],
      [-0.588, -0.412],
      [0.513, -0.412],
      [0.619, -0.399],
      [0.72, -0.358],
      [0.804, -0.291],
      [0.871, -0.207],
      [0.981, -0.028],
      [0.981, 0.028],
      [0.871, 0.207],
      [0.804, 0.291],
      [0.72, 0.358],
      [0.619, 0.399],
      [0.513, 0.412],
      [-0.588, 0.412],
      [-0.694, 0.399],
      [-0.795, 0.358],
      [-0.879, 0.291],
      [-0.945, 0.207],
      [-0.987, 0.106]
    ]

    export default function App() {
      const skyRef = useRef<SkyDome | null>(null)

      const handleCreated = (scene: THREE.Scene, components: SceneComponents) => {
        const { camera, controls } = components
        globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))
        camera.position.set(1.7, 1.35, 1.9)
        controls.target.set(0, 0.3, 0)
        camera.lookAt(0, 0.3, 0)

        skyRef.current = new SkyDome({
          horizonColor: 0x94c2f0,
          lowerSkyColor: 0x7fb4ec,
          upperSkyColor: 0x3d7bd5,
          zenithColor: 0x296bc7,
          glowColor: 0xfff1d8,
          sunColor: 0xfff7e6,
          sunIntensity: 2.2,
          sunSize: 5
        })
        scene.add(skyRef.current)
      }

      // 模型的坐标原点在角上，因此平移回水面中心。
      const handleTubLoaded = useCallback((tub: THREE.Group) => {
        tub.position.set(-0.595 * TUB_SCALE, 0, 0.28 * TUB_SCALE)
      }, [])

      // 卸载时清理
      useEffect(() => {
        return () => {
          skyRef.current?.dispose()
          skyRef.current = null
        }
      }, [])

      return (
        <Scene
          rendererType="webgl"
          bgColor="rgb(40, 42, 54)"
          axesHelper={false}
          gridHelper={false}
          style={{ width: '100%', height: '300px' }}
          onCreated={handleCreated}
        >
          <WaterPool
            shape={TUB_OUTLINE}
            scale={WATER_SCALE}
            position={[0, WATER_Y, 0]}
          />
          <GLTFLoader
            modelUrl="/models/bathtub.glb"
            useDraco={false}
            scale={TUB_SCALE_VEC}
            onLoaded={handleTubLoaded}
          />
        </Scene>
      )
    }
    ```
  </TabItem>
</Tabs>

浴缸是一个浴缸 GLB（1.19 × 0.56，缸沿位于 `y = 0.35`，缸底位于 `y = 0`），放大 1.7 倍并平移，让水面落在缸体中间。`TUB_OUTLINE` 是内缸沿的俯视轮廓，因此 `shape` 让水面覆盖整个开口；水池被抬升到 `WATER_Y`（刚好低于缸沿），其深度落到缸底以下，由模型挡住。水池本身不再绘制底部：深色池底由水面着色器计算，因此不会在浴缸下方露出来。

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| resolution | number | 128 | 每轴高度场网格数量，限制在 8–512 |
| shape | `'box' \| [number, number][] \| THREE.BufferGeometry` | 不规则立方体轮廓 | 容器轮廓：默认为偏斜的四边形，`'box'` 为方形水池，或 -1…1 范围内的 `[x, z]` 点，或顶点投影到 XZ 平面的几何体（如 `ConvexGeometry`） |
| segments | number | 160 | 沿容器轮廓的细分数 |
| autoRipples | boolean | true | 每 1.8 秒自动产生一个随机涟漪 |
| interactive | boolean | true | 允许拖动水面 |
| position | Vector3 \| [number, number, number] | [0, 0, 0] | 水面的世界坐标中心位置 |
| scale | number | 1 | 水池整体的统一缩放：占地与深度 |

太阳方向通过[全局参数总线](/zh-CN/guide/effects/global-parameters)共享，不再是属性，因此反射、折射光与 `SkyDome` 的太阳都使用同一个方向：

```ts
globalParameterBus.set('sunDirection', new THREE.Vector3(0.55, 0.9, 0.35))
```

水池在自身坐标系中建模：水面中心为原点，轮廓位于 -1…1 范围内，池底在水面下方 1 个单位处。池底只存在于着色器中，水面之下没有任何几何体。`position` 与 `scale` 把整个坐标系放到场景中，因此 `scale` 为 `3` 时水池宽 6 个世界单位、池深 3 个单位。
