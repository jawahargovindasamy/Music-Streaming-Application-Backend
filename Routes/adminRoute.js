import express from 'express';
import { getAdminDashboardStats } from '../Controllers/adminController.js';
import { authMiddleware } from '../Middleware/authMiddleware.js';


const router = express.Router();

router.get('/dashboard',authMiddleware ,getAdminDashboardStats);

export default router;