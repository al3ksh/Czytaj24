const express = require('express');
const path = require('path');
const multer = require('multer');
const { ObjectId } = require('mongodb');
const router = express.Router();
const isAdmin = require('../middleware/isAdmin');
const adminController = require('../controllers/adminController');
const { connectToDatabase } = require('../config/db');

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

router.use(async (err, req, res, next) => {
	if (!err) return next();

	const isUploadError = err instanceof multer.MulterError || err.message?.includes('Dozwolone formaty okładek');
	if (!isUploadError) {
		return next(err);
	}

	let book = null;
	if (req.params?.id) {
		try {
			const db = await connectToDatabase();
			book = await db.collection('books').findOne({ _id: new ObjectId(req.params.id) });
		} catch (error) {
			book = null;
		}
	}

	const errorMessage = err.code === 'LIMIT_FILE_SIZE'
		? 'Plik okładki jest zbyt duży (max 3MB).'
		: err.message || 'Nie udało się przesłać okładki.';

	return res.status(400).render('admin/bookForm', {
		userName: req.session.userName,
		book,
		errors: { general: errorMessage },
		values: req.body || {},
	});
});

module.exports = router;
