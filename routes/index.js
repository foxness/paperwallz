var express = require('express');
var router = express.Router();

let wallpaperController = require('../controllers/wallpaperController')

router.get('/', wallpaperController.wallpaper_list);
router.post('/add', wallpaperController.wallpaper_add);

module.exports = router;