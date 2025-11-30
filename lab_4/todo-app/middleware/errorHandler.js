const Sentry = require("@sentry/node");
const ValidationError = require("../errors/ValidationError");

module.exports = (err, req, res, next) => {
    console.error(err);

    const status = err.status || 500;

    // Только не-валидационные ошибки → в Sentry
    if (!(err instanceof ValidationError)) {
        Sentry.captureException(err);
    }

    res.status(status).json({
        status: "error",
        message: err.message,
        errors: err.errors || undefined,
    });
};
