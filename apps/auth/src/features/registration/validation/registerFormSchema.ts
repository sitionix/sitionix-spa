import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Мінімум 8 символів")
  .regex(/[a-z]/, "Має бути хоча б 1 мала літера")
  .regex(/[A-Z]/, "Має бути хоча б 1 велика літера")
  .regex(/[0-9]/, "Має бути хоча б 1 цифра")
  .regex(/[^A-Za-z0-9]/, "Має бути хоча б 1 спецсимвол");

export const registerFormSchema = z
  .object({
    email: z.string().min(1, "Обовʼязково").email("Некоректний email"),
    name: z.string().min(2, "Мінімум 2 символи"),
    password: passwordSchema,
    passwordConfirm: z.string().min(1, "Обовʼязково"),
    rememberMe: z.boolean().default(false),
  })
  .refine((v) => v.passwordConfirm === v.password, {
    path: ["passwordConfirm"],
    message: "Паролі не співпадають",
  });

export type RegisterFormValues = z.infer<typeof registerFormSchema>;
