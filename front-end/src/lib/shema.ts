import { z } from "zod";
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];
export const signUpSchema = z
  .object({
    firstName: z
      .string()
      .min(3, "First name should contain at least 3 characters")
      .max(18),
    lastName: z
      .string()
      .min(3, "Last name should contain at least 3 characters")
      .max(18),
    email: z.string().email(),
    username: z.string().min(2, {
      message: "Username must be at least 2 characters.",
    }),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    image: z
      .any()
      .optional()
      .refine(
        (file) =>
          !file || (file.length > 0 && ACCEPTED_IMAGE_TYPES.includes(file[0]?.type)),
        "Only .jpg, .jpeg, .png and .webp formats are supported."
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export type TSignUpSchema = z.infer<typeof signUpSchema>;
