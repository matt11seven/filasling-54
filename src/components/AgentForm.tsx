
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { createAgent, updateAgent } from "@/services";
import { toast } from "sonner";
import { Agent } from "@/types";

const agentSchema = z.object({
  nome: z.string().min(2, { message: "Nome é obrigatório" }),
  email: z.string().email({ message: "Email inválido" }),
  url_imagem: z.string().optional(),
});

type FormValues = z.infer<typeof agentSchema>;

interface AgentFormProps {
  existingAgent?: Agent;
  onSuccess: () => void;
  onCancel: () => void;
}

const AgentForm = ({ existingAgent, onSuccess, onCancel }: AgentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      nome: existingAgent?.nome || "",
      email: existingAgent?.email || "",
      url_imagem: existingAgent?.url_imagem || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      if (existingAgent) {
        // Update existing agent
        await updateAgent(existingAgent.id, values);
        toast.success("Atendente atualizado com sucesso");
      } else {
        // Create new agent - ensure email is always provided since it's required
        await createAgent({
          nome: values.nome,
          email: values.email, // This is now explicitly provided
          url_imagem: values.url_imagem,
          ativo: true,
          cor: "#808080" // Default color
        });
        toast.success("Atendente criado com sucesso");
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error saving agent:", error);
      toast.error("Erro ao salvar atendente");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do atendente" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="email@exemplo.com" 
                  {...field}
                  disabled={!!existingAgent} // Email can't be changed if editing
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="url_imagem"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Imagem</FormLabel>
              <FormControl>
                <Input placeholder="https://exemplo.com/imagem.jpg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? "Salvando..." 
              : existingAgent ? "Atualizar" : "Cadastrar"
            }
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AgentForm;
