import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read openapi.json
const openapiPath = path.join(__dirname, '../swagger/openapi.json');
let openapiSpec = {};

try {
  const fileContent = fs.readFileSync(openapiPath, 'utf8');
  openapiSpec = JSON.parse(fileContent);
} catch (err) {
  console.error('Error loading openapi.json:', err);
}

// Serve openapi.json directly for external Swagger viewers / Postman import
const serveJson = (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(openapiSpec);
};

router.get('/openapi.json', serveJson);
router.get('/swagger.json', serveJson);
router.get('/docs/openapi.json', serveJson);
router.get('/api-docs/openapi.json', serveJson);

// Swagger UI custom HTML options & styling
const customOptions = {
  customCss: `
    .swagger-ui .topbar { background-color: #0f172a; padding: 12px 0; }
    .swagger-ui .topbar a span { font-weight: bold; color: #38bdf8; font-size: 1.2rem; }
    .swagger-ui .info .title { color: #1e293b; font-size: 2rem; font-weight: 700; }
    .swagger-ui .scheme-container { background-color: #f8fafc; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .swagger-ui .btn.authorize { background-color: #2563eb; color: #fff; border-color: #2563eb; border-radius: 6px; }
    .swagger-ui .btn.authorize svg { fill: #fff; }
    .swagger-ui .opblock.opblock-post { background: rgba(16, 185, 129, 0.05); border-color: #10b981; }
    .swagger-ui .opblock.opblock-get { background: rgba(59, 130, 246, 0.05); border-color: #3b82f6; }
    .swagger-ui .opblock.opblock-patch { background: rgba(245, 158, 11, 0.05); border-color: #f59e0b; }
    .swagger-ui .opblock.opblock-delete { background: rgba(239, 68, 68, 0.05); border-color: #ef4444; }
  `,
  customSiteTitle: "CSEDU Students' Club API Documentation",
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
    persistAuthorization: true,
  }
};

// Serve Swagger UI express app
router.use('/docs', swaggerUi.serveFiles(openapiSpec, customOptions), swaggerUi.setup(openapiSpec, customOptions));
router.use('/api-docs', swaggerUi.serveFiles(openapiSpec, customOptions), swaggerUi.setup(openapiSpec, customOptions));
router.use('/swagger', swaggerUi.serveFiles(openapiSpec, customOptions), swaggerUi.setup(openapiSpec, customOptions));

export default router;
