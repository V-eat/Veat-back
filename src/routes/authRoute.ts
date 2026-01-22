import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();
const authController = new AuthController();

// Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.put('/update', authController.updateUser);
router.delete('/delete', authController.deleteUser);
router.get('/me', authController.getCurrentUser);

export default router;
