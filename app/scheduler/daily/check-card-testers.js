// Iterate over Stripe customers and check if they have created a blog or nor
// If there are users without a blog, log their information to the console
// so we can investigate further as to why they haven't created a blog yet
const User = require('models/user');
const Blog = require('models/blog');
const config = require("config");
const stripe = require("stripe")(config.stripe.secret);


const getByCustomerId = async (customerId) => {
    return new Promise((resolve, reject) => {
        User.getByCustomerId(customerId, (err, user) => {
            resolve(user);
        });
    });
};

const refundPaymentEndSubscriptionDeleteCustomer = async (customerId) => {
    return new Promise((resolve, reject) => {
        stripe.subscriptions.list({ customer: customerId }, async (err, subscriptions) => {
            if (err) {
                console.error(`Error fetching subscriptions for customer ${customerId}`, err);
                return resolve();
            }

            for (const subscription of subscriptions.data) {
                try {
                    await stripe.refunds.create({ charge: subscription.latest_invoice.payment_intent.charges.data[0].id });
                } catch (err) {
                    console.error(`Error refunding payment for subscription ${subscription.id} for customer ${customerId}`, err);
                }

                try {
                    await stripe.subscriptions.del(subscription.id);
                } catch (err) {
                    console.error(`Error deleting subscription ${subscription.id} for customer ${customerId}`, err);
                }
            }

            try {
                await stripe.customers.del(customerId);
            } catch (err) {
                console.error(`Error deleting customer ${customerId}`, err);
            }

            resolve();
        });
    });
}


module.exports = async function (startingAfter = null) {
    
    console.log('listing 100 customers starting after', startingAfter || 'beginning');

    const parameters = startingAfter ? { limit: 100, starting_after: startingAfter } : { limit: 100 };
    const response = await stripe.customers.list(parameters);

    for (const customer of response.data) {
        const user = await getByCustomerId(customer.id);
    
        if (!user) {
            console.log();
            console.log(`No user found for customer ${customer.id} with email ${customer.email}`);
            console.log(customer)
            console.log(`https://dashboard.stripe.com/customers/${customer.id}`);
            continue;

         }
    }

    if (!response.has_more) {
        console.log("No more customers to fetch");
        return true;
    }

    return module.exports(response.data[response.data.length - 1].id);
}

if (require.main === module) {
    module.exports();
}
