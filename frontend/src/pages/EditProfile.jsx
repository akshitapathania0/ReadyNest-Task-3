import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "../api/axios";
import { useAuthStore } from "../store/authStore";

const schema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_.]+$/, "Letters, numbers, . and _ only")
    .optional()
    .or(z.literal("")),
  bio: z.string().max(500).optional(),
});

export default function EditProfile() {
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [profileFile, setProfileFile] = useState(null);
  const [preview, setPreview] = useState(user?.profileImage || null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { username: user?.username || "", bio: user?.bio || "" },
  });

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function onSubmit(values) {
    setServerError("");
    try {
      const formData = new FormData();
      if (values.username) formData.append("username", values.username);
      if (values.bio !== undefined) formData.append("bio", values.bio);
      if (profileFile) formData.append("profileImage", profileFile);

      const { data } = await api.put(`/users/${user.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(data);
      navigate(`/profile/${user.id}`);
    } catch (err) {
      setServerError(err.message);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-6">Edit Profile</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {serverError && <p className="text-sm text-red-500">{serverError}</p>}

        <div className="flex items-center gap-4">
          <img
            src={preview || "/default-avatar.png"}
            alt="Profile"
            className="w-16 h-16 rounded-full object-cover border"
          />
          <label className="cursor-pointer text-sm text-brand font-semibold">
            Change photo
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            {...register("username")}
            className="w-full px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-brand"
          />
          {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            {...register("bio")}
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-brand resize-none"
          />
          {errors.bio && <p className="text-xs text-red-500 mt-1">{errors.bio.message}</p>}
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-md bg-brand text-white text-sm font-semibold disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/profile/${user?.id}`)}
            className="px-5 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
