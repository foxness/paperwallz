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
router.get('/queue/info', ensureAuthenticated, mainController.queue_info)

router.post('/queue/start', ensureAuthenticated, mainController.queue_start)
router.post('/queue/stop', ensureAuthenticated, mainController.queue_stop)

router.post('/queue/add', mainController.wallpaper_add) // todo: ensure authenticated
router.post('/queue/delete', mainController.wallpaper_delete)
// router.post('/queue/post', mainController.wallpaper_post)

module.exports = router