---
title: Getting Started
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Introduce

This project leverages `React` and `Three.js` to create a robust toolkit for building interactive 3D applications. It provides components and utilities for initializing and managing 3D scenes, loading models with caching support, adding interactive popups, and setting up realistic backgrounds with skyboxes. The global registration of components and export of utility classes ensure seamless integration and ease of use across different parts of the application.

## Install `Three.js`

<Tabs>
  <TabItem value="pnpm" label="pnpm">
    ```bash
    pnpm i three
    ```
  </TabItem>
  <TabItem value="yarn" label="yarn">
    ```bash
    yarn add three
    ```
  </TabItem>
  <TabItem value="npm" label="npm">
    ```bash
    npm install three
    ```
  </TabItem>
</Tabs>

## Getting Started

- Install `react-three-lite` via `pnpm` or `yarn` or `npm`

<Tabs>
  <TabItem value="pnpm" label="pnpm">
    ```bash
    pnpm i react-three-lite
    ```
  </TabItem>
  <TabItem value="yarn" label="yarn">
    ```bash
    yarn add react-three-lite
    ```
  </TabItem>
  <TabItem value="npm" label="npm">
    ```bash
    npm install react-three-lite
    ```
  </TabItem>
</Tabs>

- Import the desired components from `react-three-lite` in your React application.

```jsx:no-line-numbers
import { Scene, GLTFLoader } from 'react-three-lite'

function App() {
  return (
    <Scene>
      <GLTFLoader modelUrl="/models/model.glb" />
    </Scene>
  )
}
```

- Dive into our in-depth documentation and practical examples to unlock the full potential of `react-three-lite` in your `React` projects.

## Features

### Scene Management

- Automatic Initialization: Automatically initializes a 3D scene upon mounting, setting up essential elements like renderer, camera, lights, axes helper, and controls.
- Event Callbacks: Provides onCreated callback when the scene is initialized, allowing parent components to interact with the scene.
- Customizable Props: Supports optional props for renderer, camera, light, axes helper, and controls, enabling customization based on application needs.
- Children Support: Allows inserting additional content via children, enhancing flexibility.

### SkyBox

- Background Setup: Sets up a skybox as the background of a 3D scene using six images (right, left, top, bottom, front, back).
- Texture Loading: Loads cube textures using Three.js's CubeTextureLoader.
- Seamless Integration: Easily integrates with the scene to provide realistic backgrounds.

### Model Loader

- Model Loading: Loads 3D models into a specified scene.
- Caching Mechanism: Utilizes IndexedDB for caching models, reducing load times on subsequent requests.
- Asynchronous Loading: Fetches models asynchronously using the fetch API and parses them into Three.js objects.
- Callback Function: Provides onLoaded callback to notify when the model has been successfully loaded and added to the scene.

### Popup

- Custom Popups: Creates popups that can contain custom React components.
- Positioning and Movement: Allows popups to be positioned in 3D space and moved smoothly over a specified duration.
- CSS2D Integration: Uses Three.js's CSS2DRenderer to render HTML elements within the 3D scene.
- Lifecycle Management: Manages popup lifecycle through methods like create, moveTo, and update.
