import { listContent, getContent, saveContent, deleteContent } from '../services/content.js';
import { ok } from '../utils/response.js';

export function contentController(entity) {
  const handle = fn => async (req, res, next) => { try { await fn(req, res); } catch (error) { next(error); } };
  return {
    list: handle(async (req,res) => ok(res, await listContent(entity, req.query), 'Content retrieved.')),
    get: handle(async (req,res) => ok(res, await getContent(entity, req.params.id), 'Content retrieved.')),
    create: handle(async (req,res) => { const row = await saveContent(entity, req.body); return ok(res.status(201), row, 'Content created.'); }),
    update: handle(async (req,res) => ok(res, await saveContent(entity, req.body, req.params.id), 'Content updated.')),
    remove: handle(async (req,res) => { await deleteContent(entity, req.params.id); return ok(res, {id:req.params.id}, 'Content deleted.'); })
  };
}
