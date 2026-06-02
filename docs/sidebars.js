// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  guideSidebar: [
    'getting-started',
    'scene',
    'sky-box',
    {
      type: 'category',
      label: 'Model Loader',
      collapsible: true,
      items: ['model-loader-component', 'model-loader-function'],
    },
    'popup',
    'movable-element',
    'animation',
    {
      type: 'category',
      label: 'Mesh',
      collapsible: true,
      items: ['meshes/wave-circle-mesh', 'meshes/flow-line-mesh'],
    },
    {
      type: 'category',
      label: 'Effect',
      collapsible: true,
      items: ['effects/bloom', 'effects/rain'],
    },
  ],
};

export default sidebars;
