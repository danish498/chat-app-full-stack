import express from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/user.controller.js';
import { validate } from '../middleware/validate.js';
import { userSchemas } from '../validations/user.schema.js';

const router = express.Router();

router.get('/', getUsers);
router.get('/:id', validate(userSchemas.getById), getUserById);
router.post('/', validate(userSchemas.create), createUser);
router.patch('/:id', validate(userSchemas.update), updateUser);
router.delete('/:id', validate(userSchemas.getById), deleteUser);

export default router;
