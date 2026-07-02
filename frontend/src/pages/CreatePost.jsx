import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ImagePlus, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../api/axios";

export default function CreatePost() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleFiles(e) {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    setFiles(selected);
    setPreviews(selected.map((f) => URL.createObjectURL(f)));
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!files.length) {
      setError("Please select at least one image.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("images", f));
      if (caption.trim()) formData.append("caption", caption.trim());

      await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await queryClient.invalidateQueries({ queryKey: ["feed"] });
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-6">New Post</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Image picker */}
        {previews.length === 0 ? (
          <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl py-16 cursor-pointer hover:border-brand transition-colors">
            <ImagePlus size={40} className="text-gray-400" />
            <span className="text-sm text-gray-500">Click to select images (up to 5)</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
          </label>
        ) : (
          <div>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square">
                  <img src={src} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-black/60 text-white rounded-full"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <label className="text-xs text-brand cursor-pointer">
              + Add more
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            </label>
          </div>
        )}

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption..."
          maxLength={2200}
          rows={3}
          className="w-full px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-brand resize-none"
        />
        <p className="text-xs text-gray-400 text-right">{caption.length}/2200</p>

        <button
          type="submit"
          disabled={loading || files.length === 0}
          className="w-full py-2 rounded-md bg-brand text-white text-sm font-semibold disabled:opacity-50"
        >
          {loading ? "Uploading to Cloudinary..." : "Share"}
        </button>
      </form>
    </div>
  );
}
