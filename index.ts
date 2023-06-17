import { createExpressMiddleware } from '@trpc/server/adapters/express';
import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import redoc from 'redoc-express';
import { createOpenApiExpressMiddleware } from 'trpc-openapi';

import { appRouter } from './router';
import { openApiDocument } from './openapi';
import { createContext } from './context';

const app = express();
app.use(cors());

// Handle incoming tRPC requests
app.use('/api/trpc', createExpressMiddleware({ router: appRouter, createContext }));
// Handle incoming OpenAPI requests
app.use('/api', createOpenApiExpressMiddleware({ router: appRouter, createContext }));
// Serve OpenAPI schema
app.get('/docs/swagger.json', (_, res) => {
  res.json(openApiDocument);
});

// Serve Swagger UI with our OpenAPI schema
app.use('/', swaggerUi.serve);
app.get('/', swaggerUi.setup(openApiDocument));
// Serve ReDoc with our OpenAPI schema
app.get('/redoc', redoc({
  title: 'Example CRUD API',
  specUrl: '/docs/swagger.json',
}));

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});