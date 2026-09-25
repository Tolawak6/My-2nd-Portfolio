import { Router } from 'express';
import { projectsRouter } from './projects.routes.js';
import { adminRouter } from './admin.routes.js';
import { contactRouter } from './contact.routes.js';
import { healthRouter } from './health.routes.js';

/** Single place where every API surface is mounted. */
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/projects', projectsRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/contact', contactRouter);
