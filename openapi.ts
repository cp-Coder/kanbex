import { generateOpenApiDocument } from 'trpc-openapi';

import { appRouter } from './router';

// Generate OpenAPI schema document
export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Kanbex APIs',
  description: 'OpenAPI compliant REST API for kanban board',
  version: '1.0.0',
  baseUrl: '/api',
});