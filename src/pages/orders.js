import { getSession, useSession } from "next-auth/client";
import Header from "../components/header";
import db from "../services/firebase";
import moment from 'moment';
import Order from "../components/order";

function Orders({ orders }) {
    const [session] = useSession();
    console.log(orders, 'olha aqui')

    return (
        <div>
            <Header />
            <main className="max-w-screen-lg mx-auto -p-10">
                <h1 className="text-3xl border-b mb-2 pb-1 border-yellow-400">Suas compras</h1>

                {session ? (
                    <h2>{orders.length} Pedido(s)</h2>
                ) : (
                    <h2>Por favor faça login para ver suas compras!</h2>
                )}

                <div className="mt-5 space-y-4">
                    {orders?.map(({
                        id, amount, amountShipping, items, timestamp, images
                    }) => (
                        <Order
                            key={id}
                            amount={amount}
                            amountShipping={amountShipping}
                            items={items}
                            images={images}
                            timestamp={timestamp}
                            id={id}
                        />
                    ))}
                </div>
            </main>
        </div>
    )
}

export default Orders;

export async function getServerSideProps(context) {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

    //get the users logged in credentials
    const session = await getSession(context);

    if (!session) {
        return {
            props: {},
        }
    }

    //Firebase db
    const stripeOrders = await db
        .collection('users')
        .doc(session.user.email)
        .collection('orders')
        .orderBy('timestamp', 'desc').get();

    //Stripe orders
    const orders = await Promise.all(
        stripeOrders.docs.map(async (order) => ({
            id: order.id,
            amount: order.data().amount,
            amountShipping: order.data().amount_shipping,
            images: order.data().images,
            timestamp: moment(order.data().timestamp.toDate()).unix(),
            items: (
                await stripe.checkout.sessions.listLineItems(order.id, {
                    limit: 100
                })
            ).data,
        }))
    );

    return {
        props: {
            orders: orders
        }
    }

}