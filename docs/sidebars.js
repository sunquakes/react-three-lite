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
      items: [
        {
          type: 'category',
          label: 'Nature',
          collapsible: true,
          items: [
            'effects/rain',
            'effects/snow',
            'effects/water',
            'effects/water-pool',
            'effects/sandy-beach',
          ],
        },
        {
          type: 'category',
          label: 'Sky & Atmosphere',
          collapsible: true,
          items: ['effects/sky-dome', 'effects/height-fog', 'effects/nebula-galaxy'],
        },
        {
          type: 'category',
          label: 'Light',
          collapsible: true,
          items: [
            'effects/bloom',
            'effects/sweep-light',
            'effects/light-gradient',
            'effects/light-pillar',
            'effects/radar-sweep',
            'effects/signal-wave',
          ],
        },
        {
          type: 'category',
          label: 'Particles & Sprites',
          collapsible: true,
          items: ['effects/fireworks', 'effects/text-fireworks', 'effects/glow-sprite'],
        },
      ],
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
