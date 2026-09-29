import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { listAuditLogs } from './audit.service.js';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/', async (req, res, next) => {
  try {
    const result = await listAuditLogs(req.query);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
