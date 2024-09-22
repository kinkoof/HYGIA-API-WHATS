module.exports = (req, res, next) => {
    const token = req.query['hub.verify_token'];
    if (token === process.env.VERIFY_TOKEN) {
        next();
    } else {
        res.status(403).send('Forbidden');
    }
};
