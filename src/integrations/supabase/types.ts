export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      atendentes: {
        Row: {
          ativo: boolean | null
          data_atualizado: string | null
          data_criado: string | null
          email: string
          id: string
          nome: string
          url_imagem: string | null
        }
        Insert: {
          ativo?: boolean | null
          data_atualizado?: string | null
          data_criado?: string | null
          email: string
          id?: string
          nome: string
          url_imagem?: string | null
        }
        Update: {
          ativo?: boolean | null
          data_atualizado?: string | null
          data_criado?: string | null
          email?: string
          id?: string
          nome?: string
          url_imagem?: string | null
        }
        Relationships: []
      }
      etapas: {
        Row: {
          cor: string
          data_atualizado: string | null
          data_criado: string | null
          id: string
          nome: string
          numero: number
          numero_sistema: number | null
        }
        Insert: {
          cor: string
          data_atualizado?: string | null
          data_criado?: string | null
          id?: string
          nome: string
          numero: number
          numero_sistema?: number | null
        }
        Update: {
          cor?: string
          data_atualizado?: string | null
          data_criado?: string | null
          id?: string
          nome?: string
          numero?: number
          numero_sistema?: number | null
        }
        Relationships: []
      }
      login: {
        Row: {
          admin: boolean | null
          ativo: boolean | null
          data_atualizado: string | null
          data_criado: string | null
          id: string
          senha: string
          usuario: string
        }
        Insert: {
          admin?: boolean | null
          ativo?: boolean | null
          data_atualizado?: string | null
          data_criado?: string | null
          id?: string
          senha: string
          usuario: string
        }
        Update: {
          admin?: boolean | null
          ativo?: boolean | null
          data_atualizado?: string | null
          data_criado?: string | null
          id?: string
          senha?: string
          usuario?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          atendente_id: string | null
          data_atualizado: string | null
          data_criado: string | null
          data_saida_etapa1: string | null
          email_atendente: string
          etapa_numero: number | null
          id: string
          motivo: string
          nome: string
          nome_atendente: string | null
          numero_sistema: number | null
          setor: string | null
          telefone: string | null
          url_imagem_atendente: string | null
          user_ns: string
        }
        Insert: {
          atendente_id?: string | null
          data_atualizado?: string | null
          data_criado?: string | null
          data_saida_etapa1?: string | null
          email_atendente: string
          etapa_numero?: number | null
          id?: string
          motivo: string
          nome: string
          nome_atendente?: string | null
          numero_sistema?: number | null
          setor?: string | null
          telefone?: string | null
          url_imagem_atendente?: string | null
          user_ns: string
        }
        Update: {
          atendente_id?: string | null
          data_atualizado?: string | null
          data_criado?: string | null
          data_saida_etapa1?: string | null
          email_atendente?: string
          etapa_numero?: number | null
          id?: string
          motivo?: string
          nome?: string
          nome_atendente?: string | null
          numero_sistema?: number | null
          setor?: string | null
          telefone?: string | null
          url_imagem_atendente?: string | null
          user_ns?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_atendente_id_fkey"
            columns: ["atendente_id"]
            isOneToOne: false
            referencedRelation: "atendentes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_active: {
        Args: {
          email: string
        }
        Returns: {
          is_active: boolean
          is_admin: boolean
        }[]
      }
      insert_initial_etapas: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
