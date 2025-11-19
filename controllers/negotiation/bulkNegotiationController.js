const BulkNegotiation = require('../../models/negotiation/bulkNegotiationModel');
const Product = require('../../models/productCatalog/ProductModel');
const ProductVariant = require('../../models/productCatalog/productVariantModel');
const User = require('../../models/auth/userModel');
const TierPricing = require('../../models/productPricingAndTaxation/tierPricingModel');

// Create bulk negotiation request (Business User)
exports.createBulkNegotiation = async (req, res) => {
    try {
        const { products, expiresAt } = req.body;
        const businessUserId = req.user.id;

        // Validate business user
        const businessUser = await User.findOne({ _id: businessUserId }).lean();
        if (!businessUser) {
            return res.status(400).json({
                message: 'Invalid business user or user is not a business account'
            });
        }

        let totalProposedAmount = 0;
        const validatedProducts = [];

        for (const item of products) {
            const product = await Product.findById(item.productId).lean();
            if (!product) {
                return res.status(400).json({
                    message: `Product not found: ${item.productId}`
                });
            }

            let variant = null;
            if (item.variantId) {
                variant = await ProductVariant.findOne({
                    _id: item.variantId,
                    productId: item.productId
                }).lean();

                if (!variant) {
                    return res.status(400).json({
                        message: `Variant not found for product: ${item.productId}`
                    });
                }
            }

            // Fetch tier pricing
            const tierPricing = await TierPricing.findOne({
                productId: item.productId,
                variantId: item.variantId || null,
                minQty: { $lte: item.quantity },
                maxQty: { $gte: item.quantity }
            })
                .sort({ minQty: -1 })
                .lean();

            // Safe fallback price from product or variant
            const basePrice =
                tierPricing?.price ||
                variant?.price ||
                product.basePrice ||
                product.price ||
                0;

            const currentPrice = basePrice;
            const proposedPrice = item.proposedPrice || currentPrice;
            const totalAmount = proposedPrice * item.quantity;

            validatedProducts.push({
                productId: item.productId,
                variantId: item.variantId || null,
                productName: product.productName || product.name || product.title || 'Unknown Product',
                variantName:
                    variant?.variantName ||
                    variant?.name ||
                    '',
                quantity: item.quantity,
                currentPrice,
                proposedPrice,
                totalAmount
            });

            totalProposedAmount += totalAmount;
        }

        // Create negotiation request
        const negotiation = await BulkNegotiation.create({
            businessUserId,
            products: validatedProducts,
            totalProposedAmount,
            expiresAt: expiresAt
                ? new Date(expiresAt)
                : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
        });

        res.status(201).json({
            message: 'Bulk negotiation request created successfully',
            negotiation
        });

    } catch (err) {
        console.error('Create bulk negotiation error:', err);
        res.status(400).json({ message: err.message });
    }
};

// Get bulk negotiations for business user
exports.getMyNegotiations = async (req, res) => {
    try {
        const { id, status } = req.query;
        console.log(req.query);

        const businessUserId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = { businessUserId };

        if (status && status !== 'all') {
            query.status = status;
        }

        if (id) {
            query._id = id;
        }

        const negotiations = await BulkNegotiation.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await BulkNegotiation.countDocuments(query);

        res.json({
            negotiations,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                totalRecords: total
            }
        });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Get all negotiations for admin
exports.getAllNegotiations = async (req, res) => {
    try {
        const { status, businessUserId, startDate, endDate } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};

        if (status && status !== 'all') query.status = status;
        if (businessUserId) query.businessUserId = businessUserId;

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const negotiations = await BulkNegotiation.find(query)
            .populate('businessUserId', 'name email companyName')
            .populate('adminResponse.adminId', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await BulkNegotiation.countDocuments(query);

        res.json({
            negotiations,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                totalRecords: total
            }
        });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Admin approve/reject/counter negotiation
exports.adminRespondToNegotiation = async (req, res) => {
    try {
        const { id } = req.params;
        const { adminId, action, counterOfferAmount, notes } = req.body;
        console.log(req.body)
        const negotiation = await BulkNegotiation.findById(id);
        if (!negotiation) {
            return res.status(404).json({ message: 'Negotiation not found' });
        }

        if (negotiation.status !== 'pending') {
            return res.status(400).json({
                message: 'Negotiation has already been processed'
            });
        }

        let updateData = {
            status: action,
            adminResponse: {
                adminId,
                responseDate: new Date(),
                notes
            }
        };

        if (action === 'counter_offer') {
            if (!counterOfferAmount || counterOfferAmount <= 0) {
                return res.status(400).json({
                    message: 'Counter offer amount is required for counter offers'
                });
            }
            updateData.adminResponse.counterOfferAmount = counterOfferAmount;
        }

        const updatedNegotiation = await BulkNegotiation.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('businessUserId', 'name email companyName');

        res.json({
            message: `Negotiation ${action} successfully`,
            negotiation: updatedNegotiation
        });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Business user accept/reject counter offer
exports.respondToCounterOffer = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'accepted' or 'rejected'

        const negotiation = await BulkNegotiation.findById(id);
        if (!negotiation) {
            return res.status(404).json({ message: 'Negotiation not found' });
        }

        if (negotiation.status !== 'counter_offer') {
            return res.status(400).json({
                message: 'No counter offer available to respond to'
            });
        }

        const newStatus = action === 'accepted' ? 'accepted' : 'rejected';

        const updatedNegotiation = await BulkNegotiation.findByIdAndUpdate(
            id,
            { status: newStatus },
            { new: true, runValidators: true }
        );

        res.json({
            message: `Counter offer ${action} successfully`,
            negotiation: updatedNegotiation
        });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Get negotiation statistics for admin dashboard
exports.getNegotiationStats = async (req, res) => {
    try {
        const stats = await BulkNegotiation.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalProposedAmount' }
                }
            }
        ]);

        const totalStats = await BulkNegotiation.aggregate([
            {
                $group: {
                    _id: null,
                    totalNegotiations: { $sum: 1 },
                    totalValue: { $sum: '$totalProposedAmount' },
                    avgValue: { $avg: '$totalProposedAmount' }
                }
            }
        ]);

        res.json({
            statusStats: stats,
            overallStats: totalStats[0] || {}
        });

    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};