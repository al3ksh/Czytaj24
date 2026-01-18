const express = require('express');
const path = require('path');
const multer = require('multer');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin');
const adminController = require('../controllers/adminController');

const uploadStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.join(__dirname, '..', 'public', 'uploads', 'books'));
	},
	filename: (req, file, cb) => {
		const ext = path.extname(file.originalname).toLowerCase();
		const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
		cb(null, safeName);
	},
});

const upload = multer({
	storage: uploadStorage,
	limits: { fileSize: 3 * 1024 * 1024 },
	fileFilter: (req, file, cb) => {
		const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
		const ext = path.extname(file.originalname).toLowerCase();
		if (!allowed.includes(ext)) {
			return cb(new Error('Dozwolone formaty okładek: JPG, PNG, WEBP.'));
		}
		return cb(null, true);
	},
});


router.get('/', isAdmin, adminController.getDashboard);


router.get('/books', isAdmin, adminController.getBooks);
router.get('/books/new', isAdmin, adminController.getBookForm);
router.post('/books', isAdmin, upload.single('coverImage'), adminController.createBook);
router.get('/books/:id/edit', isAdmin, adminController.getBookForm);
router.post('/books/:id', isAdmin, upload.single('coverImage'), adminController.updateBook);
router.post('/books/:id/delete', isAdmin, adminController.deleteBook);


router.get('/orders', isAdmin, adminController.getOrders);
router.post('/orders/:id/status', isAdmin, adminController.updateOrderStatus);

module.exports = router;
