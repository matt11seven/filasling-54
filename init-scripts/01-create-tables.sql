
-- Criação das tabelas

-- Tabela atendentes
CREATE TABLE IF NOT EXISTS atendentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  url_imagem TEXT,
  ativo BOOLEAN DEFAULT TRUE,
  data_criado TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  data_atualizado TIMESTAMP WITH TIME ZONE
);

-- Tabela etapas
CREATE TABLE IF NOT EXISTS etapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  numero INTEGER NOT NULL,
  numero_sistema INTEGER,
  cor VARCHAR(50) NOT NULL,
  data_criado TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  data_atualizado TIMESTAMP WITH TIME ZONE
);

-- Tabela login
CREATE TABLE IF NOT EXISTS login (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario VARCHAR(255) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  admin BOOLEAN DEFAULT FALSE,
  ativo BOOLEAN DEFAULT TRUE,
  data_criado TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  data_atualizado TIMESTAMP WITH TIME ZONE
);

-- Tabela tickets
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  motivo TEXT NOT NULL,
  telefone VARCHAR(20),
  setor VARCHAR(100),
  user_ns VARCHAR(255) NOT NULL,
  email_atendente VARCHAR(255) NOT NULL,
  nome_atendente VARCHAR(255),
  atendente_id UUID REFERENCES atendentes(id),
  url_imagem_atendente TEXT,
  etapa_numero INTEGER DEFAULT 1,
  numero_sistema INTEGER,
  data_criado TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  data_atualizado TIMESTAMP WITH TIME ZONE,
  data_saida_etapa1 TIMESTAMP WITH TIME ZONE
);

-- Índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_atendentes_email ON atendentes(email);
CREATE INDEX IF NOT EXISTS idx_tickets_etapa_numero ON tickets(etapa_numero);
CREATE INDEX IF NOT EXISTS idx_tickets_atendente_id ON tickets(atendente_id);

-- Funções auxiliares
CREATE OR REPLACE FUNCTION check_user_active(email VARCHAR) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM login WHERE usuario = email AND ativo = TRUE
  );
END;
$$ LANGUAGE plpgsql;
