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
        await stripe.charges.refund(invoice.charge, { reason: 'fraudulent' });
    }

    // delete the customer
    console.log(`Deleting customer ${customerID}`);
    await stripe.customers.del(customerID);

    console.log(`Deleted customer ${customerID}`);
    return true;
};

if (require.main === module) {
    module.exports(process.argv[2]);

}

