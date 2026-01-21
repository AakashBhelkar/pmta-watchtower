const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.query, { abortEarly: false });

    if (error) {
        const details = error.details.map(d => d.message);
        return res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid request parameters',
            details
        });
    }

    next();
};

const schemas = {
    // Schema for event queries
    eventQuery: Joi.object({
        type: Joi.string().valid('acct', 'tran', 'bounce', 'fbl', 'rb').allow('').optional(),
        jobId: Joi.string().alphanum().allow('').optional(),
        sender: Joi.string().allow('').optional(), // Removed email() as it might be too strict for partials or empty
        domain: Joi.string().allow('').optional(), // Removed domain() for the same reason
        page: Joi.number().integer().min(0).default(0),
        limit: Joi.number().integer().min(1).max(100).default(50)
    }),

    // Schema for analytics queries
    analyticsQuery: Joi.object({
        from: Joi.date().iso().optional(),
        to: Joi.date().iso().optional(),
        type: Joi.string().valid('domain', 'sender', 'ip').allow('').optional()
    })
};

module.exports = {
    validate,
    schemas
};
