import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { contentController } from '../controllers/content.js';
import { destinationSchema, destinationPatch, packageSchema, packagePatch, experienceSchema, experiencePatch, idParams, contentQuery, adminPackagesQuery } from '../validators/content.js';

const router = Router();
for (const [entity, create, patch, query] of [
  ['destinations', destinationSchema, destinationPatch, contentQuery],
  ['packages', packageSchema, packagePatch, adminPackagesQuery],
  ['experiences', experienceSchema, experiencePatch, contentQuery]
]) {
  const controller = contentController(entity);
  const path = `/admin/${entity}`;
  router.get(path, requireAuth, validate(query,'query'), controller.list);
  router.get(`${path}/:id`, requireAuth, validate(idParams,'params'), controller.get);
  router.post(path, requireAuth, validate(create), controller.create);
  router.patch(`${path}/:id`, requireAuth, validate(idParams,'params'), validate(patch), controller.update);
  router.delete(`${path}/:id`, requireAuth, validate(idParams,'params'), controller.remove);
}
export default router;
