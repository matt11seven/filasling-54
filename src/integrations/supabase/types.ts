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
        Args: { email: string }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
