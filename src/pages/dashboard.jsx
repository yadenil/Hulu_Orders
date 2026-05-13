import { useState, useEffect } from 'react';
import api from '../services/api';

function Dashboard({ user, onLogout }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const loadOrders = async () => {
        try {
            const res = await api.get('/kitchen/orders');
            if (res.data.success) {
                const ordersWithWait = res.data.data.map(order => ({
                    ...order,
                    waiting_minutes: Math.floor((new Date() - new Date(order.placed_at)) / 60000)
                }));
                setOrders(ordersWithWait);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
        const interval = setInterval(loadOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    const updateStatus = async (orderId, status) => {
        try {
            const res = await api.put(`/kitchen/orders/${orderId}/status`, { status });
            if (res.data.success) {
                loadOrders();
                const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
                audio.play().catch(e => console.log('Sound not supported'));
            }
        } catch (error) {
            alert('Error updating status');
        }
    };

    const openModal = (order) => {
        setSelectedOrder(order);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedOrder(null);
    };

    const hotOrders = orders.filter(o => o.queue_type === 'hot');
    const drinkOrders = orders.filter(o => o.queue_type === 'drinks');
    const preparedOrders = orders.filter(o => o.queue_type === 'prepared');

    const OrderCard = ({ order }) => (
        <div 
            onClick={() => openModal(order)}
            className="bg-white rounded-lg shadow-md p-3 mb-3 border-l-4 border-green-500 cursor-pointer hover:shadow-lg transition"
        >
            <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm">Order #{order.order_number}</span>
                <span className="text-xs text-gray-500">Table {order.table_number}</span>
            </div>
            <div className="space-y-1 mb-2">
                {order.items?.slice(0, 3).map(item => (
                    <div key={item.id} className="text-xs text-gray-600">
                        {item.quantity}x {item.item_name}
                    </div>
                ))}
                {order.items?.length > 3 && (
                    <div className="text-xs text-gray-400">+{order.items.length - 3} more</div>
                )}
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t">
                <span className="text-xs text-gray-400">⏱️ Waiting: {order.waiting_minutes} min</span>
                <div className="flex gap-2">
                    {order.status === 'ORDERED' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'PREPARING'); }}
                            className="bg-orange-500 text-white px-4 py-1 rounded text-sm font-semibold hover:bg-orange-600"
                        >
                            START
                        </button>
                    )}
                    {order.status === 'PREPARING' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); updateStatus(order.id, 'READY'); }}
                            className="bg-green-500 text-white px-4 py-1 rounded text-sm font-semibold hover:bg-green-600"
                        >
                            READY
                        </button>
                    )}
                    {order.status === 'READY' && (
                        <span className="text-green-600 text-xs font-semibold bg-green-50 px-2 py-1 rounded">
                            ✓ READY
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    if (loading) {
        return <div className="text-center py-10">Loading orders...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold">🍳 Kitchen Dashboard</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{user?.name}</span>
                    <button onClick={onLogout} className="text-red-500 text-sm hover:text-red-700">Logout</button>
                </div>
            </div>

            {/* Three Column Layout */}
            <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* HOT FOOD Column */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <h2 className="font-bold text-lg mb-3 text-center">🔥 HOT FOOD</h2>
                        {hotOrders.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm py-8">No orders</p>
                        ) : (
                            hotOrders.map(order => <OrderCard key={order.id} order={order} />)
                        )}
                    </div>

                    {/* DRINKS Column */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <h2 className="font-bold text-lg mb-3 text-center">🧋 DRINKS</h2>
                        {drinkOrders.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm py-8">No orders</p>
                        ) : (
                            drinkOrders.map(order => <OrderCard key={order.id} order={order} />)
                        )}
                    </div>

                    {/* PREPARED Column */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <h2 className="font-bold text-lg mb-3 text-center">🥗 PREPARED</h2>
                        {preparedOrders.length === 0 ? (
                            <p className="text-center text-gray-400 text-sm py-8">No orders</p>
                        ) : (
                            preparedOrders.map(order => <OrderCard key={order.id} order={order} />)
                        )}
                    </div>
                </div>
            </div>

            {/* Order Details Modal - Exactly matching your UI */}
            {showModal && selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-xl font-bold">Order #{selectedOrder.order_number}</h2>
                            <button onClick={closeModal} className="text-gray-400 text-2xl hover:text-gray-600">
                                &times;
                            </button>
                        </div>
                        
                        {/* Table and Status Info */}
                        <div className="px-4 py-2 bg-gray-50 border-b">
                            <span className="text-md text-gray-700">Table {selectedOrder.table_number}</span>
                            <span className={`ml-3 px-2 py-1 rounded text-xs ${
                                selectedOrder.status === 'ORDERED' ? 'bg-gray-200' :
                                selectedOrder.status === 'PREPARING' ? 'bg-orange-200 text-orange-800' :
                                'bg-green-200 text-green-800'
                            }`}>
                                {selectedOrder.status}
                            </span>
                        </div>
                        
                        {/* Items List */}
                        <div className="p-4">
                            <h3 className="font-semibold mb-3">Items:</h3>
                            <div className="space-y-3 mb-4">
                                {selectedOrder.items?.map(item => (
                                    <div key={item.id} className="border-b pb-2">
                                        <div className="flex justify-between">
                                            <span className="font-medium">
                                                {item.quantity}x {item.item_name}
                                            </span>
                                            <span>{item.quantity * item.unit_price} ETB</span>
                                        </div>
                                        {item.special_instructions && (
                                            <p className="text-sm text-orange-500 mt-1">
                                                - Special: "{item.special_instructions}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Total */}
                            <div className="border-t pt-3 mb-4">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total:</span>
                                    <span>
                                        {selectedOrder.items?.reduce((sum, i) => sum + (i.quantity * i.unit_price), 0)} ETB
                                    </span>
                                </div>
                            </div>
                            
                            {/* Time Info */}
                            <div className="text-sm text-gray-500 mb-4">
                                <p>Ordered at: {new Date(selectedOrder.placed_at).toLocaleTimeString()}</p>
                                <p>Waiting: {selectedOrder.waiting_minutes} minutes</p>
                            </div>
                            
                            {/* MARK PREPARING / MARK READY Buttons - Exactly as your UI */}
                            <div className="flex gap-3 mt-2">
                                {selectedOrder.status === 'ORDERED' && (
                                    <button
                                        onClick={() => updateStatus(selectedOrder.id, 'PREPARING')}
                                        className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition"
                                    >
                                        MARK PREPARING
                                    </button>
                                )}
                                {selectedOrder.status === 'PREPARING' && (
                                    <button
                                        onClick={() => updateStatus(selectedOrder.id, 'READY')}
                                        className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition"
                                    >
                                        MARK READY
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Dashboard;