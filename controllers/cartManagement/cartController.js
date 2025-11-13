const Cart = require('../../models/cartManagement/cartModel');
const Product = require('../../models/productCatalog/ProductModel');
const Variant = require('../../models/productCatalog/productVariantModel');
const Coupon = require('../../models/offersAndDiscounts/couponModel');
const ProductPricing = require('../../models/productPricingAndTaxation/productPricingModel')
const {Logform} = require("winston");
/**
 * Get cart by sessionId or userId
 */
exports.getCart = async (req, res) => {
    try {
        const { sessionId } = req.query;
        const userId = req.user ? req.user.id : null;

        if (!sessionId && !userId) {
            return res.status(400).json({
                success: false,
                message: 'Either sessionId (for guests) or authenticated user is required'
            });
        }

        // Build query
        let query = {};
        if (userId && sessionId) {
            query = { $or: [{ sessionId }, { userId }] };
        } else if (userId) {
            query = { userId };
        } else {
            query = { sessionId };
        }

        // Get cart
        const cart = await Cart.findOne(query).lean();

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Fetch product + variant details for each item
        const populatedItems = await Promise.all(
            (cart.items || []).map(async (item) => {
                const product = await Product.findById(item.productId)
                    .populate('brandId', 'name slug logo')
                    .populate('categoryIds', 'name slug')
                    .select('title slug thumbnail price')
                    .lean();

                let variant = null;
                if (item.variantId) {
                    variant = await Variant.findById(item.variantId)
                        .select('name price sku stock attributes images')
                        .lean();
                }

                // Compute effective price
                const finalPrice = variant?.price ?? product?.price ?? 0;

                return {
                    ...item,
                    product: product || null,
                    variant: variant || null,
                    finalPrice,
                    subtotal: finalPrice * item.quantity
                };
            })
        );

        // Attach user if logged in
        if (userId && !cart.userId) {
            await Cart.updateOne({ _id: cart._id }, { userId });
        }

        // Compute total
        const totalAmount = populatedItems.reduce((sum, item) => sum + item.subtotal, 0);
        console.log(populatedItems)
        return res.status(200).json({
            success: true,
            message: 'Cart retrieved successfully',
            data: {
                ...cart,
                items: populatedItems,
                totalAmount
            }
        });

    } catch (error) {
        console.error('Error retrieving cart:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving cart',
            error: error.message
        });
    }
};

/**
 * Add item to cart
 */
exports.addItem = async (req, res) => {
    // try {
    const {productId, variantId, quantity , sessionId} = req.body;
    const userId = req.user ? req.user.id : null;
    console.log(req.body)
    console.log(sessionId);
    // Validate required fields
    if (!sessionId) {
        return res.status(400).json({
            success: false,
            message: 'Session ID is required'
        });
    }

    if (!productId) {
        return res.status(400).json({
            success: false,
            message: 'Product ID is required'
        });
    }

    const qty = Number(quantity);
    console.log(qty)
    if (!qty || qty <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Quantity must be a valid positive number'
        });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        });
    }

    // If variant is specified, verify it exists for this product
    let variant = null;
    if (variantId) {
        variant = await Variant.findOne({_id: variantId, productId});
        if (!variant) {
            return res.status(404).json({
                success: false,
                message: 'Variant not found for this product'
            });
        }
    }

    // Get pricing
    let pricing = null;
    if (variantId) {
        pricing = await ProductPricing.findOne({productId, variantId, status: true});
    }

    // Fall back to product-level pricing if variant-level not found
    if (!pricing) {
        pricing = await ProductPricing.findOne({productId, variantId: null, status: true});
    }
    console.log(pricing)
    if (!pricing) {
        return res.status(404).json({
            success: false,
            message: 'Pricing not found for this product/variant'
        });
    }

    const basePrice = Number(pricing.basePrice) || 0;
    const itemFinalPrice = Number(pricing.finalPrice) || basePrice;

    // Check price validity
    if (itemFinalPrice <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid product price'
        });
    }

    // Find or create cart
    let cart = await Cart.findOne({sessionId});
    if (!cart) {
        cart = new Cart({
            sessionId,
            userId,
            items: [],
            cartTotal: 0
        });
    } else if (userId && !cart.userId) {
        cart.userId = userId; // attach user to existing session cart
    }

    // Check if item already exists
    const existingItemIndex = cart.items.findIndex(item =>
        item.productId.toString() === productId &&
        ((!variantId && !item.variantId) ||
            (variantId && item.variantId && item.variantId.toString() === variantId))
    );

    if (existingItemIndex > -1) {
        // Update existing item quantity
        cart.items[existingItemIndex].quantity += qty;
        cart.items[existingItemIndex].finalPrice = itemFinalPrice;
        cart.items[existingItemIndex].price = basePrice;
    } else {
        // Add new item
        cart.items.push({
            productId,
            variantId: variantId || null,
            quantity: qty,
            price: basePrice,
            finalPrice: itemFinalPrice,
            addedAt: new Date()
        });
    }

    // Safely recalculate total
    cart.cartTotal = cart.items.reduce((total, item) => {
        const itemTotal = Number(item.finalPrice) * Number(item.quantity);
        return total + (isNaN(itemTotal) ? 0 : itemTotal);
    }, 0);

    // Reapply coupon if applicable
    if (cart.couponCode && typeof exports.applyCoupon === 'function') {
        await exports.applyCoupon(cart, cart.couponCode);
    }

    await cart.save();

    return res.status(200).json({
        success: true,
        message: 'Item added to cart',
        data: cart
    });
    // } catch (error) {
    //   console.error('Error adding item to cart:', error);
    //   return res.status(500).json({
    //     success: false,
    //     message: 'Error adding item to cart',
    //     error: error.message
    //   });
    // }
};

