const ProductPricing = require('../../models/productPricingAndTaxation/productPricingModel');
const TierPricing = require('../../models/productPricingAndTaxation/tierPricingModel');
const SpecialPricing = require('../../models/productPricingAndTaxation/specialPricingModel');
const Product = require('../../models/productCatalog/ProductModel');
const ProductVariant = require('../../models/productCatalog/productVariantModel');
const FlashSale = require('../../models/offersAndDiscounts/flashSaleModel');
const CurrencyRate = require('../../models/productPricingAndTaxation/currencyRateModel');
const TaxRule = require('../../models/productPricingAndTaxation/taxRuleModel');

// Product Pricing CRUD
exports.upsertProductPricing = async (req, res) => {
    try {
        const {productId, variantId, basePrice, discountType, discountValue, currency, status} = req.body;
        const product = await Product.findById(productId).lean();
        if (!product) return res.status(400).json({message: 'Invalid productId'});
        if (variantId) {
            const variant = await ProductVariant.findById(variantId).lean();
            if (!variant) return res.status(400).json({message: 'Invalid variantId'});
        }

        const doc = await ProductPricing.findOneAndUpdate(
            {productId, variantId: variantId || null},
            {productId, variantId: variantId || null, basePrice, discountType, discountValue, currency, status},
            {upsert: true, new: true, runValidators: true}
        ).lean();
        res.json(doc);
    } catch (err) {
        res.status(400).json({message: err.message});
    }
};

exports.getProductPricing = async (req, res) => {
    try {
        const { productId, variantId } = req.query;

        // If no productId provided → return all pricing records
        if (!productId) {
            const allPricing = await ProductPricing.find().lean();
            return res.json(allPricing);
        }

        // Build query filter
        const query = { productId };
        if (variantId) query.variantId = variantId;
        else query.variantId = null;

        const doc = await ProductPricing.findOne(query).lean();

        // If not found, return all pricing data for that product
        if (!doc) {
            const allForProduct = await ProductPricing.find({ productId }).lean();
            if (!allForProduct.length)
                return res.status(404).json({ message: "No pricing found for this product" });
            return res.json(allForProduct);
        }

        // Found a specific record
        res.json(doc);
    } catch (err) {
        console.error("Get product pricing error:", err);
        res.status(500).json({ message: err.message || "Server error" });
    }
};

exports.deleteProductPricing = async (req, res) => {
    try {
        const {productId, variantId} = req.query;
        const q = {productId};
        if (variantId) q.variantId = variantId; else q.variantId = null;
        const doc = await ProductPricing.findOneAndDelete(q).lean();
        if (!doc) return res.status(404).json({message: 'Pricing not found'});
        res.json({message: 'Pricing deleted', productId, variantId: variantId || null});
    } catch (err) {
        res.status(400).json({message: err.message});
    }
};

// Tier Pricing CRUD
exports.createTier = async (req, res) => {
    try {
        const {productId, variantId, minQty, maxQty, price} = req.body;
        const product = await Product.findById(productId).lean();
        if (!product) return res.status(400).json({message: 'Invalid productId'});
        if (variantId) {
            const variant = await ProductVariant.findById(variantId).lean();
            if (!variant) return res.status(400).json({message: 'Invalid variantId'});
        }
        const doc = await TierPricing.create({productId, variantId: variantId || null, minQty, maxQty, price});
        res.status(201).json(doc);
    } catch (err) {
        res.status(400).json({message: err.message});
    }
};

exports.listTiers = async (req, res) => {
    try {
        const {productId, variantId} = req.query;
        const q = {};
        if (productId) q.productId = productId;
        if (variantId) q.variantId = variantId;
        const items = await TierPricing.find(q).sort({minQty: 1}).lean();
        res.json(items);
    } catch (err) {
        res.status(400).json({message: err.message});
    }
};

exports.deleteTier = async (req, res) => {
    try {
        const {id} = req.params;
        const doc = await TierPricing.findByIdAndDelete(id).lean();
        if (!doc) return res.status(404).json({message: 'Tier not found'});
        res.json({message: 'Tier deleted', id});
    } catch (err) {
        res.status(400).json({message: err.message});
    }
};

// Special Pricing CRUD
exports.createSpecial = async (req, res) => {
    try {
        const {productId, variantId, specialPrice, startDate, endDate, status = true} = req.body;
        const product = await Product.findById(productId).lean();
        if (!product) return res.status(400).json({message: 'Invalid productId'});
        if (variantId) {
            const variant = await ProductVariant.findById(variantId).lean();
            if (!variant) return res.status(400).json({message: 'Invalid variantId'});
        }
        const doc = await SpecialPricing.create({
            productId,
            variantId: variantId || null,
            specialPrice,
            startDate,
            endDate,
            status
        });
        res.status(201).json(doc);
    } catch (err) {
        res.status(400).json({message: err.message});
    }
};

exports.listSpecials = async (req, res) => {
    try {
        const {productId, variantId, active} = req.query;
        const now = new Date();
        const q = {};
        if (productId) q.productId = productId;
        if (variantId) q.variantId = variantId;
        if (String(active) === 'true') q.$and = [{startDate: {$lte: now}}, {endDate: {$gte: now}}, {status: true}];
        const items = await SpecialPricing.find(q).sort({startDate: -1}).lean();
        res.json(items);
    } catch (err) {
        res.status(400).json({message: err.message});
    }
};

