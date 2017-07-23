var express = require('express');
var router = express.Router();

let indexController = require('../controllers/indexController')

// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

/* GET home page. */
router.get('/', indexController.index_get);

/* POST home page. */
router.post('/', indexController.index_post);

module.exports = router;