const ShippingZone = require("../models/shipping/shippingZoneModel");

exports.calculateShipping = async (items, address) => {
    if (!address) {
        return {shippingTotal: 0, marketFees: 0};
    }

    // Find shipping zone
    const zone = await ShippingZone.findOne({
        $or: [
            {pincodes: address.pincode},
            {states: address.state},
            {countries: address.country}
        ]
    }).lean();

    let marketFees = zone?.marketFees || 0;

    // Per-product shipping = product.shippingCharge * qty
    let shippingTotal = items.reduce((sum, item) => {
        return sum + (Number(item.shippingCharge) * Number(item.quantity));
    }, 0);

    return {shippingTotal, marketFees};
};
