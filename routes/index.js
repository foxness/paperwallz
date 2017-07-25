let express = require('express')
let crypto = require('crypto')
let passport = require('passport')
let router = express.Router()

let mainController = require('../controllers/mainController')

ensureAuthenticated = (req, res, next) =>
{
    if (req.isAuthenticated())
        return next()

    res.redirect('/login')
}

router.get('/', ensureAuthenticated, mainController.user_get)
router.post('/add', mainController.wallpaper_add)
router.post('/delete', mainController.wallpaper_delete)

router.get('/login', (req, res, next) =>
{
    req.session.state = crypto.randomBytes(32).toString('hex');
    passport.authenticate('reddit',
    {
        state: req.session.state,
    })(req, res, next)
})

router.get('/callback', (req, res, next) =>
{
    if (req.query.state == req.session.state)
    {
        passport.authenticate('reddit',
        {
            successRedirect: '/',
            failureRedirect: '/login'
        })(req, res, next);
    }
    else
        next(new Error(403));
})

router.get('/logout', (req, res) =>
{
    req.logout()
    res.redirect('/login')
})

module.exports = router