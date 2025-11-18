const Cart = require('../../models/cartManagement/cartModel');
const Product = require('../../models/productCatalog/ProductModel');
const Variant = require('../../models/productCatalog/productVariantModel');
const Coupon = require('../../models/offersAndDiscounts/couponModel');
const ProductPricing = require('../../models/productPricingAndTaxation/productPricingModel')
const UserAddress = require('../../models/shipping/userAddressModel');
const ShippingZone = require("../../models/shipping/shippingZoneModel");

exports.getCart = async (req, res) => {
    try {
        const { sessionId, addressId } = req.query;
        const userId = req.user ? req.user.id : null;

        if (!sessionId && !userId) {
            return res.status(400).json({
                success: false,
                message: "Either sessionId or user is required"
            });
        }

        const query = userId && sessionId
            ? { $or: [{ sessionId }, { userId }] }
            : userId ? { userId } : { sessionId };

        const cart = await Cart.findOne(query).lean();
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found"
            });
        }

        // -------------------------------------------------------
        //  RESOLVE ADDRESS
        // -------------------------------------------------------
        let resolvedAddress = null;

        if (addressId && userId) {
            resolvedAddress = await UserAddress.findOne({ _id: addressId, userId }).lean();
        }

        if (!resolvedAddress && userId) {
            resolvedAddress = await UserAddress.findOne({
                userId,
                isDefault: true
            }).lean();
        }

        if (resolvedAddress) {
            resolvedAddress = {
                country: resolvedAddress.country,
                state: resolvedAddress.state,
                pincode: resolvedAddress.pincode
            };
        }

        // -------------------------------------------------------
        //  MARKET FEES
        // -------------------------------------------------------
        let marketFeesValue = 0;

        if (resolvedAddress) {
            const zone = await ShippingZone.findOne({
                $or: [
                    { pincodes: resolvedAddress.pincode },
                    { states: resolvedAddress.state },
                    { countries: resolvedAddress.country }
                ]
            }).lean();

            if (zone) {
                marketFeesValue = Number(zone.marketFees || 0);
            }
        }

        // -------------------------------------------------------
        //  POPULATE CART ITEMS
        // -------------------------------------------------------
        const populatedItems = await Promise.all(
            cart.items.map(async (item) => {
                const product = await Product.findById(item.productId)
                    .select("title thumbnail price shipping")
                    .lean();

                const variant = item.variantId
                    ? await Variant.findById(item.variantId)
                        .select("price sku stock")
                        .lean()
                    : null;

                // Pricing priority: Variant → Product → Stored Final
                const price =
                    variant?.price ??
                    product?.price ??
                    item.finalPrice;

                const subtotal = item.finalPrice * item.quantity;

                // Shipping charged once per product
                const shippingCharge =
                    item.shippingCharge ??
                    Number(product?.shipping?.cost || 0);

                return {
                    ...item,
                    product,
                    variant,
                    price,
                    subtotal,
                    shippingCharge,
                    shippingTotal: shippingCharge
                };
            })
        );

        // -------------------------------------------------------
        //  TOTALS
        // -------------------------------------------------------
        const subtotal = populatedItems.reduce(
            (sum, x) => sum + x.subtotal,
            0
        );

        const shippingTotal = populatedItems.reduce(
            (sum, x) => sum + (x.shippingTotal || 0),
            0
        );

        const discount = cart.discount ?? 0;

        const totalPayable = Math.max(
            subtotal + shippingTotal + marketFeesValue - discount,
            0
        );
        console.log(subtotal)
        // -------------------------------------------------------
        //  RESPONSE
        // -------------------------------------------------------
        return res.status(200).json({
            success: true,
            message: "Cart retrieved",
            data: {
                cartId: cart._id,
                sessionId: cart.sessionId,
                userId: cart.userId,
                items: populatedItems,
                totals: {
                    subtotal,
                    shipping: shippingTotal,
                    discount,
                    marketplaceFees: marketFeesValue,
                    totalPayable
                }
            }
        });

    } catch (error) {
        console.error("Cart error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

/**
 * Add item to cart
 */
exports.addItem = async (req, res) => {
    try {
        const { productId, variantId, quantity, sessionId } = req.body;
        const userId = req.user ? req.user.id : null;

        if (!sessionId) {
            return res.status(400).json({ success: false, message: "Session ID is required" });
        }
        if (!productId) {
            return res.status(400).json({ success: false, message: "Product ID is required" });
        }

        const qty = Number(quantity);
        if (!qty || qty <= 0) {
            return res.status(400).json({ success: false, message: "Quantity must be positive" });
        }

        // PRODUCT
        const product = await Product.findById(productId).lean();
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const shippingCharge = Number(product?.shipping?.cost || 0);

        // VARIANT
        let variant = null;
        if (variantId) {
            variant = await Variant.findOne({ _id: variantId, productId }).lean();
            if (!variant) {
                return res.status(404).json({ success: false, message: "Variant not found for this product" });
            }
        }

        // PRICING
        let pricing = null;

        if (variantId) {
            pricing = await ProductPricing.findOne({
                productId,
                variantId,
                status: true
            }).lean();
        }

        if (!pricing) {
            pricing = await ProductPricing.findOne({
                productId,
                variantId: null,
                status: true
            }).lean();
        }

        if (!pricing) {
            return res.status(404).json({ success: false, message: "Pricing not found" });
        }

        const basePrice = Number(pricing.basePrice || 0);
        const finalPrice = Number(pricing.finalPrice || basePrice);

        // CART
        let cart = await Cart.findOne({ sessionId });
        if (!cart) {
            cart = new Cart({
                sessionId,
                userId,
                items: [],
                cartTotal: 0
            });
        } else if (userId && !cart.userId) {
            cart.userId = userId;
        }

        // EXISTING ITEM?
        const existingItemIndex = cart.items.findIndex(item =>
            item.productId.toString() === productId &&
            ((!variantId && !item.variantId) ||
                (variantId && item.variantId?.toString() === variantId))
        );

        if (existingItemIndex > -1) {
            // UPDATE
            const existing = cart.items[existingItemIndex];
            existing.quantity += qty;
            existing.finalPrice = finalPrice;
            existing.price = basePrice;
            existing.shippingCharge = shippingCharge; // updated field
        } else {
            // ADD
            cart.items.push({
                productId,
                variantId: variantId || null,
                quantity: qty,
                price: basePrice,
                finalPrice,
                shippingCharge, // matches schema
                addedAt: new Date()
            });
        }

        // RECALCULATE CART TOTAL (no shipping included here)
        cart.cartTotal = cart.items.reduce((total, item) => {
            return total + Number(item.finalPrice) * Number(item.quantity);
        }, 0);

        // APPLY COUPON
        if (cart.couponCode) {
            await this.applyCouponToCart(cart, cart.couponCode);
        }

        await cart.save();

        return res.status(200).json({
            success: true,
            message: "Item added to cart",
            data: cart
        });

    } catch (error) {
        console.error("Add to cart error:", error);
        return res.status(500).json({
            success: false,
            message: "Error adding item to cart",
            error: error.message
        });
    }
};

/**
 * Update item quantity in cart
 */
exports.updateItemQuantity = async (req, res) => {
    try {
        const {itemId} = req.params;
        const {sessionId, quantity} = req.body;

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
            item._id.toString() === itemId
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
            await this.applyCouponToCart(cart, cart.couponCode);
        }

        await cart.save();

        return res.status(200).json({
            success: true,
            message: 'Item quantity updated',
            data: cart
        });
    } catch (error) {
        console.error('Error updating cart item:', error);
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

        const {productId, variantId, sessionId} = req.body;
        console.log(req.body)
        console.log(sessionId)

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
            await this.applyCouponToCart(cart, cart.couponCode);
        }

        await cart.save();

        return res.status(200).json({
            success: true,
            message: 'Item removed from cart',
            data: cart
        });
    } catch (error) {
        console.error('Error removing item from cart:', error);
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
        const {couponCode, sessionId} = req.body;

        // Input validation
        if (!couponCode || typeof couponCode !== 'string' || couponCode.trim() === '') {
            return res.status(200).json({
                success: false,
                message: 'Valid coupon code is required',
                errorType: 'INVALID_COUPON_CODE'
            });
        }

        if (!sessionId) {
            return res.status(200).json({
                success: false,
                message: 'Session ID is required',
                errorType: 'MISSING_SESSION_ID'
            });
        }

        const trimmedCouponCode = couponCode.trim().toUpperCase();

        // Find cart with sessionId
        let cart = await Cart.findOne({sessionId}).populate('items.productId');

        if (!cart) {
            return res.status(200).json({
                success: false,
                message: 'Cart not found or expired',
                errorType: 'CART_NOT_FOUND'
            });
        }

        // Check if cart is empty
        if (!cart.items || cart.items.length === 0) {
            return res.status(200).json({
                success: false,
                message: 'Cannot apply coupon to empty cart',
                errorType: 'EMPTY_CART'
            });
        }

        // Check if coupon is already applied
        if (cart.couponCode === trimmedCouponCode) {
            return res.status(200).json({
                success: false,
                message: 'Coupon is already applied to this cart',
                errorType: 'COUPON_ALREADY_APPLIED'
            });
        }

        // Find active coupon
        const coupon = await Coupon.findOne({
            code: trimmedCouponCode,
            status: 'active',
            startDate: {$lte: new Date()},
            endDate: {$gte: new Date()}
        });

        if (!coupon) {
            return res.status(200).json({
                success: false,
                message: 'Invalid, expired, or inactive coupon code',
                errorType: 'COUPON_NOT_FOUND'
            });
        }

        // Check coupon usage limits
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(200).json({
                success: false,
                message: 'Coupon usage limit has been reached',
                errorType: 'USAGE_LIMIT_REACHED'
            });
        }

        // Calculate subtotal from valid items only
        const subtotal = cart.items.reduce((total, item) => {
            return total + (item.finalPrice * item.quantity);
        }, 0);

        if (subtotal <= 0) {
            return res.status(200).json({
                success: false,
                message: 'Cannot apply coupon to cart with no valid items',
                errorType: 'NO_VALID_ITEMS'
            });
        }

        // Check minimum order value
        if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
            return res.status(200).json({
                success: false,
                message: `Minimum order value of ₹${coupon.minOrderAmount} required for this coupon`,
                errorType: 'MIN_ORDER_VALUE_NOT_MET',
                requiredAmount: coupon.minOrderAmount,
                currentAmount: subtotal
            });
        }

        // Check category restrictions
        if (coupon.allowedCategories && coupon.allowedCategories.length > 0) {
            const hasAllowedCategory = cart.items.some(item => {
                const itemCategoryIds = item.productId.categoryIds || [];
                return itemCategoryIds.some(catId =>
                    coupon.allowedCategories.includes(catId.toString())
                );
            });

            if (!hasAllowedCategory) {
                return res.status(200).json({
                    success: false,
                    message: 'This coupon is not applicable to products in your cart',
                    errorType: 'CATEGORY_RESTRICTION'
                });
            }
        }

        // Calculate discount based on coupon type
        let discount = 0;
        let discountDetails = {};

        if (coupon.type === 'percent') {
            const percentageDiscount = (subtotal * coupon.value) / 100;

            // Apply max discount if set
            if (coupon.maxDiscount && percentageDiscount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
                discountDetails = {
                    type: 'percentage',
                    originalDiscount: percentageDiscount,
                    capped: true,
                    maxDiscount: coupon.maxDiscount
                };
            } else {
                discount = percentageDiscount;
                discountDetails = {
                    type: 'percentage',
                    value: coupon.value,
                    capped: false
                };
            }
        } else if (coupon.type === 'flat') {
            // Fixed amount discount
            discount = Math.min(coupon.value, subtotal);
            discountDetails = {
                type: 'fixed',
                value: coupon.value,
                applied: discount
            };
        } else {
            return res.status(200).json({
                success: false,
                message: 'Invalid coupon discount type',
                errorType: 'INVALID_DISCOUNT_TYPE'
            });
        }

        // Ensure discount doesn't make total negative
        discount = Math.max(0, Math.min(discount, subtotal));

        // Calculate final total
        const cartTotal = Math.max(0, subtotal - discount);

        // Update cart with coupon information
        cart.couponCode = trimmedCouponCode;
        cart.discount = discount;
        cart.cartTotal = cartTotal;
        cart.discountDetails = discountDetails;
        cart.couponAppliedAt = new Date();

        // Increment coupon usage count
        await Coupon.findByIdAndUpdate(coupon._id, {
            $inc: {usedCount: 1}
        });

        await cart.save();
        console.log(cart)
        return res.status(200).json({
            success: true,
            message: 'Coupon applied successfully',
            data: {
                cart,
                discount: {
                    amount: discount,
                    type: coupon.type,
                    couponCode: trimmedCouponCode,
                    details: discountDetails
                },
                summary: {
                    subtotal,
                    discount,
                    total: cartTotal,
                    savings: ((discount / subtotal) * 100).toFixed(1) + '%',
                    savingsAmount: discount
                }
            }
        });

    } catch (error) {
        console.error('Apply coupon error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error while applying coupon',
            errorType: 'INTERNAL_SERVER_ERROR'
        });
    }
};

