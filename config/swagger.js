const swaggerJsDoc = require('swagger-jsdoc');
require('dotenv').config();

const options = {
    definition: {
        openapi: '3.0.0', info: {
            title: 'Authentication API',
            version: '1.0.0',
            description: 'A complete authentication API with JWT, OTP verification, and Google OAuth',
            contact: {
                name: 'API Support', email: 'support@example.com'
            }
        }, servers: [
            // {
            //     url: `http://localhost:${process.env.PORT}`,
            //     description: 'Local development server',
            // },
            {
                url: 'https://e-commerce-rho-nine-36.vercel.app',
                description: 'Production server (Vercel)',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'https', scheme: 'bearer', bearerFormat: 'JWT'
                }
            }, schemas: {
                Error: {
                    type: 'object', properties: {
                        success: {
                            type: 'boolean', example: false,
                        }, error: {
                            type: 'object', properties: {
                                message: {
                                    type: 'string',
                                }, stack: {
                                    type: 'string',
                                },
                            },
                        },
                    },
                },
            }
        }, security: [{
            bearerAuth: []
        }]
    }, apis: ['./routes/*/*.js', './models/*/*.js']
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = swaggerSpec;