exports.deleteSpecial = async (req, res) => {
    try {
        const {id} = req.params;
        const doc = await SpecialPricing.findByIdAndDelete(id).lean();
        if (!doc) return res.status(404).json({message: 'Special pricing not found'});
        res.json({message: 'Special pricing deleted', id});
    } catch (err) {
        res.status(400).json({message: err.message});
    }
};

// Resolve effective price for a product/variant with optional qty, currency, and tax
exports.resolvePrice = async (req, res) => {
    try {
        const {
            productId,
            variantId,
            qty = 1,
            currency,
            country,
            state,
            includeTax = true,
        } = req.query;

        // Validate product/variant existence
        const product = await Product.findById(productId).lean();
        if (!product) return res.status(400).json({message: 'Invalid productId'});
        if (variantId) {
            const variant = await ProductVariant.findById(variantId).lean();
            if (!variant) return res.status(400).json({message: 'Invalid variantId'});
        }

        // Base pricing
        const pricingQuery = {productId, variantId: variantId || null};
        const pricingDoc = await ProductPricing.findOne(pricingQuery).lean();
        if (!pricingDoc) return res.status(404).json({message: 'Pricing not found for product/variant'});

        const breakdown = {
            productId,
            variantId: variantId || null,
            currency: pricingDoc.currency,
            qty: Number(qty),
            basePrice: Number(pricingDoc.finalPrice),
            applied: {
                flashSale: null,
                special: null,
                tier: null,
                tax: null,
                currencyRate: null,
            },
        };

        let price = breakdown.basePrice;
        const now = new Date();

        // Flash sale override if running
        const runningSale = await FlashSale.findOne({
            status: 'running',
            startDate: {$lte: now},
            endDate: {$gte: now},
            products: {
                $elemMatch: {
                    productId,
                    ...(variantId ? {variantId} : {}),
                },
            },
        }).lean();
        if (runningSale) {
            const item = runningSale.products.find(p => String(p.productId) === String(productId) && (!variantId || String(p.variantId) === String(variantId)));
            if (item) {
                breakdown.applied.flashSale = {saleId: runningSale._id, flashPrice: Number(item.flashPrice)};
                price = Number(item.flashPrice);
            }
        }

        // Special pricing override if active and no flash sale applied
        if (!breakdown.applied.flashSale) {
            const special = await SpecialPricing.findOne({
                productId,
                variantId: variantId || null,
                status: true,
                startDate: {$lte: now},
                endDate: {$gte: now},
            }).lean();
            if (special) {
                breakdown.applied.special = {specialId: special._id, specialPrice: Number(special.specialPrice)};
                price = Number(special.specialPrice);
            }
        }

        // Tier pricing per quantity if provided
        const qtyNum = Number(qty) || 1;
        const tier = await TierPricing.findOne({
            productId,
            ...(variantId ? {variantId} : {}),
            minQty: {$lte: qtyNum},
            maxQty: {$gte: qtyNum},
        }).sort({minQty: -1}).lean();
        if (tier) {
            breakdown.applied.tier = {tierId: tier._id, price: Number(tier.price), range: [tier.minQty, tier.maxQty]};
            price = Number(tier.price);
        }

        // Tax application (single matching rule with highest specificity)
        let taxAmount = 0;
        if (String(includeTax) === 'true') {
            const taxRule = await (async () => {
                if (country && state) {
                    const r = await TaxRule.findOne({country, state}).lean();
                    if (r) return r;
                }
                if (country) {
                    const r = await TaxRule.findOne({country, state: {$in: [null, undefined, '']}}).lean();
                    if (r) return r;
                }
                return await TaxRule.findOne({
                    country: {$in: [null, undefined, '']},
                    state: {$in: [null, undefined, '']}
                }).lean();
            })();

            if (taxRule) {
                if (taxRule.type === 'percentage') {
                    taxAmount = Number((price * (Number(taxRule.value) / 100)).toFixed(2));
                } else if (taxRule.type === 'fixed') {
                    taxAmount = Number(Number(taxRule.value).toFixed(2));
                }
                breakdown.applied.tax = {
                    ruleId: taxRule._id,
                    type: taxRule.type,
                    value: Number(taxRule.value),
                    amount: taxAmount
                };
                price = Number((price + taxAmount).toFixed(2));
            }
        }

        // Currency conversion if requested
        if (currency && currency !== breakdown.currency) {
            const rateDoc = await CurrencyRate.findOne({from: breakdown.currency, to: currency}).lean();
            if (!rateDoc) return res.status(404).json({message: `Conversion rate ${breakdown.currency}->${currency} not found`});
            breakdown.applied.currencyRate = {from: breakdown.currency, to: currency, rate: Number(rateDoc.rate)};
            price = Number((price * Number(rateDoc.rate)).toFixed(2));
            breakdown.currency = currency;
        }

        breakdown.finalPrice = price;
        res.json(breakdown);
    } catch (err) {
        res.status(400).json({message: err.message});
    }
};
