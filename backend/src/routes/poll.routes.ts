import { Router } from 'express';
import pollController from '../modules/poll/poll.controller';

const router = Router();

router.get('/', pollController.getPolls);
router.get('/:id', pollController.getPoll);
router.post('/', pollController.createPoll);

export default router;
