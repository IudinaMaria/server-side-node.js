class ValidationError extends Error {
    constructor(message = "Validation error", errors = []) {
        super(message);
        this.status = 400;
        this.errors = errors;
    }
}

module.exports = ValidationError;
