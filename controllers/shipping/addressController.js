const UserAddress = require('../../models/shipping/userAddressModel');

// Get all addresses for the logged-in user
exports.getMyAddresses = async (req, res) => {
    try {
        const userId = req.user.id;
        const addresses = await UserAddress.find({userId})
            .sort({isDefault: -1, updatedAt: -1})
            .lean();

        res.status(200).json({
            success: true,
            message: 'Addresses retrieved successfully',
            count: addresses.length,
            data: addresses,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message || 'Failed to fetch addresses',
        });
    }
};

// Get a specific address by ID
exports.getAddressById = async (req, res) => {
    try {
        const userId = req.user.id;
        const address = await UserAddress.findOne({
            _id: req.params.id,
            userId,
        }).lean();

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Address retrieved successfully',
            data: address,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message || 'Invalid address ID',
        });
    }
};

// Create a new address
exports.createAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            name,
            phone,
            address,
            city,
            state,
            pincode,
            country,
            type,
            isDefault,
        } = req.body;

        if (!name || !phone || !address || !city || !state || !pincode || !country) {
            return res.status(400).json({
                success: false,
                message: 'All required address fields must be provided',
            });
        }

        const doc = await UserAddress.create({
            userId,
            name,
            phone,
            address,
            city,
            state,
            pincode,
            country,
            type,
            isDefault: !!isDefault,
        });

        if (isDefault) {
            await UserAddress.setDefaultForUser(userId, doc._id);
        }

        res.status(201).json({
            success: true,
            message: 'Address created successfully',
            data: doc,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message || 'Failed to create address',
        });
    }
};

// Update an existing address
exports.updateAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            name,
            phone,
            address,
            city,
            state,
            pincode,
            country,
            type,
            isDefault,
        } = req.body;

        const doc = await UserAddress.findOneAndUpdate(
            {_id: req.params.id, userId},
            {
                $set: {
                    name,
                    phone,
                    address,
                    city,
                    state,
                    pincode,
                    country,
                    type,
                    isDefault,
                },
            },
            {new: true}
        );

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        if (isDefault === true) {
            await UserAddress.setDefaultForUser(userId, doc._id);
        }

        res.status(200).json({
            success: true,
            message: 'Address updated successfully',
            data: doc,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message || 'Failed to update address',
        });
    }
};

// Delete an address
exports.deleteAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const doc = await UserAddress.findOneAndDelete({
            _id: req.params.id,
            userId,
        });

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Address deleted successfully',
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message || 'Failed to delete address',
        });
    }
};

// Set a default address
exports.setDefault = async (req, res) => {
    try {
        const userId = req.user.id;
        const address = await UserAddress.findOne({
            _id: req.params.id,
            userId,
        });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        await UserAddress.setDefaultForUser(userId, address._id);

        res.status(200).json({
            success: true,
            message: 'Default address updated successfully',
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message || 'Failed to set default address',
        });
    }
};

// Select an address for checkout
exports.selectForCheckout = async (req, res) => {
    try {
        const userId = req.user.id;
        const address = await UserAddress.findOne({
            _id: req.params.id,
            userId,
        }).lean();

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        const shippingAddress = {
            name: address.name,
            phone: address.phone,
            address: address.address,
            city: address.city,
            state: address.state,
            postalCode: address.pincode,
            country: address.country,
        };

        res.status(200).json({
            success: true,
            message: 'Address selected for checkout',
            data: shippingAddress,
        });
    } catch (err) {
        res.status(400).json({
            success: false,
            message: err.message || 'Failed to select address for checkout',
        });
    }
};
