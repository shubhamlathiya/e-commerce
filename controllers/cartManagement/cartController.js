const Cart = require('../../models/cartManagement/cartModel');
const Product = require('../../models/productCatalog/ProductModel');
const ProductVariant = require('../../models/productCatalog/productVariantModel');
const Coupon = require('../../models/offersAndDiscounts/couponModel');
const ProductPricing = require('../../models/productPricingAndTaxation/productPricingModel')
const UserAddress = require('../../models/shipping/userAddressModel');
const ShippingZone = require("../../models/shipping/shippingZoneModel");
const TierPricing = require('../../models/productPricingAndTaxation/tierPricingModel'); // Add this import
const User = require('../../models/auth/userModel');


exports.getCart = async (req, res) => {
    try {
        const { sessionId, addressId } = req.query;
        const userId = req.user ? req.user.id : null;

        // Detect business user
        const isBusinessUser =
            (req.user && req.user.loginType === "business") ||
            req.query.loginType === "business";

        if (!sessionId && !userId) {
            return res.status(400).json({
                success: false,
                message: "Either sessionId or userId is required"
            });
        }

        const query =
            userId && sessionId
                ? { userId, sessionId }
                : sessionId
                    ? { sessionId }
                    : { userId };

        const cart = await Cart.findOne(query)
            .populate({
                path: "items.productId",
                select: "title images price finalPrice brandId categoryIds description sku stock shipping",
                populate: { path: "brandId", select: "name logo" }
            })
            .populate({
                path: "items.variantId",
                model: "ProductVariant",
                select: "attributes price stock sku images"
            })
            .lean();

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        if (!cart.items?.length) {
            return res.status(200).json({
                success: true,
                message: "Cart is empty",
                data: { items: [], totals: {} }
            });
        }

        // Resolve address safely
        let resolvedAddress = null;

        if (userId) {
            if (addressId) {
                resolvedAddress = await UserAddress.findOne({ _id: addressId, userId }).lean();
            }
            if (!resolvedAddress) {
                resolvedAddress = await UserAddress.findOne({ userId, isDefault: true }).lean();
            }
        }

        if (resolvedAddress) {
            resolvedAddress = {
                country: resolvedAddress.country?.trim().toLowerCase(),
                state: resolvedAddress.state?.trim().toLowerCase(),
                pincode: resolvedAddress.pincode?.trim()
            };
        }

        // Determine shipping zone
        let marketFeesValue = 0;
        let zone = null;

        if (resolvedAddress) {
            zone = await ShippingZone.findOne({ pincodes: resolvedAddress.pincode }).lean();

            if (!zone) {
                zone = await ShippingZone.findOne({
                    states: {
                        $in: [
                            resolvedAddress.state,
                            resolvedAddress.state?.charAt(0).toUpperCase() + resolvedAddress.state?.slice(1)
                        ]
                    }
                }).lean();
            }

            if (!zone) {
                zone = await ShippingZone.findOne({
                    countries: {
                        $in: [
                            resolvedAddress.country,
                            resolvedAddress.country?.charAt(0).toUpperCase() + resolvedAddress.country?.slice(1)
                        ]
                    }
                }).lean();
            }
        }

        if (zone) {
            marketFeesValue = Number(zone.marketFees || 0);
        }

        let subtotal = 0;
        let shippingTotal = 0;

        // Map cart items
        const items = await Promise.all(
            cart.items.map(async (item) => {
                const product = item.productId || {};
                const variant = item.variantId || {};

                const image = variant.images?.[0] || product.images?.[0] || null;

                let unitPrice =
                    item.finalPrice ??
                    variant.price ??
                    product.finalPrice ??
                    product.price ??
                    0;

                // Business tier pricing
                if (isBusinessUser) {
                    const tier = await TierPricing.findOne({
                        productId: item.productId?._id,
                        variantId: item.variantId?._id || null,
                        minQty: { $lte: item.quantity },
                        maxQty: { $gte: item.quantity }
                    }).lean();

                    if (tier) unitPrice = tier.price;
                }

                const finalPrice = unitPrice * item.quantity;
                subtotal += finalPrice;

                const shippingCharge = Number(product?.shipping?.cost || 0);
                shippingTotal += shippingCharge;

                const variantAttributes = (variant.attributes || [])
                    .map(a => `${a.name}: ${a.value}`)
                    .join(", ");

                return {
                    _id: item._id,
                    productId: product._id,
                    variantId: variant._id || null,
                    quantity: item.quantity,
                    name: product.title,
                    image,
                    sku: variant.sku || product.sku,
                    unitPrice,
                    finalPrice,
                    subtotal: finalPrice,
                    variantAttributes,
                    shippingCharge,
                    product,
                    variant
                };
            })
        );

        // Totals
        const discount = Number(cart.discount || 0);
        const taxRate = 0.05;
        const tax = subtotal * taxRate;

        const totalPayable = Math.max(
            subtotal + shippingTotal + marketFeesValue + tax - discount,
            0
        );

        return res.status(200).json({
            success: true,
            message: "Cart retrieved",
            data: {
                cartId: cart._id,
                userId: cart.userId,
                sessionId: cart.sessionId,
                items,
                userType: isBusinessUser ? "business" : "regular",
                totals: {
                    subtotal,
                    shipping: shippingTotal,
                    marketplaceFees: marketFeesValue,
                    tax,
                    discount,
                    totalPayable
                }
            }
        });

    } catch (error) {
        console.error("Get cart error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

/**
 * Add item to cart with business user tier pricing
 */
exports.addItem = async (req, res) => {
    try {
        const { productId, variantId, quantity, sessionId } = req.body;
        const userId = req.user ? req.user.id : null;

        let isBusinessUser = false;
        if (req.user && req.user.loginType === 'business') {
            isBusinessUser = true;
        } else if (req.body.loginType === 'business') {
            isBusinessUser = true;
        }

        if (!sessionId) {
            return res.status(400).json({ success: false, message: "Session ID is required" });
        }
        if (!productId) {
            return res.status(400).json({ success: false, message: "Product ID is required" });
        }

        let finalQuantity = Number(quantity);

        // Check minimum quantity for business users
        if (isBusinessUser) {
            const tierPricing = await TierPricing.findOne({
                productId,
                variantId: variantId || null
            }).sort({ minQty: 1 });

            if (tierPricing) {
                const minRequiredQty = tierPricing.minQty;

                // If qty is less than minimum, automatically set it
                if (finalQuantity < minRequiredQty) {
                    console.log(`Business user qty updated from ${finalQuantity} to min tier qty ${minRequiredQty}`);
                    finalQuantity = minRequiredQty;
                }
            }
        }

        if (!finalQuantity || finalQuantity <= 0) {
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
            variant = await ProductVariant.findOne({ _id: variantId, productId }).lean();
            if (!variant) {
                return res.status(404).json({ success: false, message: "Variant not found for this product" });
            }
        }

        // PRICING - Apply tier pricing for business users first
        let finalPrice = 0;
        let basePrice = 0;

        if (isBusinessUser) {
            const tierPricing = await TierPricing.findOne({
                productId,
                variantId: variantId || null,
                minQty: { $lte: finalQuantity },
                maxQty: { $gte: finalQuantity }
            });

            if (tierPricing) {
                finalPrice = tierPricing.price;
                basePrice = tierPricing.price;
            }
        }

        // If no tier pricing found or not business user, use regular pricing
        if (finalPrice === 0) {
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

            basePrice = Number(pricing.basePrice || 0);
            finalPrice = Number(pricing.finalPrice || basePrice);
        }

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
            existing.quantity += finalQuantity;
            existing.finalPrice = finalPrice;
            existing.price = basePrice;
            existing.shippingCharge = shippingCharge;
        } else {
            // ADD
            cart.items.push({
                productId,
                variantId: variantId || null,
                quantity: finalQuantity,
                price: basePrice,
                finalPrice,
                shippingCharge,
                addedAt: new Date()
            });
        }

        // RECALCULATE CART TOTAL
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
            data: cart,
            userType: isBusinessUser ? 'business' : 'regular'
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
 * Update item quantity in cart with business user validation
 */
exports.updateItemQuantity = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { sessionId, quantity } = req.body;
        const userId = req.user ? req.user.id : null;

        // Get loginType from user object or request body
        let isBusinessUser = false;
        if (req.user && req.user.loginType === 'business') {
            isBusinessUser = true;
        } else if (req.body.loginType === 'business') {
            isBusinessUser = true;
        }

        const finalQuantity = Number(quantity);
        if (finalQuantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1'
            });
        }

        let cart = await Cart.findOne({ sessionId });

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

        const item = cart.items[itemIndex];

        // Check minimum quantity for business users
        if (isBusinessUser) {
            const tierPricing = await TierPricing.findOne({
                productId: item.productId,
                variantId: item.variantId || null,
                minQty: { $lte: finalQuantity }
            }).sort({ minQty: -1 });

            if (tierPricing && finalQuantity < tierPricing.minQty) {
                return res.status(400).json({
                    success: false,
                    message: `Minimum quantity for this product is ${tierPricing.minQty} for business users`
                });
            }

            // Apply tier pricing if quantity changes
            const applicableTier = await TierPricing.findOne({
                productId: item.productId,
                variantId: item.variantId || null,
                minQty: { $lte: finalQuantity },
                maxQty: { $gte: finalQuantity }
            });

            if (applicableTier) {
                item.finalPrice = applicableTier.price;
                item.price = applicableTier.price;
            }
        }

        // Update quantity
        item.quantity = finalQuantity;

        // Recalculate cart total
        cart.cartTotal = cart.items.reduce((total, item) => {
            return total + (item.finalPrice * item.quantity);
        }, 0);

        // Check and auto-remove coupon if conditions are not met after quantity update
        let couponAutoRemoved = false;
        if (cart.couponCode) {
            const couponCheck = await this.checkAndAutoRemoveCoupon(cart);
            couponAutoRemoved = couponCheck.removed;
        }

        await cart.save();

        return res.status(200).json({
            success: true,
            message: 'Item quantity updated',
            data: cart,
            userType: isBusinessUser ? 'business' : 'regular',
            couponAutoRemoved: couponAutoRemoved
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
        const { productId, variantId, sessionId, loginType } = req.body;
        const userId = req.user ? req.user.id : null;
        const isBusinessUser = loginType === 'business';

        console.log('Remove item request body:', req.body);

        // Find cart by sessionId
        let cart = await Cart.findOne({ sessionId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Find the item index in the cart
        const itemIndex = cart.items.findIndex(item =>
            item.productId.toString() === productId || String(item.variantId || '') === String(variantId || '')
        );

        if (itemIndex !== -1) {
            // Remove the item from cart
            cart.items.splice(itemIndex, 1);

            // Recalculate cart total
            cart.cartTotal = cart.items.reduce(
                (total, item) => total + (item.finalPrice * item.quantity),
                0
            );

            // Check if coupon should be auto-removed after item removal
            if (cart.couponCode) {
                await this.checkAndAutoRemoveCoupon(cart);
            }

            await cart.save();

            return res.status(200).json({
                success: true,
                message: 'Item removed from cart',
                data: cart,
                userType: isBusinessUser ? 'business' : 'regular',
                couponAutoRemoved: !cart.couponCode // Indicate if coupon was auto-removed
            });
        } else {
            // Item not found, but cart exists
            return res.status(200).json({
                success: true,
                message: 'Item not found in cart, nothing removed',
                data: cart,
                userType: isBusinessUser ? 'business' : 'regular'
            });
        }
    } catch (error) {
        console.error('Error removing item from cart:', error);
        return res.status(500).json({
            success: false,
            message: 'Error removing item from cart',
            error: error.message
        });
    }
};

exports.checkAndAutoRemoveCoupon = async (cart) => {
    try {
        if (!cart.couponCode) {
            return { removed: false, reason: null };
        }

        // Find the applied coupon
        const coupon = await Coupon.findOne({
            code: cart.couponCode,
            status: 'active',
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() }
        });

        if (!coupon) {
            // Coupon no longer valid
            this.removeCouponFromCart(cart, 'COUPON_EXPIRED');
            return { removed: true, reason: 'COUPON_EXPIRED' };
        }

        // Calculate current subtotal
        const subtotal = cart.items.reduce((total, item) => {
            return total + (item.finalPrice * item.quantity);
        }, 0);

        // Check minimum order value
        if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
            this.removeCouponFromCart(cart, 'MIN_ORDER_VALUE_NOT_MET');
            return {
                removed: true,
                reason: 'MIN_ORDER_VALUE_NOT_MET',
                requiredAmount: coupon.minOrderAmount,
                currentAmount: subtotal
            };
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
                this.removeCouponFromCart(cart, 'CATEGORY_RESTRICTION');
                return { removed: true, reason: 'CATEGORY_RESTRICTION' };
            }
        }

        // Check if cart is empty
        if (cart.items.length === 0) {
            this.removeCouponFromCart(cart, 'EMPTY_CART');
            return { removed: true, reason: 'EMPTY_CART' };
        }

        // Recalculate discount based on current cart
        let discount = 0;

        if (coupon.type === 'percent') {
            const percentageDiscount = (subtotal * coupon.value) / 100;
            discount = coupon.maxDiscount && percentageDiscount > coupon.maxDiscount
                ? coupon.maxDiscount
                : percentageDiscount;
        } else if (coupon.type === 'flat') {
            discount = Math.min(coupon.value, subtotal);
        }

        // Update cart with new discount and total
        cart.discount = discount;
        cart.cartTotal = Math.max(0, subtotal - discount);

        return { removed: false, reason: null };

    } catch (error) {
        console.error('Error checking coupon validity:', error);
        // If there's an error checking coupon, remove it for safety
        this.removeCouponFromCart(cart, 'VALIDATION_ERROR');
        return { removed: true, reason: 'VALIDATION_ERROR' };
    }
};

/**
 * Helper function to remove coupon from cart
 */
exports.removeCouponFromCart = (cart, reason) => {
    const couponCode = cart.couponCode;

    cart.couponCode = null;
    cart.discount = 0;
    cart.discountDetails = null;
    cart.couponAppliedAt = null;

    // Recalculate total without coupon
    const subtotal = cart.items.reduce((total, item) => {
        return total + (item.finalPrice * item.quantity);
    }, 0);

    cart.cartTotal = subtotal;

    console.log(`Coupon ${couponCode} auto-removed due to: ${reason}`);
};

/**
 * Apply coupon to cart
 */
exports.applyCoupon = async (req, res) => {
    try {
        const {couponCode, sessionId , loginType} = req.body;
        const userId = req.user ? req.user.id : null;
        const isBusinessUser = loginType === 'business';

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
            },
            userType: isBusinessUser ? 'business' : 'regular'
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
        const {sessionId , loginType} = req.body;
        const userId = req.user ? req.user.id : null;
        const isBusinessUser = loginType === 'business';

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
            data: cart,
            userType: isBusinessUser ? 'business' : 'regular'
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