/**
 * Update item quantity in cart
 */
exports.updateItemQuantity = async (req, res) => {
    try {
        const {sessionId} = req.params;
        console.log(req.body)
        const {productId, variantId, quantity} = req.body;

        if (quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1'
            });
        }

        let cart = await Cart.findOne({sessionId});

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Find the item in cart
        const itemIndex = cart.items.findIndex(item =>
            item.productId.toString() === productId &&
            ((!variantId && !item.variantId) ||
                (variantId && item.variantId && item.variantId.toString() === variantId))
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        // Update quantity
        cart.items[itemIndex].quantity = quantity;

        // Recalculate cart total
        cart.cartTotal = cart.items.reduce((total, item) => {
            return total + (item.finalPrice * item.quantity);
        }, 0);

        // Apply discount if coupon exists
        if (cart.couponCode) {
            await this.applyCoupon(cart, cart.couponCode);
        }

        await cart.save();

        return res.status(200).json({
            success: true,
            message: 'Item quantity updated',
            data: cart
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error updating item quantity',
            error: error.message
        });
    }
};

/**
 * Remove item from cart
 */
exports.removeItem = async (req, res) => {
    try {
        const {sessionId} = req.params;
        const {productId, variantId} = req.body;

        let cart = await Cart.findOne({sessionId});

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Find the item in cart
        const itemIndex = cart.items.findIndex(item =>
            item.productId.toString() === productId &&
            ((!variantId && !item.variantId) ||
                (variantId && item.variantId && item.variantId.toString() === variantId))
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        // Remove item
        cart.items.splice(itemIndex, 1);

        // Recalculate cart total
        cart.cartTotal = cart.items.reduce((total, item) => {
            return total + (item.finalPrice * item.quantity);
        }, 0);

        // Apply discount if coupon exists
        if (cart.couponCode) {
            await this.applyCoupon(cart, cart.couponCode);
        }

        await cart.save();

        return res.status(200).json({
            success: true,
            message: 'Item removed from cart',
            data: cart
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error removing item from cart',
            error: error.message
        });
    }
};

/**
 * Apply coupon to cart
 */
exports.applyCoupon = async (req, res) => {
    try {
        const {sessionId} = req.params;
        const {couponCode} = req.body;

        let cart = await Cart.findOne({sessionId});

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Find coupon
        const coupon = await Coupon.findOne({
            code: couponCode,
            status: true,
            validFrom: {$lte: new Date()},
            validUntil: {$gte: new Date()}
        });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Invalid or expired coupon'
            });
        }

        // Calculate subtotal before discount
        const subtotal = cart.items.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);

        // Check minimum order value
        if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
            return res.status(400).json({
                success: false,
                message: `Minimum order value of ${coupon.minOrderValue} required for this coupon`
            });
        }

        // Calculate discount
        let discount = 0;

        if (coupon.discountType === 'percentage') {
            discount = (subtotal * coupon.discountValue) / 100;

            // Apply max discount if set
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        } else {
            // Fixed amount discount
            discount = coupon.discountValue;

            // Don't allow discount greater than subtotal
            if (discount > subtotal) {
                discount = subtotal;
            }
        }

        // Update cart
        cart.couponCode = couponCode;
        cart.discount = discount;
        cart.cartTotal = subtotal - discount;

        await cart.save();

        return res.status(200).json({
            success: true,
            message: 'Coupon applied successfully',
            data: cart
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error applying coupon',
            error: error.message
        });
    }
};

