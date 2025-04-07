
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signupUser } from "@/services/auth";
import { InfoIcon, Loader } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const signupSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter pelo menos 6 caracteres" }),
});

type FormValues = z.infer<typeof signupSchema>;

interface SignupFormProps {
  onSwitchMode: () => void;
  onSignupSuccess: () => void;
}

const SignupForm = ({ onSwitchMode, onSignupSuccess }: SignupFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);
      setErrorMessage(null);
      
      // Criar conta
      const success = await signupUser(values.email, values.password);
      
      if (success) {
        onSignupSuccess();
      }
    } catch (error) {
      console.error("Erro:", error);
      setErrorMessage("Ocorreu um erro no processo de registro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {errorMessage && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <InfoIcon className="h-4 w-4 text-red-500" />
          <AlertTitle className="text-red-700">Erro</AlertTitle>
          <AlertDescription className="text-red-600">
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="seu.email@exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="******" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" /> Criando conta...
              </>
            ) : (
              "Criar Conta"
            )}
          </Button>
        </form>
      </Form>
      
      <div className="mt-4 text-center">
        <Button 
          variant="link" 
          onClick={onSwitchMode} 
          className="p-0"
        >
          Já possui uma conta? Faça login
        </Button>
      </div>
    </>
  );
};

export default SignupForm;
