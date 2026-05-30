// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'React Three Lite',
  tagline: 'A React component library of Three.js.',
  favicon: 'images/logo.png',

  url: 'https://your-docusaurus-site.example.com',
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
        },
        pages: {},
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],
  staticDirectories: ['static'],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'images/logo.png',
      navbar: {
        title: 'React Three Lite',
        logo: {
          alt: 'React Three Lite Logo',
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
