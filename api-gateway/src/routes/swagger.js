import { Router } from 'express';
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

// Serve openapi.json directly
const serveJson = (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(openapiSpec);
};

// Standalone Swagger UI HTML Generator
function renderSwaggerHtml(spec) {
  const specJson = JSON.stringify(spec).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSEDU Students' Club API Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
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
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js" charset="UTF-8"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
  <script>
    window.onload = function() {
      const spec = ${specJson};
      window.ui = SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true
      });
    };
  </script>
</body>
</html>`;
}

const serveDocsHtml = (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(renderSwaggerHtml(openapiSpec));
};

// Express middleware handling docs, swagger & openapi JSON requests
router.use((req, res, next) => {
  const p = req.path.toLowerCase();
  if (p.includes('docs') || p.includes('swagger') || p.includes('openapi')) {
    if (p.endsWith('.json')) {
      return serveJson(req, res);
    }
    return serveDocsHtml(req, res);
  }
  next();
});

export default router;