/**
 * Helper function to apply coupon to cart (internal use)
 */
exports.applyCouponToCart = async (cart, couponCode) => {
    try {
        const coupon = await Coupon.findOne({
            code: couponCode,
            status: 'active',
            startDate: {$lte: new Date()},
            endDate: {$gte: new Date()}
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
};

/**
 * Remove coupon from cart
 */
exports.removeCoupon = async (req, res) => {
    try {
        const {sessionId} = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required'
            });
        }

        const cart = await Cart.findOne({sessionId});

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        if (!cart.couponCode) {
            return res.status(400).json({
                success: false,
                message: 'No coupon applied to this cart'
            });
        }

        // Reset coupon-related fields and recalculate total
        const subtotal = cart.items.reduce((total, item) => {
            return total + (item.finalPrice * item.quantity);
        }, 0);

        cart.couponCode = null;
        cart.discount = 0;
        cart.cartTotal = subtotal;
        cart.discountDetails = null;
        cart.couponAppliedAt = null;

        await cart.save();

        return res.status(200).json({
            success: true,
            message: 'Coupon removed successfully',
            data: cart
        });

    } catch (error) {
        console.error('Remove coupon error:', error);
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
        console.error('Clear cart error:', error);
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
            userCart.couponCode = guestCart.couponCode;
            userCart.discount = guestCart.discount;
            userCart.cartTotal -= userCart.discount;
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
        console.error('Merge cart error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error merging carts',
            error: error.message
        });
    }
};