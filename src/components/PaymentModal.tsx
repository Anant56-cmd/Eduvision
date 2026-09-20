import React, { useState } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, ShieldCheck, Zap, CheckCircle2, Loader2, ArrowRight, QrCode, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/api';
import { QRCodeSVG } from 'qrcode.react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: {
    id: number;
    title: string;
    price: number;
  };
  onSuccess: () => void;
}

export default function PaymentModal({ isOpen, onClose, course, onSuccess }: PaymentModalProps) {
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [method, setMethod] = useState<'card' | 'upi'>('card');
  const [loading, setLoading] = useState(false);
  const [txnId, setTxnId] = useState('');

  const adminUpi = import.meta.env.VITE_ADMIN_UPI_ID || 'eduvision@upi';
  const upiLink = `upi://pay?pa=${adminUpi}&pn=EduVision&am=${course.price}&cu=INR&tn=Course_${course.id}`;

  const handlePayment = async () => {
    if (method === 'upi' && !txnId) {
      alert("Please enter the UTR/Transaction ID after making the payment.");
      return;
    }

    setStep('processing');
    setLoading(true);
    
    // Simulate payment processing delay
    setTimeout(async () => {
      try {
        await api.post('/payments', {
          course_id: course.id,
          amount: course.price,
          transaction_id: method === 'card' 
            ? 'TXN_' + Math.random().toString(36).substr(2, 9).toUpperCase()
            : txnId
        });
        setStep('success');
      } catch (error) {
        console.error(error);
        setStep('details');
      } finally {
        setLoading(false);
      }
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <AnimatePresence mode="wait">
          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-8 space-y-6"
            >
              <DialogHeader>
                <div className="flex items-center justify-between mb-2">
                  <DialogTitle className="text-2xl font-bold font-heading">Secure Checkout</DialogTitle>
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" 
                    alt="Razorpay" 
                    className="h-5 opacity-70"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <DialogDescription>
                  Complete your purchase for <span className="font-bold text-slate-900">{course.title}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="bg-gradient-to-br from-brand-500 to-indigo-600 rounded-3xl p-6 text-white shadow-xl glow-brand relative overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                <div className="relative z-10 flex justify-between items-end">
                  <div>
                    <div className="text-[10px] text-white/70 font-bold uppercase tracking-widest">Total Amount</div>
                    <div className="text-3xl font-black tracking-tighter mt-1">₹{course.price}</div>
                  </div>
                  <Zap className="h-10 w-10 text-white/20 fill-current" />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex p-1 bg-slate-100 rounded-2xl">
                <button 
                  onClick={() => setMethod('card')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${method === 'card' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <CreditCard className="h-4 w-4" />
                  Card
                </button>
                <button 
                  onClick={() => setMethod('upi')}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${method === 'upi' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <QrCode className="h-4 w-4" />
                  UPI QR
                </button>
              </div>

              <div className="space-y-4">
                {method === 'card' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="card" className="text-xs font-bold uppercase tracking-wider text-slate-500">Card Details</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input id="card" placeholder="4242 4242 4242 4242" className="pl-12 h-12 rounded-xl border-slate-200" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="expiry" className="text-xs font-bold uppercase tracking-wider text-slate-500">Expiry</Label>
                        <Input id="expiry" placeholder="MM/YY" className="h-12 rounded-xl border-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cvv" className="text-xs font-bold uppercase tracking-wider text-slate-500">CVV</Label>
                        <Input id="cvv" placeholder="123" className="h-12 rounded-xl border-slate-200" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
                    <div className="p-4 bg-white rounded-[2rem] border-2 border-slate-100 shadow-inner">
                      <QRCodeSVG 
                        value={upiLink} 
                        size={180} 
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <div className="w-full space-y-4">
                      <div className="text-center space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scan with any UPI App</p>
                        <div className="flex items-center justify-center gap-3 grayscale opacity-70">
                          <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="h-4" referrerPolicy="no-referrer" />
                          <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_Pay_logo.svg" alt="Apple" className="h-3" referrerPolicy="no-referrer" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="trid" className="text-xs font-bold uppercase tracking-wider text-slate-500">Transaction ID / UTR</Label>
                        <div className="relative">
                          <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <Input 
                            id="trid" 
                            placeholder="Enter 12-digit UTR" 
                            className="pl-12 h-12 rounded-xl border-slate-200 uppercase"
                            value={txnId}
                            onChange={(e) => setTxnId(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-[10px] text-slate-400 justify-center font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                Verified & Secure Payment Gateway
              </div>

              <Button 
                onClick={handlePayment} 
                className="w-full h-14 bg-brand-600 hover:bg-brand-700 rounded-2xl text-lg font-bold shadow-xl shadow-brand-200 group"
              >
                <span>{method === 'card' ? 'Pay Securely' : 'I have Paid'}</span>
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-12 text-center space-y-6"
            >
              <div className="flex justify-center">
                <div className="relative h-24 w-24">
                  <Loader2 className="h-24 w-24 animate-spin text-brand-600" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="h-8 w-8 text-brand-600 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">Verifying Payment</h3>
                <p className="text-slate-500">Checking your transaction status...</p>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-12 text-center space-y-8"
            >
              <div className="flex justify-center">
                <div className="h-24 w-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center border-4 border-emerald-50">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-black text-slate-900 font-heading tracking-tight">Success!</h3>
                <p className="text-slate-500 font-medium">Your course has been activated. Redirecting you to the learning area.</p>
              </div>
              <Button 
                onClick={() => {
                  onSuccess();
                  onClose();
                }} 
                className="w-full h-14 bg-slate-900 hover:bg-slate-800 rounded-2xl text-lg font-bold shadow-lg"
              >
                Start Learning
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
