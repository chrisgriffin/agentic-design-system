// Vite resolves CSS imports at build time; this is the type side of that.
// A CSS Module is a default export of class names.
declare module "*.module.css" {
  const classes: { readonly [key: string]: string }
  export default classes
}

// Plain stylesheets are imported for their side effect only, as
// .storybook/preview.ts imports tokens/css/tokens.css.
declare module "*.css" {}
