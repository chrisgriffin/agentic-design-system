// Vite resolves CSS Modules at build time; this is the type side of that.
declare module "*.module.css" {
  const classes: { readonly [key: string]: string }
  export default classes
}
