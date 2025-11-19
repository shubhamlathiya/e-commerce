const express = require('express');
const router = express.Router();
const BulkNegotiation = require('../../models/negotiation/bulkNegotiationModel');

const Cart = require('../../models/cartManagement/cartModel');
const {authenticateJWT} = require("../../middleware/authMiddleware");
const {Logform} = require("winston");

// Create bulk negotiation
router.post('/create', authenticateJWT, async (req, res) => {
    try {
        const { products, totalProposedAmount, loginType, cartId } = req.body;
        const businessUserId = req.user.id;

        if (loginType !== 'business') {
            return res.status(403).json({
                success: false,
                message: "Only business users can create negotiations"
            });
        }

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Products array is required"
            });
        }

        if (!totalProposedAmount || totalProposedAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid total proposed amount is required"
            });
        }

        if (!cartId) {
            return res.status(400).json({
                success: false,
                message: "cartId is required"
            });
        }

        const negotiation = new BulkNegotiation({
            businessUserId,
            cartId,
            products,
            totalProposedAmount,
            status: 'pending'
        });

        await negotiation.save();

        const populatedNegotiation = await BulkNegotiation.findById(negotiation._id)
            .populate('businessUserId', 'name email phone loginType')
            .populate('products.productId', 'title images')
            .populate('products.variantId', 'name attributes')
            .populate('cartId');

        res.status(201).json({
            success: true,
            message: "Negotiation request submitted successfully",
            data: populatedNegotiation
        });

    } catch (error) {
        console.error("Create negotiation error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

// Get negotiations for business user
router.get('/my-negotiations', authenticateJWT, async (req, res) => {
    try {
        if (req.user.loginType !== 'business') {
            return res.status(403).json({
                success: false,
                message: "Only business users can view negotiations"
            });
        }

        const negotiations = await BulkNegotiation.find({businessUserId: req.user.id})
            .populate('products.productId', 'title images')
            .populate('products.variantId', 'name attributes')
            .sort({createdAt: -1});

        res.json({
            success: true,
            data: negotiations
        });

    } catch (error) {
        console.error("Get negotiations error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

// Admin: Get all negotiations
router.get('/admin/all', authenticateJWT, async (req, res) => {
    try {

        const {status, page = 1, limit = 10} = req.query;

        let query = {};
        if (status) query.status = status;

        const negotiations = await BulkNegotiation.find(query)
            .populate('businessUserId', 'name email phone companyName')
            .populate('products.productId', 'title images')
            .populate('products.variantId', 'name attributes')
            .sort({createdAt: -1})
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await BulkNegotiation.countDocuments(query);

        res.json({
            success: true,
            data: negotiations,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });

    } catch (error) {
        console.error("Admin get negotiations error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

// Admin: Update negotiation status
router.put('/admin/update-status/:id', authenticateJWT, async (req, res) => {
    try {
        const { status, notes, counterOfferAmount } = req.body;
        const negotiationId = req.params.id;

        if (!['approved', 'rejected', 'accepted', 'counter_offer'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status"
            });
        }

        const negotiation = await BulkNegotiation.findById(negotiationId)
            .populate('businessUserId')
            .populate('products.productId')
            .populate('products.variantId');

        if (!negotiation) {
            return res.status(404).json({
                success: false,
                message: "Negotiation not found"
            });
        }

        // Update negotiation status and admin response
        negotiation.status = status;
        negotiation.adminResponse = {
            adminId: req.user.id,
            responseDate: new Date(),
            notes: notes || '',
            counterOfferAmount: counterOfferAmount || null
        };

        // If negotiation is approved, update cart with negotiated prices
        if (status === 'approved') {
            console.log("hy")
            await updateCartWithNegotiatedPrices(negotiation);
            console.log("update negotiation successfully");
        }

        await negotiation.save();

        res.json({
            success: true,
            message: `Negotiation ${status} successfully`,
            data: negotiation
        });

    } catch (error) {
        console.error("Update negotiation status error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});
// Helper function to update cart with negotiated prices
async function updateCartWithNegotiatedPrices(negotiation) {
    try {
        const cartId = negotiation?.cartId;
        if (!cartId) {
            console.log("Negotiation has no cartId");
            return;
        }

        const cart = await Cart.findById(cartId);

        if (!cart) {
            console.log("Cart not found for cartId:", cartId);
            return;
        }

        let cartUpdated = false;

        for (const negotiatedProduct of negotiation.products) {

            // Support both populated and non-populated IDs
            const productId =
                negotiatedProduct.productId?._id?.toString() ||
                negotiatedProduct.productId?.toString();

            const variantId =
                negotiatedProduct.variantId?._id?.toString() ||
                negotiatedProduct.variantId?.toString();

            const cartItem = cart.items.find(item =>
                item.productId.toString() === productId &&
                (
                    (!variantId && !item.variantId) ||
                    (variantId &&
                        item.variantId &&
                        item.variantId.toString() === variantId)
                )
            );

            if (!cartItem) {
                console.log("Product not found in cart:", negotiatedProduct.productName);
                continue;
            }

            const newPrice = negotiatedProduct.proposedPrice;

            // Update fields
            cartItem.price = newPrice;
            cartItem.finalPrice = newPrice;
            cartItem.originalPrice = newPrice;
            cartItem.negotiatedPrice = newPrice;
            cartItem.negotiationId = negotiation._id;

            cartUpdated = true;
        }

        if (!cartUpdated) {
            console.log("No cart items were updated");
            return;
        }

        // Recalculate total
        cart.cartTotal = cart.items.reduce((sum, item) => {
            return sum + item.finalPrice * item.quantity + (item.shippingCharge || 0);
        }, 0);

        await cart.save();
        console.log("Cart updated successfully");

    } catch (error) {
        console.error("Error updating cart:", error);
    }
}


// Helper function to apply coupon to cart (reuse your existing function)
async function applyCouponToCart(cart, couponCode) {
    try {
        const coupon = await Coupon.findOne({
            code: couponCode,
            status: 'active',
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });

        if (!coupon) {
            cart.couponCode = null;
            cart.discount = 0;
            return;
        }

        const subtotal = cart.items.reduce((total, item) => {
            return total + (item.finalPrice * item.quantity);
        }, 0);

        let discount = 0;

        if (coupon.type === 'percent') {
            discount = (subtotal * coupon.value) / 100;
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        } else if (coupon.type === 'flat') {
            discount = Math.min(coupon.value, subtotal);
        }

        cart.discount = discount;
        cart.cartTotal = subtotal - discount;
    } catch (error) {
        console.error('Error applying coupon to cart:', error);
        cart.couponCode = null;
        cart.discount = 0;
    }
}

// Additional endpoint to apply negotiation to cart manually
router.post('/apply-to-cart/:negotiationId', authenticateJWT, async (req, res) => {
    try {
        const { negotiationId } = req.params;
        const userId = req.user.id;

        const negotiation = await BulkNegotiation.findOne({
            _id: negotiationId,
            businessUserId: userId,
            status: 'approved'
        }).populate('products.productId')
            .populate('products.variantId');

        if (!negotiation) {
            return res.status(404).json({
                success: false,
                message: "Approved negotiation not found"
            });
        }

        await updateCartWithNegotiatedPrices(negotiation);

        res.json({
            success: true,
            message: "Negotiated prices applied to cart successfully"
        });

    } catch (error) {
        console.error("Apply negotiation to cart error:", error);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

module.exports = router;