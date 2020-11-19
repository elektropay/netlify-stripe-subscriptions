const stripe = require('stripe')(process.env.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);
const { faunaFetch } = require('./utils/fauna');

exports.handler = async (event) => {
  const { user } = JSON.parse(event.body);

  // create a new customer in Stripe
  const customer = await stripe.customers.create({ email: user.email });

  // subscribe the new customer to the free plan
  await stripe.subscriptions.create({
    customer: customer.id,
    items: [{ price: process.env.price_1HoycsILEHQPRWpOdogBUwgt }],
  });

  // store the Netlify and Stripe IDs in Fauna
  await faunaFetch({
    query: `
      mutation ($netlifyID: ID!, $stripeID: ID!) {
        createUser(data: { netlifyID: $netlifyID, stripeID: $stripeID }) {
          netlifyID
          stripeID
        }
      }
    `,
    variables: {
      netlifyID: user.id,
      stripeID: customer.id,
    },
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      app_metadata: {
        roles: ['free'],
      },
    }),
  };
};
