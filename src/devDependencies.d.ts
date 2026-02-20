/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-dom" />

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module 'next/dist/build/webpack/config/blocks/css/loaders' {
    export function getClientStyleLoader(options: {
        isDevelopment: boolean;
        assetPrefix: string;
    }): any;
}
