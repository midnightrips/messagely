const ExpressError = require("../expressError");
const Router = require("express").Router;
const router = new Router();
const Message = require("../models/message");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");


/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async (req, res, next) => {
    try {
        const message = await Message.get(req.params.id);

        // Ensure the message exists
        if (!message) {
            throw new ExpressError("Message not found", 404);
        }

        // Check if the logged-in user is either the sender or receiver
        const userId = req.user.id;
        if (message.from_user.id !== userId && message.to_user.id !== userId) {
            throw new ExpressError("Unauthorized", 401);
        }

        return res.json({ message });
    } catch (err) {
        return next(err);
    }
});



/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async (req, res, next) => {
    try {
        const fromUsername = req.user.username;
        const { to_username, body } = req.body;

        const message = await Message.create({ from_username: fromUsername, to_username, body });

        return res.status(201).json({ message });
    } catch (err) {
        return next(err);
    }
});



/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", ensureLoggedIn, async (req, res, next) => {
    try {
        const message = await Message.get(req.params.id);

        if (!message) {
            throw new ExpressError("Message not found", 404);
        }

        const userId = req.user.id;
        if (message.to_user.id !== userId) {
            throw new ExpressError("Unauthorized", 401);
        }

        const updatedMessage = await Message.markRead(messageId);

        return res.json({ message: updatedMessage });
    } catch (err) {
        return next(err);
    }
});  
