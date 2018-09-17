SIGNUP SUCCESS
customer.created
invoice.created
invoice.payment_succeeded
customer.card.created
charge.succeeded
customer.subscription.created

SIGNUP FAILED
charge.failed

UPDATE PAYMENT METHOD
customer.card.deleted
customer.card.created
customer.updated
customer.subscription.updated

CANCEL SUBSCRIPTION
customer.subscription.updated

RENEW SUCCESS
invoice.created
customer.subscription.updated
invoice.payment_succeeded
charge.succeeded
customer.updated IF prev failed renew attempt then

RENEW FAIL
invoice.created
customer.subscription.updated
invoice.payment_failed
charge.failed
customer.updated to set delinquent flag
invoice.updated to track attempted charges
customer.subscription.updated IF NOT FINAL CHARGE ATTEMPT
customer.subscription.deleted IF IS FINAL CHARGE ATTEMPT

18. make menu a model?
    ensure concurrent changes to user's menu works
    also background changes succeed if user presses submit
    on settings page (with no local changes)

    background:
    cannot affect order
    or links existence
      rem
      push

    foreground:
    cannot affect pages existence
    can affect links and order
      rem
      insert
      reorder

    for each page verify it still exists
      if not trim it from updates

