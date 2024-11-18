
const express = require('express');
const multer = require('multer');
const path = require('path');
const Car = require('../models/Car');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 1000000 }, // 1MB limit
  fileFilter: function (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image file (jpg, jpeg, png)'));
    }
    cb(null, true);
  }
});

// Create a new car
router.post('/', auth, upload.array('images', 10), async (req, res) => {
  try {
    const car = new Car({
      ...req.body,
      owner: req.user._id,
      images: req.files.map(file => file.path)
    });
    await car.save();
    res.status(201).json(car);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all cars for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const cars = await Car.find({ owner: req.user._id });
    res.json(cars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific car by id
router.get('/:id', auth, async (req, res) => {
  try {
    const car = await Car.findOne({ _id: req.params.id, owner: req.user._id });
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    res.json(car);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a car
router.patch('/:id', auth, upload.array('images', 10), async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ['title', 'description', 'tags'];
  const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

  if (!isValidOperation) {
    return res.status(400).json({ error: 'Invalid updates!' });
  }

  try {
    const car = await Car.findOne({ _id: req.params.id, owner: req.user._id });

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    updates.forEach((update) => car[update] = req.body[update]);
    
    if (req.files && req.files.length > 0) {
      car.images = req.files.map(file => file.path);
    }

    await car.save();
    res.json(car);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a car
router.delete('/:id', auth, async (req, res) => {
  try {
    const car = await Car.findOneAndDelete({ _id: req.params.id, owner: req.user._id });

    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }

    res.json(car);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search cars
router.get('/search/:query', auth, async (req, res) => {
  try {
    const cars = await Car.find({ 
      $text: { $search: req.params.query },
      owner: req.user._id
    });
    res.json(cars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
