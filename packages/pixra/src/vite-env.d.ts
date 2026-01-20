/// <reference types="vite/client" />

// Support for ?bundle imports
declare module '*?bundle' {
  const content: string
  export default content
}
