// Iterate over Stripe customers and check if they have created a blog or nor
// If there are users without a blog, log their information to the console
// so we can investigate further as to why they haven't created a blog yet
const User = require('models/user');
const Blog = require('models/blog');
const config = require("config");
const stripe = require("stripe")(config.stripe.secret);


const getByCustomerID = async (customerId) => {
    return new Promise((resolve, reject) => {
        User.getByCustomerID(customerId, (err, user) => {
            resolve(user);
        });
    });
};

module.exports = async function (startingAfter = null) {
    
    console.log('listing 100 customers starting after', startingAfter || 'beginning');

    const parameters = startingAfter ? { limit: 100, starting_after: startingAfter } : { limit: 100 };
    const response = await stripe.customers.list(parameters);

    for (const customer of response.data) {
        const user = await getByCustomerID(customer.id);
    
        if (!user) {
            console.log(`No user found for customer ${customer.id}`);
            continue;

         }

         if (!user.blogs || user.blogs.length === 0) {
             console.log(`User ${user.email} has no blog`);
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
