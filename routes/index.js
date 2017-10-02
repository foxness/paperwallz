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
router.get('/auth/reddit', mainController.auth_reddit)
router.get('/callback', mainController.reddit_callback)
router.get('/logout', mainController.logout)

router.get('/queue', ensureAuthenticated, mainController.queue)

router.post('/queue/delete', mainController.wallpaper_delete)
// router.post('/queue/post', mainController.wallpaper_post)

module.exports = router