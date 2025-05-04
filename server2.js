const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');

const app = express();
const PORT = 3000;
const JAVA_BASE_URL = 'http://127.0.0.1:8080';
const JAVA_API_PREFIX = '/rest-api-module/rest/api';

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use((req, res, next) => {
    const now = new Date();
    console.log(`[${now.toLocaleString('pt-BR')}] ${req.method} ${JAVA_BASE_URL}${JAVA_API_PREFIX}${req.originalUrl}`);
    next();
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', proxy: 'running', timestamp: new Date() });
});

app.use(async (req, res, next) => {
    const requestedPath = req.originalUrl;
    const fullBackendUrl = `${JAVA_BASE_URL}${JAVA_API_PREFIX}${requestedPath}`;

    const proxy = createProxyMiddleware({
        target: JAVA_BASE_URL,
        changeOrigin: true,
        pathRewrite: {
            [`^${requestedPath}`]: `${JAVA_API_PREFIX}${requestedPath}`
        },
        logLevel: 'debug'
    });

    return proxy(req, res, next);
});

app.listen(PORT, () => {
    console.log(`\nProxy rodando em: http://localhost:${PORT}`);
    console.log(`Redirecionando para: ${JAVA_BASE_URL}${JAVA_API_PREFIX}`);
    console.log('Aguardando solicitações... \n')
});