
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createTicket } from "@/services";
import { toast } from "sonner";
import { Ticket } from "@/types";

const ticketSchema = z.object({
  nome: z.string().min(2, { message: "Nome é obrigatório" }),
  telefone: z.string().optional(),
  user_ns: z.string().min(2, { message: "ID do usuário é obrigatório" }),
  motivo: z.string().min(5, { message: "Descrição do motivo é obrigatória" }),
  setor: z.string().optional(),
  email_atendente: z.string().email({ message: "Email inválido" }),
  numero_sistema: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
});

type FormValues = z.infer<typeof ticketSchema>;

interface NewTicketFormProps {
  onTicketCreated: () => void;
}

const NewTicketForm = ({ onTicketCreated }: NewTicketFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      user_ns: "",
      motivo: "",
      setor: "",
      email_atendente: "",
      numero_sistema: undefined,
    }
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      const newTicketData = {
        nome: values.nome,
        telefone: values.telefone,
        user_ns: values.user_ns,
        motivo: values.motivo,
        setor: values.setor,
        email_atendente: values.email_atendente,
        etapa_numero: 1,
        numero_sistema: values.numero_sistema
      };
      
      await createTicket(newTicketData);
      toast.success("Chamado criado com sucesso!");
      form.reset();
      onTicketCreated();
    } catch (error) {
      console.error("Error creating ticket:", error);
      toast.error("Erro ao criar chamado");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Cliente</FormLabel>
                <FormControl>
                  <Input placeholder="Nome completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(00) 00000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="user_ns"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID do Cliente</FormLabel>
                <FormControl>
                  <Input placeholder="ID no sistema" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="setor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Setor</FormLabel>
                <FormControl>
                  <Input placeholder="Setor ou departamento" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numero_sistema"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número no Sistema</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Número do sistema externo" 
                    {...field} 
                    value={field.value || ''}
                    onChange={e => field.onChange(e.target.value ? e.target.value : undefined)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email_atendente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email do Atendente</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@exemplo.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="motivo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Descreva o motivo do chamado" 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Criando..." : "Criar Chamado"}
        </Button>
      </form>
    </Form>
  );
};

export default NewTicketForm;