/**
 * Remove coupon from cart
 */
exports.removeCoupon = async (req, res) => {
    try {
        const {sessionId} = req.params;

        let cart = await Cart.findOne({sessionId});

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Remove coupon and recalculate total
        cart.couponCode = null;
        cart.discount = 0;

        // Recalculate cart total
        cart.cartTotal = cart.items.reduce((total, item) => {
            return total + (item.finalPrice * item.quantity);
        }, 0);

        await cart.save();

        return res.status(200).json({
            success: true,
            message: 'Coupon removed successfully',
            data: cart
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error removing coupon',
            error: error.message
        });
    }
};

/**
 * Clear cart
 */
exports.clearCart = async (req, res) => {
    try {
        const {sessionId} = req.params;

        let cart = await Cart.findOne({sessionId});

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Clear items and reset totals
        cart.items = [];
        cart.couponCode = null;
        cart.discount = 0;
        cart.cartTotal = 0;

        await cart.save();

        return res.status(200).json({
            success: true,
            message: 'Cart cleared successfully',
            data: cart
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error clearing cart',
            error: error.message
        });
    }
};

/**
 * Merge guest cart with user cart
 */
exports.mergeCart = async (req, res) => {
    try {
        const {sessionId} = req.params;
        const userId = req.user.id;

        // Find guest cart
        const guestCart = await Cart.findOne({sessionId, userId: null});

        if (!guestCart || guestCart.items.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No guest cart found or cart is empty'
            });
        }

        // Find or create user cart
        let userCart = await Cart.findOne({userId});

        if (!userCart) {
            userCart = new Cart({
                sessionId,
                userId,
                items: [],
                cartTotal: 0
            });
        }

        // Merge items
        for (const guestItem of guestCart.items) {
            const existingItemIndex = userCart.items.findIndex(item =>
                item.productId.toString() === guestItem.productId.toString() &&
                ((!guestItem.variantId && !item.variantId) ||
                    (guestItem.variantId && item.variantId && item.variantId.toString() === guestItem.variantId.toString()))
            );

            if (existingItemIndex > -1) {
                // Update existing item quantity
                userCart.items[existingItemIndex].quantity += guestItem.quantity;
            } else {
                // Add new item
                userCart.items.push({
                    productId: guestItem.productId,
                    variantId: guestItem.variantId,
                    quantity: guestItem.quantity,
                    price: guestItem.price,
                    finalPrice: guestItem.finalPrice,
                    addedAt: new Date()
                });
            }
        }

        // Recalculate cart total
        userCart.cartTotal = userCart.items.reduce((total, item) => {
            return total + (item.finalPrice * item.quantity);
        }, 0);

        // Apply coupon if exists in guest cart
        if (guestCart.couponCode) {
            const coupon = await Coupon.findOne({code: guestCart.couponCode});
            if (coupon) {
                userCart.couponCode = guestCart.couponCode;
                userCart.discount = guestCart.discount;
                userCart.cartTotal -= userCart.discount;
            }
        }

        await userCart.save();

        // Delete guest cart
        await Cart.deleteOne({_id: guestCart._id});

        return res.status(200).json({
            success: true,
            message: 'Carts merged successfully',
            data: userCart
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error merging carts',
            error: error.message
        });
    }
};