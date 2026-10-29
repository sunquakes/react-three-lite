// @ts-ignore
/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  mainSidebar: [
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
    'callout',
    'movable-element',
    'animation',
    'model-rotator',
    'picking',
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
      items: ['effects/bloom', 'effects/rain', 'effects/snow', 'effects/water', 'effects/height-fog', 'effects/sweep-light', 'effects/light-gradient', 'effects/light-pillar', 'effects/fireworks', 'effects/sky-dome', 'effects/radar-sweep', 'effects/signal-wave', 'effects/glow-sprite'],
    },
    {
      type: 'category',
      label: 'GIS',
      collapsible: true,
      items: [
        'gis/geo-reference',
        'gis/geo-object',
        'gis/geojson-layer',
        'gis/tile-layer',
      ],
    },
  ],
};

export default sidebars;
