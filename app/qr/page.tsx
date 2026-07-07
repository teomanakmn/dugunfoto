"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Heart, Printer, Link as LinkIcon, Settings, ArrowLeft, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function QRGeneratorPage() {
  const router = useRouter();
  const [baseUrl, setBaseUrl] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Set default URL based on browser origin
  useEffect(() => {
    if (typeof window !== "undefined") {
      setBaseUrl(window.location.origin);
    }
  }, []);

  // Regenerate QR when inputs change
  useEffect(() => {
    generateQRCode();
  }, [baseUrl, tableNumber]);

  const generateQRCode = async () => {
    if (!baseUrl) return;
    setLoading(true);
    try {
      const fullUrl = tableNumber
        ? `${baseUrl}?table=${encodeURIComponent(tableNumber)}`
        : baseUrl;

      // Generate high resolution QR code with elegant styling
      const dataUrl = await QRCode.toDataURL(fullUrl, {
        width: 600,
        margin: 2,
        color: {
          dark: "#2a251d", // matches --color-text-dark
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      });

      setQrCodeDataUrl(dataUrl);
    } catch (err) {
      console.error("QR Code generation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container" style={{ maxWidth: "700px" }}>
      {/* Back to main page */}
      <div className="no-print" style={{ marginBottom: "16px" }}>
        <button
          onClick={() => router.push("/")}
          style={{
            background: "none",
            border: "1px solid rgba(201, 169, 110, 0.3)",
            color: "var(--color-text-dark)",
            padding: "8px 16px",
            borderRadius: "var(--border-radius-sm)",
            cursor: "pointer",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <ArrowLeft size={14} /> Ana Sayfaya Git
        </button>
      </div>

      {/* Control panel - hidden during print */}
      <div className="card no-print" style={{ marginBottom: "24px", textAlign: "left" }}>
        <h2 style={{ fontSize: "1.4rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Settings size={20} style={{ color: "var(--color-gold)" }} /> QR Kod Kartı Oluşturucu
        </h2>
        <p style={{ fontSize: "0.9rem", color: "var(--color-text-muted)", marginBottom: "20px" }}>
          Masalara koyacağınız fotoğraf yükleme kartlarını buradan özelleştirebilir ve yazdırabilirsiniz.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--color-text-dark)" }}>
              Düğün Web Sitesi URL'i
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://dugunfoto.pages.dev"
                style={{
                  flexGrow: 1,
                  padding: "10px 14px",
                  borderRadius: "var(--border-radius-sm)",
                  border: "1px solid rgba(201, 169, 110, 0.3)",
                  fontSize: "0.95rem",
                  backgroundColor: "var(--bg-secondary)",
                }}
              />
            </div>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-light)", marginTop: "4px", display: "block" }}>
              Cloudflare Pages'e yükledikten sonra canlı site URL'ini buraya yazın.
            </span>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, marginBottom: "6px", color: "var(--color-text-dark)" }}>
              Masa Numarası (Opsiyonel)
            </label>
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Örn: 5"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "var(--border-radius-sm)",
                border: "1px solid rgba(201, 169, 110, 0.3)",
                fontSize: "0.95rem",
                backgroundColor: "var(--bg-secondary)",
              }}
            />
          </div>

          <button
            onClick={handlePrint}
            disabled={!qrCodeDataUrl}
            className="btn btn-primary"
            style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "8px" }}
          >
            <Printer size={18} /> Kartı Yazdır (A4 / Card)
          </button>
        </div>
      </div>

      {/* Printable Area - styled for elegant A4 or desktop card view */}
      <div ref={printAreaRef} className="print-wrapper">
        <div className="wedding-card-print">
          <div className="wedding-card-border">
            <Heart className="print-heart" />
            <h2 className="print-title">Anılarınızı Bizimle Paylaşın</h2>
            
            <p className="print-text">
              Bu mutlu günden çektiğiniz fotoğrafları ve videoları anlık olarak paylaşmak için telefonunuzun kamerasıyla QR kodu okutun.
            </p>

            <div className="print-qr-container">
              {loading ? (
                <div className="qr-loader">
                  <RefreshCw size={24} className="spin" />
                </div>
              ) : (
                qrCodeDataUrl && <img src={qrCodeDataUrl} alt="QR Code" className="print-qr" />
              )}
            </div>

            <p className="print-tagline">
              Gelin & Damat'ın Mutlu Günü
            </p>

            {tableNumber && (
              <div className="print-table-number">
                Masa {tableNumber}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Styling details specifically for printing layout */}
      <style jsx global>{`
        /* Screen view for preview card */
        .print-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px 0;
        }

        .wedding-card-print {
          width: 100%;
          max-width: 420px;
          background: #ffffff;
          border: 1px solid rgba(201, 169, 110, 0.3);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-elegant);
          padding: 40px 30px;
          text-align: center;
          position: relative;
        }

        .wedding-card-border {
          border: 1px solid rgba(201, 169, 110, 0.2);
          border-radius: var(--border-radius-md);
          padding: 24px 16px;
        }

        .print-heart {
          color: var(--color-gold);
          width: 24px;
          height: 24px;
          margin-bottom: 12px;
        }

        .print-title {
          font-family: var(--font-serif);
          font-size: 1.6rem;
          color: var(--color-text-dark);
          margin-bottom: 12px;
          font-weight: 500;
        }

        .print-text {
          font-size: 0.85rem;
          color: var(--color-text-muted);
          line-height: 1.5;
          margin-bottom: 24px;
          max-width: 280px;
          margin-left: auto;
          margin-right: auto;
        }

        .print-qr-container {
          width: 180px;
          height: 180px;
          margin: 0 auto 24px;
          border: 1px solid rgba(201, 169, 110, 0.15);
          padding: 8px;
          border-radius: var(--border-radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
        }

        .print-qr {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .print-tagline {
          font-family: var(--font-serif);
          font-size: 1.1rem;
          color: var(--color-gold-dark);
          letter-spacing: 0.5px;
        }

        .print-table-number {
          margin-top: 16px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--color-text-light);
          text-transform: uppercase;
          letter-spacing: 1px;
          display: inline-block;
          border-top: 1px solid rgba(201, 169, 110, 0.15);
          padding-top: 6px;
          width: 80px;
        }

        .qr-loader {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          color: var(--color-gold);
        }

        /* PRINT MEDIA STYLES - triggers during window.print() */
        @media print {
          body {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .no-print {
            display: none !important;
          }

          .container {
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .print-wrapper {
            padding: 0 !important;
            margin: 0 !important;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .wedding-card-print {
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 500px !important;
            padding: 40px !important;
          }

          .wedding-card-border {
            border: 2px solid #c9a96e !important; /* Force elegant border in print */
            border-radius: var(--border-radius-md) !important;
            padding: 40px 30px !important;
          }

          .print-title {
            font-size: 2.2rem !important;
          }

          .print-text {
            font-size: 1.1rem !important;
            max-width: 380px !important;
            margin-bottom: 30px !important;
          }

          .print-qr-container {
            width: 240px !important;
            height: 240px !important;
            margin-bottom: 30px !important;
          }

          .print-tagline {
            font-size: 1.5rem !important;
          }

          .print-table-number {
            font-size: 1.1rem !important;
            width: 120px !important;
          }
        }
      `}</style>
    </div>
  );
}
