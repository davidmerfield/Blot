var MODEL = {
  uid: "string",
  email: "string",
  blogs: "array",
  isDisabled: "boolean",
  lastSession: "string",
  passwordHash: "string",
  subscription: "object",
  payment_method: "object"
};

// values straight from external provider
// payment_method.stripe.customer
// payment_method.stripe.subscription

// values set by blot
// payment_method.stripe.active = boolean

// payment_method.braintree.customer
// payment_method.braintree.subscription

module.exports = MODEL;
