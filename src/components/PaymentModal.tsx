import { usePaystackPayment } from "react-paystack";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import baseApi from "../utils/baseApi";

interface PaymentModalProps {
  onClose: () => void;
  onSuccess: () => void;
  email: string;
  examType: string; 
}

const PaymentModal: React.FC<PaymentModalProps> = ({ onClose, onSuccess, email, examType }) => {
  const config = {
    reference: new Date().getTime().toString(),
    email,
    amount: 200000, 
    publicKey: "pk_test_26394d2b0a42f42fd509fd46e77d4c0058bb326a", 
  };

  const initializePayment = usePaystackPayment(config);

  const handlePayment = () => {
    initializePayment({
      onSuccess: async (response: { status: string; reference: string }) => {
        if (response.status === "success") {
          try {
            const token = localStorage.getItem("accessToken");
            // Send examType along with the reference to the backend
            await axios.post(
              `${baseApi}/payment/verify-payment`,
              { reference: response.reference, examType }, 
              { headers: { Authorization: `Bearer ${token}` } }
            );
            onSuccess(); // Notify parent component
            toast.success(`Subscribed to ${examType} successfully!`);
          } catch (error) {
            console.error("Error verifying transaction:", error);
            toast.error("Subscription verification failed.");
          } finally {
            onClose();
          }
        } else {
          toast.error("Payment was not completed.");
          onClose();
        }
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Subscribe to {examType}</h2>
        <p className="mb-4">Subscribe for access to {examType} at ₦2000 per year.</p>
        <button
          onClick={handlePayment}
          className="bg-[#66934e] text-white px-4 py-2 rounded-md hover:bg-[#85b35c] transition-colors"
        >
          Pay Now
        </button>
        <button
          onClick={onClose}
          className="ml-4 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </div>
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
};

export default PaymentModal;