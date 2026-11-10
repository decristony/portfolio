/*
 * Caminho de um arquivo de public/ respeitando a base do site: "/" na Vercel e
 * "/portfolio/" no GitHub Pages (definida no build, ver vite.config.js).
 */
export const asset = (path) => `${import.meta.env.BASE_URL}${String(path).replace(/^\//, '')}`;
