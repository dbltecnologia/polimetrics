
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false, // Desativa dupla inicialização do React 18 (Causa erros no Leaflet 'is already initialized')
    typescript: {
        ignoreBuildErrors: true,
    },
    // A configuração `experimental.allowedDevOrigins` foi removida.
    // Ela causava um erro durante o build de produção e só era necessária
    // para o ambiente de desenvolvimento específico do Firebase Studio.
    images: {
        // Evita passar pelo otimizador (_next/image) e serve direto do diretório public,
        // corrigindo o erro "The requested resource isn't a valid image" em dev.
        unoptimized: true,
    },
};

module.exports = nextConfig;
