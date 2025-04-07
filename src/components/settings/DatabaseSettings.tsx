
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader, Database } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getDatabaseConfig, saveDatabaseConfig, checkDatabaseConnection } from "@/services/connectionTest";

const databaseSchema = z.object({
  host: z.string().min(1, { message: "Host é obrigatório" }),
  port: z.string().min(1, { message: "Porta é obrigatória" }),
  database: z.string().min(1, { message: "Nome do banco de dados é obrigatório" }),
  user: z.string().min(1, { message: "Usuário é obrigatório" }),
  password: z.string().min(1, { message: "Senha é obrigatória" }),
});

type DatabaseFormValues = z.infer<typeof databaseSchema>;

const DatabaseSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ connected: boolean; message?: string; diagnostics?: any }>();
  
  const form = useForm<DatabaseFormValues>({
    resolver: zodResolver(databaseSchema),
    defaultValues: {
      host: "",
      port: "5432",
      database: "",
      user: "",
      password: "",
    },
  });

  // Carrega configurações salvas
  useEffect(() => {
    const loadConfig = async () => {
      const config = getDatabaseConfig();
      if (config) {
        form.reset(config);
        console.log("Configurações de banco de dados carregadas:", config);
        
        // Verifica a conexão ao carregar as configurações
        const status = await checkDatabaseConnection();
        setConnectionStatus(status);
        console.log("Status da conexão ao carregar:", status);
      }
    };
    
    loadConfig();
  }, [form.reset]);

  const onSubmit = async (values: DatabaseFormValues) => {
    setIsLoading(true);
    console.log("Salvando configurações de banco de dados:", { ...values, password: "********" });
    
    try {
      // Salva as configurações
      saveDatabaseConfig(values);
      
      // Testa a conexão
      const status = await checkDatabaseConnection();
      setConnectionStatus(status);
      console.log("Status da conexão após salvar:", status);
      
      if (status.connected) {
        toast.success("Configurações de banco de dados salvas com sucesso!");
      } else {
        toast.warning("Configurações salvas, mas a conexão não pôde ser verificada.");
      }
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      toast.error("Erro ao salvar configurações de banco de dados");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Configurações de Banco de Dados
        </CardTitle>
        <CardDescription>
          Configure os parâmetros de conexão com o banco de dados PostgreSQL.
          Essas configurações serão usadas pelo servidor para conectar ao banco.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {connectionStatus && (
          <Alert className={`mb-4 ${connectionStatus.connected ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <AlertTitle className={connectionStatus.connected ? 'text-green-700' : 'text-yellow-700'}>
              {connectionStatus.connected ? 'Configuração salva' : 'Atenção'}
            </AlertTitle>
            <AlertDescription className={connectionStatus.connected ? 'text-green-600' : 'text-yellow-600'}>
              {connectionStatus.message}
              {process.env.NODE_ENV === 'development' && connectionStatus.diagnostics && (
                <div className="mt-2 text-xs">
                  <p>Diagnóstico:</p>
                  <pre className="bg-slate-100 p-2 rounded overflow-auto max-h-28">
                    {JSON.stringify(connectionStatus.diagnostics, null, 2)}
                  </pre>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Host</FormLabel>
                    <FormControl>
                      <Input placeholder="localhost ou IP" {...field} />
                    </FormControl>
                    <FormDescription>Endereço do servidor PostgreSQL</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Porta</FormLabel>
                    <FormControl>
                      <Input placeholder="5432" {...field} />
                    </FormControl>
                    <FormDescription>Porta padrão: 5432</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="database"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Banco</FormLabel>
                  <FormControl>
                    <Input placeholder="nome_do_banco" {...field} />
                  </FormControl>
                  <FormDescription>Nome do banco de dados PostgreSQL</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="user"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário</FormLabel>
                    <FormControl>
                      <Input placeholder="postgres" {...field} />
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
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                </>
              ) : (
                "Salvar Configurações"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default DatabaseSettings;
