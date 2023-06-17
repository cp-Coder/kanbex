import { createExpressMiddleware } from '@trpc/server/adapters/express';
import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { createOpenApiExpressMiddleware } from 'trpc-openapi';

import { appRouter } from './router';
import { openApiDocument } from './openapi';

const app = express();
app.use(cors());

// Handle incoming tRPC requests
app.use('/api/trpc', createExpressMiddleware({ router: appRouter }));
// Handle incoming OpenAPI requests
app.use('/api', createOpenApiExpressMiddleware({ router: appRouter }));

// Serve Swagger UI with our OpenAPI schema
app.use('/', swaggerUi.serve);
app.get('/', swaggerUi.setup(openApiDocument));

app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});