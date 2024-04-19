const stripe = require('stripe')(require('config').stripe.secret);

module.exports = async (customerID) => {
    // refund all of the customer's charges
    const invoices = await stripe.invoices.list({ customer: customerID });
    for (const invoice of invoices.data) {

        if (invoice.status !== 'paid') {
            console.log(`Skipping invoice ${invoice.id} because it is not paid`);
            continue;
        }

        console.log(`Refunding invoice ${invoice.id} for reasons of suspected fraud`);
        await stripe.refunds.create({ charge: invoice.charge, reason: 'fraudulent' });
    }
};

if (require.main === module) {
    module.exports(process.argv[2]);

}

