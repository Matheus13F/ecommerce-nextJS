const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export default async (req, res) => {
    const { items, email } = req.body;

    const transformItems = items.map(item => ({
        description: item.description,
        quantity: 1,
        price_data: {
            currency: 'brl',
            unit_amount: item.price * 100,
            product_data: {
                name: item.title,
                images: [item.image]
            },
        }
    }));

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        shipping_rates: ['shr_1KAoUMDA463tKQgEvktIwYio'],
        shipping_address_collection: {
            allowed_countries: ['BR', 'US']
        },
        line_items: transformItems,
        mode: 'payment',
        success_url: `${process.env.HOST}/success`,
        cancel_url: `${process.env.HOST}/checkout`,
        metadata: {
            email,
            images: JSON.stringify(items.map(item => item.image))
        }
    });

    res.status(200).json({ id: session.id })
};

//rodar o arquivo strpie.exe em arquivos de programas2, autenticar, apos isso rodar stripe listen --forward-to localhost:3000/api/webhook