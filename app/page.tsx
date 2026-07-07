"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { supabase, BUCKET_NAME } from "@/lib/supabase";
import { Heart, UploadCloud, Camera, CheckCircle2, AlertCircle, Image as ImageIcon, Sparkles } from "lucide-react";

interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

export default function Home() {
  const [uploads, setUploads] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: "success" | "error") => {
    const id = Math.random().toString(36).substring(2, 9) + Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleFiles = async (files: FileList) => {
    // Check if Supabase variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      showToast("Supabase bağlantısı henüz yapılandırılmadı. Lütfen kurulum adımlarını takip edin.", "error");
      return;
    }

    const validFiles = Array.from(files).filter((file) => {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showToast(`${file.name} geçerli bir resim dosyası değil.`, "error");
        return false;
      }
      // Validate size (max 15MB)
      if (file.size > 15 * 1024 * 1024) {
        showToast(`${file.name} çok büyük. Maksimum limit 15MB'dır.`, "error");
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    for (const file of validFiles) {
      uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    const fileId = Math.random().toString(36).substring(2, 9) + "-" + Date.now();
    const fileExtension = file.name.split(".").pop();
    const sanitizedOriginalName = file.name
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 30);
    const fileName = `${Date.now()}-${fileId}.${fileExtension}`;

    // Add to uploads state
    setUploads((prev) => [
      ...prev,
      { id: fileId, name: file.name, progress: 0, status: "uploading" },
    ]);

    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setUploads((prev) =>
              prev.map((u) => (u.id === fileId ? { ...u, progress: percent } : u))
            );
          },
        });

      if (error) throw error;

      setUploads((prev) =>
        prev.map((u) =>
          u.id === fileId ? { ...u, status: "success", progress: 100 } : u
        )
      );
      showToast(`${file.name} başarıyla yüklendi. Teşekkür ederiz!`, "success");
    } catch (err: any) {
      console.error(err);
      setUploads((prev) =>
        prev.map((u) =>
          u.id === fileId ? { ...u, status: "error", error: err.message } : u
        )
      );
      showToast(`${file.name} yüklenirken hata oluştu.`, "error");
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="container">
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
              onClick={() => removeToast(toast.id)}
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

      {/* Main Form Card */}
      <div className="card">
        {/* Header */}
        <header className="wedding-header">
          <Heart
            className="heart-icon"
            style={{
              color: "var(--color-gold)",
              width: "40px",
              height: "40px",
              animation: "pulse 2s infinite ease-in-out",
            }}
          />
          <h1 className="wedding-logo">Gelin & Damat</h1>
          <p style={{ color: "var(--color-gold-dark)", fontFamily: "var(--font-serif)", fontSize: "1.1rem" }}>
            Mutlu Günümüze Hoş Geldiniz!
          </p>
          <div className="gold-divider">
            <span>✧</span>
          </div>
          <p className="wedding-subtitle">
            Lütfen bu geceye ait en güzel karelerinizi, videolarınızı ve anılarınızı bizimle paylaşarak bu günü ölümsüzleştirin.
          </p>
        </header>

        {/* Upload Zone */}
        <div
          className={`upload-zone ${isDragging ? "dragging" : ""}`}
          onClick={triggerFileInput}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            multiple
            style={{ display: "none" }}
          />
          <div className="upload-icon">
            <Camera style={{ width: "28px", height: "28px" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "col", gap: "4px" }}>
            <p style={{ fontWeight: 600, color: "var(--color-text-dark)", fontSize: "1.1rem" }}>
              Fotoğraf Çek / Seç
            </p>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
              Galeriden seçin veya kameranızı kullanın
            </p>
          </div>
        </div>

        {/* Upload Progress List */}
        {uploads.length > 0 && (
          <div className="file-list">
            <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-light)", marginBottom: "4px" }}>
              Yükleme Durumu
            </p>
            {uploads.map((file) => (
              <div key={file.id} className="file-item">
                <div className="file-info">
                  <span className="file-name" title={file.name}>
                    {file.name}
                  </span>
                  <span
                    className="file-status"
                    style={{
                      color:
                        file.status === "success"
                          ? "var(--color-success)"
                          : file.status === "error"
                          ? "var(--color-error)"
                          : "var(--color-gold)",
                    }}
                  >
                    {file.status === "success" && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <CheckCircle2 size={14} /> Yüklendi
                      </span>
                    )}
                    {file.status === "error" && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <AlertCircle size={14} /> Hata
                      </span>
                    )}
                    {file.status === "uploading" && `${file.progress}%`}
                  </span>
                </div>
                {file.status === "uploading" && (
                  <div className="progress-container">
                    <div
                      className="progress-bar"
                      style={{ width: `${file.progress}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <footer style={{ marginTop: "40px", fontSize: "0.8rem", color: "var(--color-text-light)" }}>
          <p style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
            <Sparkles size={12} style={{ color: "var(--color-gold)" }} /> Sevgiyle paylaşılan anlar ölümsüzdür.
          </p>
        </footer>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
