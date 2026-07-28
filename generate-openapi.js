import fs from 'fs';
import path from 'path';

const collectionPath = path.resolve('CSEDUSC_Postman_Collection.json');
const rawData = fs.readFileSync(collectionPath, 'utf8');
const collection = JSON.parse(rawData);

const openapi = {
  openapi: '3.0.3',
  info: {
    title: "CSEDU Students' Club Management System API",
    version: '1.0.0',
    description: "Comprehensive REST API documentation for CSEDU Students' Club Management System. Powered by Microservices & API Gateway.\n\n" +
      "**Base URLs:**\n" +
      "- Production Base URL: `https://csedusc-formula1.farefin.com`\n" +
      "- Local Gateway: `http://localhost:4000`",
    contact: {
      name: 'Team Formula1',
      url: 'https://csedusc-formula1.farefin.com'
    }
  },
  servers: [
    {
      url: 'https://csedusc-formula1.farefin.com',
      description: 'Production API Gateway'
    },
    {
      url: 'http://localhost:4000',
      description: 'Local Development Gateway'
    }
  ],
  paths: {},
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token (obtained from POST /api/auth/login or /api/auth/register)'
      }
    }
  }
};

function sanitizePath(rawUrl) {
  let urlStr = '';
  if (typeof rawUrl === 'string') {
    urlStr = rawUrl;
  } else if (rawUrl && rawUrl.raw) {
    urlStr = rawUrl.raw;
  } else if (rawUrl && rawUrl.path) {
    urlStr = '/' + rawUrl.path.join('/');
  }

  // replace {{baseUrl}} or host
  urlStr = urlStr.replace(/^https?:\/\/[^\/]+/, '').replace(/^\{\{baseUrl\}\}/, '');
  if (!urlStr.startsWith('/')) {
    urlStr = '/' + urlStr;
  }

  // Remove query string if any
  urlStr = urlStr.split('?')[0];

  // Convert postman variables like :id or :eventId or {{id}} or *path to {id}
  urlStr = urlStr.replace(/:([a-zA-Z0-9_]+)/g, '{$1}')
                 .replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, '{$1}')
                 .replace(/\/\*path/g, '/{id}');

  return urlStr;
}

function extractParams(requestUrl, reqObj) {
  const parameters = [];

  // Path params from URL
  if (requestUrl && requestUrl.path) {
    const pathVars = requestUrl.variable || [];
    pathVars.forEach(v => {
      parameters.push({
        name: v.key,
        in: 'path',
        required: true,
        description: v.description || `${v.key} path parameter`,
        schema: {
          type: 'string',
          default: v.value || undefined
        }
      });
    });
  }

  // Query params
  if (requestUrl && requestUrl.query) {
    requestUrl.query.forEach(q => {
      if (q.disabled) return;
      parameters.push({
        name: q.key,
        in: 'query',
        required: false,
        description: q.description || '',
        schema: {
          type: 'string',
          default: q.value || undefined
        }
      });
    });
  }

  return parameters;
}

function processItem(item, folderTags = []) {
  if (item.item && Array.isArray(item.item)) {
    const newTags = [...folderTags];
    let tagName = item.name.replace(/^\d+\.\s*/, '').replace(/^MS\d+\s*—\s*/, '');
    if (tagName) newTags.push(tagName);
    item.item.forEach(sub => processItem(sub, newTags));
    return;
  }

  if (item.request) {
    const req = item.request;
    const method = (req.method || 'GET').toLowerCase();
    const swaggerPath = sanitizePath(req.url);

    if (!openapi.paths[swaggerPath]) {
      openapi.paths[swaggerPath] = {};
    }

    const tag = folderTags[folderTags.length - 1] || 'General';

    const operation = {
      summary: item.name,
      description: req.description || item.name,
      tags: [tag],
      parameters: extractParams(req.url, req),
      responses: {}
    };

    // Public routes list
    const isPublic = swaggerPath === '/health' ||
      swaggerPath.startsWith('/api/auth/register') ||
      swaggerPath.startsWith('/api/auth/login') ||
      swaggerPath.startsWith('/api/auth/forgot-password') ||
      swaggerPath.startsWith('/api/auth/reset-password') ||
      swaggerPath.startsWith('/api/auth/refresh') ||
      swaggerPath.startsWith('/api/notifications/contact') ||
      swaggerPath.startsWith('/api/notifications/pending-contact') ||
      swaggerPath === '/api/media/upload-public' ||
      (method === 'get' && (
        swaggerPath.startsWith('/api/elections') ||
        swaggerPath.startsWith('/api/events') ||
        swaggerPath.startsWith('/api/notices') ||
        swaggerPath.startsWith('/api/media') ||
        swaggerPath.startsWith('/api/gallery')
      ));

    // Check auth
    if (isPublic || (req.auth && req.auth.type === 'noauth')) {
      operation.security = [];
    } else {
      operation.security = [{ BearerAuth: [] }];
    }

    // Body handling
    if (req.body) {
      if (req.body.mode === 'raw' && req.body.raw) {
        try {
          const parsedExample = JSON.parse(req.body.raw);
          operation.requestBody = {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  example: parsedExample
                }
              }
            }
          };
        } catch (e) {
          operation.requestBody = {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'string',
                  example: req.body.raw
                }
              }
            }
          };
        }
      } else if (req.body.mode === 'formdata' && req.body.formdata) {
        const properties = {};
        req.body.formdata.forEach(field => {
          if (field.type === 'file') {
            properties[field.key] = {
              type: 'string',
              format: 'binary',
              description: field.description || 'File upload'
            };
          } else {
            properties[field.key] = {
              type: 'string',
              example: field.value || ''
            };
          }
        });
        operation.requestBody = {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties
              }
            }
          }
        };
      }
    }

    // Responses from collection examples
    if (item.response && Array.isArray(item.response) && item.response.length > 0) {
      item.response.forEach(res => {
        const code = String(res.code || 200);
        let exampleBody = null;
        if (res.body) {
          try {
            exampleBody = JSON.parse(res.body);
          } catch (e) {
            exampleBody = res.body;
          }
        }
        operation.responses[code] = {
          description: res.name || `Response ${code}`,
          content: {
            'application/json': {
              schema: exampleBody && typeof exampleBody === 'object' ? {
                type: 'object',
                example: exampleBody
              } : {
                type: 'string',
                example: res.body || ''
              }
            }
          }
        };
      });
    } else {
      operation.responses['200'] = {
        description: 'Successful Operation',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              example: { status: 'success' }
            }
          }
        }
      };
    }

    openapi.paths[swaggerPath][method] = operation;
  }
}

collection.item.forEach(topItem => processItem(topItem, []));

const outputPath = path.resolve('api-gateway/src/swagger/openapi.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(openapi, null, 2), 'utf8');

// Also save to root openapi.json
fs.writeFileSync(path.resolve('openapi.json'), JSON.stringify(openapi, null, 2), 'utf8');

console.log(`Generated OpenAPI spec with ${Object.keys(openapi.paths).length} paths successfully!`);
