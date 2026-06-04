// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'React Three Lite',
  tagline: 'A lightweight React component library for building 3D web experiences with Three.js.',
  favicon: 'images/logo.png',

  url: 'https://r3l.sunquakes.com',
  baseUrl: '/',
  trailingSlash: false,

  organizationName: 'sunquakes',
  projectName: 'react-three-lite',

  onBrokenLinks: 'throw',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-CN'],
    path: 'i18n',
    localeConfigs: {
      en: {
        label: 'English',
        direction: 'ltr',
      },
      'zh-CN': {
        label: '简体中文',
        direction: 'ltr',
      },
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: 'guide',
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/sunquakes/react-three-lite/tree/main/docs/',
          exclude: ['node_modules/**', '.docusaurus/**'],
          routeBasePath: 'guide',
          includeCurrentVersion: true,
          showLastUpdateTime: true,
        },
        pages: {},
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly',
          priority: 0.5,
          ignorePatterns: ['/tags/**'],
          filename: 'sitemap.xml',
        },
      }),
    ],
  ],
  staticDirectories: ['static'],

  headTags: [
    {
      tagName: 'meta',
      attributes: {
        name: 'description',
        content: 'React Three Lite is a lightweight React component library built on Three.js for seamless 3D web experiences. Includes particle effects, model loaders, and more.',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'keywords',
        content: 'React, Three.js, 3D, WebGL, component library, particle effects, rain, snow, bloom, GLTF, FBX, OBJ, webgl renderer',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'author',
        content: 'Shing Rui',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:type',
        content: 'website',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:url',
        content: 'https://r3l.sunquakes.com',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:title',
        content: 'React Three Lite - Lightweight React 3D Component Library',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:description',
        content: 'A lightweight React component library built on Three.js for seamless 3D web experiences.',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        property: 'og:image',
        content: 'https://r3l.sunquakes.com/images/logo.png',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:title',
        content: 'React Three Lite - Lightweight React 3D Component Library',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:description',
        content: 'A lightweight React component library built on Three.js for seamless 3D web experiences.',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'twitter:image',
        content: 'https://r3l.sunquakes.com/images/logo.png',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'canonical',
        href: 'https://r3l.sunquakes.com',
      },
    },
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'images/logo.png',
      metadata: [
        { name: 'keywords', content: 'React, Three.js, 3D, WebGL, component library, particle effects, rain, snow, bloom, GLTF, FBX, OBJ' },
      ],
      navbar: {
        title: 'React Three Lite',
        logo: {
          alt: 'React Three Lite Logo - Lightweight React 3D Component Library',
          src: 'images/logo.png',
          href: '/',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'guideSidebar',
            position: 'left',
            label: 'Guide',
          },
          {
            type: 'localeDropdown',
            position: 'right',
          },
          {
            href: 'https://github.com/sunquakes/react-three-lite',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        copyright: `Apache-2.0 license | Copyright © ${new Date().getFullYear()} Shing Rui`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
