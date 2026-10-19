import { PATCH as KanbanPatch, POST as KanbanPost, GET as KanbanGet } from './web/src/app/api/task-cards/route.ts';
import { PATCH as V2MovePatch } from './web/src/app/api/tasks/v2/route.ts';
import { DELETE as V2Delete } from './web/src/app/api/tasks/v2/route.ts';
import { DELETE as V1Delete } from './web/src/app/api/tasks/route.ts';
import { PATCH as V1MovePatch } from './web/src/app/api/tasks/[id]/move/route.ts';

export default {
  async fetch(request, env, ctx) {
    try {
      // Mock global DB and env for the Next.js routes
      globalThis.DB = env.DB;
      if (typeof process === 'undefined') {
        globalThis.process = { env: { DB: env.DB, JWT_SECRET: 'tbs_ii_secure_jwt_secret_key_2026' } };
      } else {
        process.env.DB = env.DB;
        process.env.JWT_SECRET = 'tbs_ii_secure_jwt_secret_key_2026';
      }

      const url = new URL(request.url);
      
      // Simulate Next.js params
      let searchParams = url.searchParams;

      if (url.pathname === '/api/task-cards') {
        if (request.method === 'PATCH') {
          return await KanbanPatch(request);
        }
        if (request.method === 'POST') {
          return await KanbanPost(request);
        }
        if (request.method === 'GET') {
          return await KanbanGet(request);
        }
      }

      if (url.pathname.startsWith('/api/tasks/') && url.pathname.endsWith('/move')) {
        const id = url.pathname.split('/')[3];
        if (request.method === 'PATCH') {
          return await V1MovePatch(request, { params: Promise.resolve({ id }) });
        }
      }

      if (url.pathname === '/api/tasks/v2') {
         if (request.method === 'PATCH') {
           return await V2MovePatch(request);
         }
         if (request.method === 'DELETE') {
           return await V2Delete(request);
         }
      }

      if (url.pathname === '/api/tasks') {
         if (request.method === 'DELETE') {
           return await V1Delete(request);
         }
      }

      return new Response('Not Found in Test Worker', { status: 404 });
    } catch (e) {
      return new Response(e.stack || e.message, { status: 500 });
    }
  }
};
