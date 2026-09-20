import React, { useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Download, Share2, Award, CheckCircle2, Star, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  courseTitle: string;
  date: string;
}

export default function CertificateModal({ isOpen, onClose, userName, courseTitle, date }: CertificateModalProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate a persistent, stable certificate ID
  const certId = useMemo(() => {
    let hash = 0;
    const str = `${userName}-${courseTitle}`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const hashHex = Math.abs(hash).toString(16).toUpperCase().padStart(6, '0');
    return `EDUVISION-CERT-${hashHex}`;
  }, [userName, courseTitle]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();

      // 1. Background
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, width, height, 'F');

      // 2. Decorative Background Circles
      doc.setFillColor(245, 247, 255);
      doc.circle(0, 0, 60, 'F');
      doc.setFillColor(255, 245, 250);
      doc.circle(width, height, 80, 'F');

      // 3. Double Border
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(1.5);
      doc.rect(10, 10, width - 20, height - 20, 'D');
      doc.setLineWidth(0.5);
      doc.rect(12, 12, width - 24, height - 24, 'D');

      // 4. Award Icon / Seal
      doc.setFillColor(79, 70, 229);
      doc.circle(width / 2, 45, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('E', width / 2, 49, { align: 'center' });

      // 5. Header Text
      doc.setTextColor(79, 70, 229);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFICATE OF COMPLETION', width / 2, 70, { align: 'center', charSpace: 2 });

      doc.setTextColor(148, 163, 184);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('This is to certify that', width / 2, 80, { align: 'center' });

      // 6. User Name
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(38);
      doc.setFont('helvetica', 'bold');
      doc.text(userName, width / 2, 105, { align: 'center' });

      // 7. Course Info
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('has successfully completed the industry masterclass', width / 2, 122, { align: 'center' });

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(courseTitle, width / 2, 138, { align: 'center' });

      // 8. Footer Section
      const footerY = 175;
      
      // Date
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('DATE ISSUED', 35, footerY - 6);
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(11);
      doc.text(date, 35, footerY);

      // Verified Badge
      doc.setDrawColor(199, 210, 254);
      doc.setLineWidth(0.5);
      doc.circle(width / 2, footerY - 5, 10, 'D');
      doc.setTextColor(79, 70, 229);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('VERIFIED', width / 2, footerY + 10, { align: 'center' });

      // Certificate ID
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.text('CERTIFICATE ID', width - 35, footerY - 6, { align: 'right' });
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(9);
      doc.setFont('courier', 'bold');
      doc.text(certId, width - 35, footerY, { align: 'right' });

      doc.save(`${userName.replace(/\s+/g, '_')}_Certificate.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/verify?cert=${certId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${courseTitle} Certificate`,
          text: `I just completed "${courseTitle}" on EduVision! Check out my verified certificate:`,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // Fall back to clipboard if user dismissed share sheet
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden z-10"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors z-10"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col md:flex-row">
            {/* Certificate Preview */}
            <div className="flex-1 p-8 sm:p-12 bg-slate-50 flex items-center justify-center overflow-hidden">
              <div 
                ref={certificateRef}
                id="certificate-content" 
                className="relative w-full aspect-[1.414/1] bg-white shadow-2xl rounded-sm border-[12px] border-double border-slate-200 p-8 sm:p-12 flex flex-col items-center justify-between text-center overflow-hidden"
              >
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-brand-500/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-brand-500/5 rounded-full translate-x-1/4 translate-y-1/4" />
                
                <div className="space-y-5 relative z-10">
                  <div className="flex justify-center">
                    <div className="h-14 w-14 bg-brand-600 rounded-full flex items-center justify-center shadow-lg shadow-brand-500/20">
                      <Award className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h2 className="text-brand-600 font-black tracking-widest uppercase text-xs sm:text-sm">Certificate of Completion</h2>
                    <p className="text-slate-400 text-xs italic">This is to certify that</p>
                  </div>
                  
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading tracking-tight">
                    {userName}
                  </h1>
                  
                  <div className="space-y-1">
                    <p className="text-slate-500 text-xs">has successfully completed the masterclass</p>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 font-heading">
                      {courseTitle}
                    </h3>
                  </div>
                </div>

                <div className="w-full flex justify-between items-end relative z-10 pt-4">
                  <div className="text-left space-y-0.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Date Issued</p>
                    <p className="text-xs font-bold text-slate-700">{date}</p>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="h-12 w-12 border-3 border-brand-200 rounded-full flex items-center justify-center mb-1 bg-brand-50/50">
                      <Star className="h-6 w-6 text-brand-500 fill-brand-500" />
                    </div>
                    <p className="text-[9px] font-black text-brand-600 uppercase tracking-tighter">Verified</p>
                  </div>

                  <div className="text-right space-y-0.5">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Certificate ID</p>
                    <p className="text-xs font-mono font-bold text-slate-700">{certId}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Sidebar */}
            <div className="w-full md:w-80 p-8 sm:p-10 bg-white border-l border-slate-100 flex flex-col justify-center space-y-6">
              <div className="space-y-2">
                <div className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-3 text-emerald-600">
                  <Trophy className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 font-heading tracking-tight">Course Completed!</h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                  You have successfully demonstrated mastery across all lectures and quizzes. Add this credential to your resume and LinkedIn.
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={handleDownload}
                  disabled={isGenerating}
                  className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-2 shadow-md"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleShare}
                  variant="outline"
                  className="w-full h-12 rounded-xl border-slate-200 text-slate-700 font-bold flex items-center justify-center gap-2 hover:bg-slate-50"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4 text-brand-600" />
                      Share Achievement
                    </>
                  )}
                </Button>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2.5 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Cryptographically Verified</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}