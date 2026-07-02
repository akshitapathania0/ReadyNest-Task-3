import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const schema = z.object({
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_.]+$/, "Letters, numbers, . and _ only"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

export default function Register() {
  const { register: registerUser } = useAuthStore();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [profileFile, setProfileFile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(values) {
    setServerError("");
    try {
      const formData = new FormData();
      formData.append("username", values.username);
      formData.append("email", values.email);
      formData.append("password", values.password);
      if (profileFile) formData.append("profileImage", profileFile);

      await registerUser(formData);
      navigate("/");
    } catch (err) {
      setServerError(err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center mb-6">InstaFlux</h1>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-6 space-y-3"
        >
          {serverError && <p className="text-sm text-red-500">{serverError}</p>}

          <div>
            <input
              {...register("username")}
              placeholder="Username"
              className="w-full px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-brand"
            />
            {errors.username && (
              <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>
            )}
          </div>

          <div>
            <input
              {...register("email")}
              type="email"
              placeholder="Email"
              className="w-full px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-brand"
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <input
              {...register("password")}
              type="password"
              placeholder="Password"
              className="w-full px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-brand"
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="text-xs text-gray-500">Profile picture (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfileFile(e.target.files?.[0] || null)}
              className="w-full text-sm mt-1"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 rounded-md bg-brand text-white text-sm font-semibold disabled:opacity-50"
          >
            {isSubmitting ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="text-center text-sm mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-brand font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
