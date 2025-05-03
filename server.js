const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');

const app = express();
const PORT = 3000;
const JAVA_BASE_URL = 'http://127.0.0.1:8080';
const JAVA_API_PREFIX = '/rest-api-module/rest/api';

// Configuração do CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware de log aprimorado
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', proxy: 'running', timestamp: new Date() });
});

// Proxy dinâmico para todas as outras rotas
app.use(async (req, res, next) => {
    const requestedPath = req.originalUrl;
    const fullBackendUrl = `${JAVA_BASE_URL}${JAVA_API_PREFIX}${requestedPath}`;

    console.log(`🔍 Verificando: ${fullBackendUrl}`);

    try {
        // Verifica se a rota existe
        const check = await axios.head(fullBackendUrl, {
            validateStatus: (status) => status < 500 // Considera 404 como válido para verificação
        });

        if (check.status < 400) {
            console.log(`✅ Rota válida: ${requestedPath} → ${fullBackendUrl}`);

            // Configuração do proxy para esta requisição específica
            const proxy = createProxyMiddleware({
                target: JAVA_BASE_URL,
                changeOrigin: true,
                pathRewrite: {
                    [`^${requestedPath}`]: `${JAVA_API_PREFIX}${requestedPath}`
                },
                logLevel: 'debug'
            });

            return proxy(req, res, next);
        } else {
            console.log(`❌ Rota não encontrada (${check.status}): ${requestedPath}`);
            return res.status(404).json({
                error: 'Route not found',
                requestedPath,
                backendUrl: fullBackendUrl,
                statusCode: check.status
            });
        }
    } catch (error) {
        console.error(`⚠️ Erro ao verificar rota: ${error.message}`);
        return res.status(502).json({
            error: 'Backend connection failed',
            message: error.message,
            requestedPath
        });
    }
});

app.listen(PORT, () => {
    console.log(`\n🚀 Proxy rodando em http://localhost:${PORT}`);
    console.log(`🔗 Backend: ${JAVA_BASE_URL}${JAVA_API_PREFIX}`);
});