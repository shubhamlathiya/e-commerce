const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const AppleStrategy = require('passport-apple');
const User = require('../models/auth/userModel');
const SocialAccount = require('../models/auth/socialAccountModel');
const Role = require('../models/auth/roleModel');

/**
 * Initialize and configure Passport strategies
 */
module.exports = function () {
    // Google OAuth Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_REDIRECT_URI,
        passReqToCallback: true
    }, async (req, accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists with this social account
            let socialAccount = await SocialAccount.findOne({
                provider: 'google',
                providerId: profile.id
            });

            let user;

            if (socialAccount) {
                // User exists, get user
                user = await User.findById(socialAccount.userId);

                if (!user) {
                    return done(new Error('Associated user not found'), null);
                }
            } else {
                // Check if user exists with same email
                const email = profile.emails && profile.emails[0] && profile.emails[0].value;

                if (email) {
                    user = await User.findOne({email});
                }

                if (user) {
                    // Link social account to existing user
                    socialAccount = await SocialAccount.create({
                        userId: user._id,
                        provider: 'google',
                        providerId: profile.id,
                        providerData: {
                            email: email,
                            name: profile.displayName,
                            picture: profile.photos && profile.photos[0] && profile.photos[0].value
                        }
                    });
                } else {
                    // Get default user role
                    let userRole = await Role.findOne({name: 'user'});
                    if (!userRole) {
                        // Create default user role if it doesn't exist
                        userRole = await Role.create({
                            name: 'user',
                            displayName: 'User',
                            description: 'Regular user with standard privileges'
                        });
                    }

                    // Create new user
                    user = await User.create({
                        email: email,
                        name: profile.displayName,
                        roles: [userRole.name],
                        status: 'active',
                        emailVerified: true, // Email is verified by Google
                        profile: {
                            picture: profile.photos && profile.photos[0] && profile.photos[0].value
                        }
                    });

                    // Create social account
                    socialAccount = await SocialAccount.create({
                        userId: user._id,
                        provider: 'google',
                        providerId: profile.id,
                        providerData: {
                            email: email,
                            name: profile.displayName,
                            picture: profile.photos && profile.photos[0] && profile.photos[0].value
                        }
                    });
                }
            }

            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));

    // Facebook OAuth Strategy
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_REDIRECT_URI,
        profileFields: ['id', 'email', 'name'],
        passReqToCallback: true
    }, async (req, accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists with this social account
            let socialAccount = await SocialAccount.findOne({
                provider: 'facebook',
                providerId: profile.id
            });

            let user;

            if (socialAccount) {
                // User exists, get user
                user = await User.findById(socialAccount.userId);

                if (!user) {
                    return done(new Error('Associated user not found'), null);
                }
            } else {
                // Check if user exists with same email
                const email = profile.emails && profile.emails[0] && profile.emails[0].value;

                if (email) {
                    user = await User.findOne({email});
                }

                if (user) {
                    // Link social account to existing user
                    socialAccount = await SocialAccount.create({
                        userId: user._id,
                        provider: 'facebook',
                        providerId: profile.id,
                        providerData: {
                            email: email,
                            name: `${profile.name.givenName} ${profile.name.familyName}`,
                            picture: profile.photos && profile.photos[0] && profile.photos[0].value
                        }
                    });
                } else {
                    // Get default user role
                    let userRole = await Role.findOne({name: 'user'});
                    if (!userRole) {
                        // Create default user role if it doesn't exist
                        userRole = await Role.create({
                            name: 'user',
                            displayName: 'User',
                            description: 'Regular user with standard privileges'
                        });
                    }

                    // Create new user
                    user = await User.create({
                        email: email,
                        name: `${profile.name.givenName} ${profile.name.familyName}`,
                        roles: [userRole.name],
                        status: 'active',
                        emailVerified: true, // Email is verified by Facebook
                        profile: {
                            picture: profile.photos && profile.photos[0] && profile.photos[0].value
                        }
                    });

                    // Create social account
                    socialAccount = await SocialAccount.create({
                        userId: user._id,
                        provider: 'facebook',
                        providerId: profile.id,
                        providerData: {
                            email: email,
                            name: `${profile.name.givenName} ${profile.name.familyName}`,
                            picture: profile.photos && profile.photos[0] && profile.photos[0].value
                        }
                    });
                }
            }

            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));

    // Apple OAuth Strategy
    passport.use(new AppleStrategy({
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        privateKeyLocation: process.env.APPLE_PRIVATE_KEY_LOCATION,
        callbackURL: process.env.APPLE_CALLBACK_URL,
        passReqToCallback: true
    }, async (req, accessToken, refreshToken, idToken, profile, done) => {
        try {
            // Apple profile might not have all info on first login
            // Extract what we can from idToken and profile
            const appleId = profile.id;
            const email = profile.email || (idToken && idToken.email);
            const name = profile.name || req.body.user && JSON.parse(req.body.user).name;

            // Check if user already exists with this social account
            let socialAccount = await SocialAccount.findOne({
                provider: 'apple',
                providerId: appleId
            });

            let user;

            if (socialAccount) {
                // User exists, get user
                user = await User.findById(socialAccount.userId);

                if (!user) {
                    return done(new Error('Associated user not found'), null);
                }
            } else {
                // Check if user exists with same email
                if (email) {
                    user = await User.findOne({email});
                }

                if (user) {
                    // Link social account to existing user
                    socialAccount = await SocialAccount.create({
                        userId: user._id,
                        provider: 'apple',
                        providerId: appleId,
                        providerData: {
                            email: email,
                            name: name
                        }
                    });
                } else {
                    // Get default user role
                    let userRole = await Role.findOne({name: 'user'});
                    if (!userRole) {
                        // Create default user role if it doesn't exist
                        userRole = await Role.create({
                            name: 'user',
                            displayName: 'User',
                            description: 'Regular user with standard privileges'
                        });
                    }

                    // Create new user
                    user = await User.create({
                        email: email,
                        name: name || 'Apple User',
                        roles: [userRole.name],
                        status: 'active',
                        emailVerified: true, // Email is verified by Apple
                    });

                    // Create social account
                    socialAccount = await SocialAccount.create({
                        userId: user._id,
                        provider: 'apple',
                        providerId: appleId,
                        providerData: {
                            email: email,
                            name: name
                        }
                    });
                }
            }

            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));

    // Serialize and deserialize user
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};