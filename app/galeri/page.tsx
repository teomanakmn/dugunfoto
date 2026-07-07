"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase, BUCKET_NAME } from "@/lib/supabase";
import {
  Heart,
  Lock,
  Download,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

const ADMIN_PASSWORD = "mutlugun"; // Default password, can be changed

function GalleryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" }[]>([]);

  // Check URL key on load
  useEffect(() => {
    const key = searchParams.get("key");
    if (key === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPhotos();
    }
  }, [isAuthenticated]);

  const showToast = (message: string, type: "success" | "error") => {
    const id = Math.random().toString(36).substring(2, 9) + Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError("");
      // Update URL so they can bookmark/reload without entering password again
      router.push(`/galeri?key=${ADMIN_PASSWORD}`);
    } else {
      setError("Hatalı şifre. Lütfen tekrar deneyin.");
    }
  };

  const fetchPhotos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list("", {
          limit: 100,
          sortBy: { column: "created_at", order: "desc" },
        });

      if (error) throw error;

      if (data) {
        // Map files to public URLs
        const photosWithUrls = data.map((file) => {
          const { data: publicUrlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(file.name);
          return {
            name: file.name,
            id: file.id,
            url: publicUrlData.publicUrl,
            created_at: file.created_at,
          };
        });
        setPhotos(photosWithUrls);
      }
    } catch (err: any) {
      console.error(err);
      showToast("Fotoğraflar yüklenirken bir hata oluştu.", "error");
    } finally {
      setLoading(false);
    }
  };

  const downloadPhoto = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      showToast("Fotoğraf indiriliyor...", "success");
    } catch (err) {
      console.error(err);
      showToast("Fotoğraf indirilirken hata oluştu.", "error");
    }
  };

  const deletePhoto = async (name: string) => {
    if (!window.confirm("Bu fotoğrafı kalıcı olarak silmek istediğinize emin misiniz?")) {
      return;
    }

    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([name]);

      if (error) throw error;

      setPhotos((prev) => prev.filter((p) => p.name !== name));
      showToast("Fotoğraf başarıyla silindi.", "success");
      if (lightboxPhoto === name) {
        setLightboxPhoto(null);
      }
    } catch (err: any) {
      console.error(err);
      showToast("Fotoğraf silinirken hata oluştu.", "error");
    }
  };

  const handleBackToUpload = () => {
    router.push("/");
  };

  // Password Screen (Unauthenticated)
  if (!isAuthenticated) {
    return (
      <div className="container" style={{ minHeight: "80vh", display: "flex", alignItems: "center" }}>
        <div className="card" style={{ width: "100%" }}>
          <header className="wedding-header">
            <Lock
              style={{
                color: "var(--color-gold)",
                width: "36px",
                height: "36px",
                marginBottom: "8px",
              }}
            />
            <h1 className="wedding-logo">Fotoğraf Galerisi</h1>
            <p className="wedding-subtitle">Bu galeri gelin ve damat için özeldir. Lütfen giriş şifresini girin.</p>
          </header>

          <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <input
                type="password"
                placeholder="Galeri Şifresi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "var(--border-radius-sm)",
                  border: "1px solid rgba(201, 169, 110, 0.3)",
                  fontSize: "1rem",
                  textAlign: "center",
                  backgroundColor: "var(--bg-secondary)",
                  color: "var(--color-text-dark)",
                }}
              />
              {error && (
                <p style={{ color: "var(--color-error)", fontSize: "0.85rem", marginTop: "8px" }}>{error}</p>
              )}
            </div>
            <button type="submit" className="btn btn-primary">
              Giriş Yap
            </button>
          </form>

          <button
            onClick={handleBackToUpload}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-text-muted)",
              cursor: "pointer",
              marginTop: "24px",
              fontSize: "0.9rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <ArrowLeft size={16} /> Fotoğraf Yükleme Sayfasına Dön
          </button>
        </div>
      </div>
    );
  }

  // Gallery Screen (Authenticated)
  return (
    <div className="container" style={{ maxWidth: "800px" }}>
      {/* Toast Overlay */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${
              toast.type === "success" ? "toast-success" : "toast-error"
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              style={{
                background: "none",
                border: "none",
                color: "white",
                cursor: "pointer",
                marginLeft: "10px",
                fontSize: "1.1rem",
              }}
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: "32px 20px" }}>
        <header className="wedding-header">
          <Heart
            style={{
              color: "var(--color-gold)",
              width: "30px",
              height: "30px",
            }}
          />
          <h1 className="wedding-logo">Düğün Galerisi</h1>
          <p style={{ color: "var(--color-gold-dark)", fontFamily: "var(--font-serif)" }}>
            Misafirlerimizden Gelen Kareler
          </p>
          <div className="gold-divider">
            <span>✧</span>
          </div>
        </header>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            gap: "12px",
          }}
        >
          <button
            onClick={handleBackToUpload}
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
            <ArrowLeft size={14} /> Fotoğraf Yükle
          </button>

          <button
            onClick={fetchPhotos}
            disabled={loading}
            style={{
              background: "var(--color-gold-light)",
              border: "none",
              color: "var(--color-gold-dark)",
              padding: "8px 16px",
              borderRadius: "var(--border-radius-sm)",
              cursor: "pointer",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Yenile
          </button>
        </div>

        {loading && photos.length === 0 ? (
          <div style={{ padding: "60px 0", color: "var(--color-text-light)" }}>
            <RefreshCw size={24} className="spin" style={{ margin: "0 auto 12px" }} />
            <p>Fotoğraflar yükleniyor...</p>
          </div>
        ) : photos.length === 0 ? (
          <div
            style={{
              padding: "60px 20px",
              border: "1px dashed rgba(201, 169, 110, 0.2)",
              borderRadius: "var(--border-radius-md)",
              color: "var(--color-text-light)",
            }}
          >
            <ImageIcon size={32} style={{ color: "var(--color-gold)", margin: "0 auto 12px", opacity: 0.7 }} />
            <p>Henüz fotoğraf yüklenmemiş.</p>
            <p style={{ fontSize: "0.8rem", marginTop: "4px" }}>İlk fotoğrafı siz yükleyin!</p>
          </div>
        ) : (
          <div className="gallery-grid">
            {photos.map((photo) => (
              <div key={photo.id} className="gallery-item">
                <img
                  src={photo.url}
                  alt="Düğün fotoğrafı"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onClick={() => setLightboxPhoto(photo)}
                  loading="lazy"
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: "linear-gradient(transparent, rgba(0,0,0,0.6))",
                    padding: "8px",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "8px",
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadPhoto(photo.url, photo.name);
                    }}
                    style={{
                      background: "rgba(255,255,255,0.9)",
                      border: "none",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--color-text-dark)",
                      cursor: "pointer",
                    }}
                    title="İndir"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePhoto(photo.name);
                    }}
                    style={{
                      background: "rgba(204,79,79,0.9)",
                      border: "none",
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      cursor: "pointer",
                    }}
                    title="Sil"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div className="lightbox" onClick={() => setLightboxPhoto(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightboxPhoto(null)}>
              <X size={28} />
            </button>
            <img src={(lightboxPhoto as any).url} alt="Büyük görünüm" />
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "16px",
                marginTop: "16px",
              }}
            >
              <button
                className="btn btn-primary"
                onClick={() => downloadPhoto((lightboxPhoto as any).url, (lightboxPhoto as any).name)}
                style={{ width: "auto", display: "flex", gap: "8px", padding: "10px 20px" }}
              >
                <Download size={18} /> İndir
              </button>
              <button
                className="btn"
                onClick={() => deletePhoto((lightboxPhoto as any).name)}
                style={{
                  width: "auto",
                  display: "flex",
                  gap: "8px",
                  padding: "10px 20px",
                  backgroundColor: "var(--color-error)",
                  color: "white",
                }}
              >
                <Trash2 size={18} /> Sil
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .spin {
          animation: spin 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            color: "var(--color-gold)",
          }}
        >
          <RefreshCw size={32} className="spin" />
        </div>
      }
    >
      <GalleryContent />
    </Suspense>
  );
}
