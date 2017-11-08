let express = require('express')
let router = express.Router()

let mainController = require('../controllers/mainController')

ensureAuthenticated = (req, res, next) =>
{
    if (req.isAuthenticated())
        return next()

    res.redirect('/login')
}

router.get('/', mainController.index)
router.get('/login', mainController.login)
router.get('/auth/reddit', mainController.redditAuth)
router.get('/reddit/callback', mainController.redditCallback)
router.get('/imgur/callback', mainController.imgurCallback)
router.get('/logout', mainController.logout)
router.get('/queue', ensureAuthenticated, mainController.queue)

module.exports = router