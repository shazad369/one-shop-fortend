import axios from 'axios';





const PathaoOrder = () => {














    
  const handleConfirmOrder = async () => {
const orderPayload = {
    store_id: 149043, 
    merchant_order_id: `INV-${Date.now()}`,
    recipient_name: "Shazad Ahamed",
    recipient_phone: "01711111111",
    recipient_address: "Dhanmondi, Dhaka",
    recipient_city: 1,      
    recipient_zone: 1,      
    recipient_area: 1,      
    delivery_type: 48,      
    item_type: 2, // <--- এখানে 1 এর বদলে 2 করে দিন (Parcel)
    item_quantity: 1,
    item_weight: "0.5",
    amount_to_collect: 500  
};
    try {
       const res = await axios.post(`${import.meta.env.VITE_API}/api/pathao/create-order`, orderPayload);
        alert("অর্ডার সফল! আইডি: " + res.data.data.consignment_id);
    } catch (err: any) {
        // এখানে পপআপে আসল কারণটি দেখা যাবে
        const detailError = err.response?.data?.errors;
        console.log("Full Error:", detailError);
        alert("Error: " + JSON.stringify(detailError));
    }
};

    // সমাধান: return এর পর ব্র্যাকেট দিন
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950"> 
            <button 
                className='px-6 py-2 bg-red-600 text-white rounded-md font-bold hover:bg-red-700 transition-all' 
                onClick={handleConfirmOrder}
            >
                Confirm Pathao Order
            </button>
        </div>
    );
};

export default PathaoOrder;
