
-- Inserindo dados padrão para inicialização do sistema

-- Etapas padrão do sistema
INSERT INTO etapas (nome, numero, cor) VALUES
('Aguardando', 1, '#ff0000'),
('Em Atendimento', 2, '#ffaa00'),
('Finalizado', 3, '#00aa00')
ON CONFLICT (id) DO NOTHING;

-- Admin padrão (senha: admin123)
INSERT INTO login (usuario, senha, admin, ativo) VALUES
('matt@slingbr.com', '$2a$10$kIGEi/oH.hCF4Dn4X9TKiOF7m/36bmS7JMq1KVkH7xNBo5nFbVQm6', TRUE, TRUE),
('admin@example.com', '$2a$10$kIGEi/oH.hCF4Dn4X9TKiOF7m/36bmS7JMq1KVkH7xNBo5nFbVQm6', TRUE, TRUE)
ON CONFLICT (usuario) DO NOTHING;

-- Atendentes padrão para teste
INSERT INTO atendentes (nome, email, url_imagem, ativo) VALUES
('João Silva', 'joao.silva@example.com', 'https://i.pravatar.cc/150?u=joao', TRUE),
('Maria Souza', 'maria.souza@example.com', 'https://i.pravatar.cc/150?u=maria', TRUE),
('Carlos Ferreira', 'carlos.ferreira@example.com', 'https://i.pravatar.cc/150?u=carlos', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Tickets de exemplo
INSERT INTO tickets (nome, motivo, telefone, setor, user_ns, email_atendente, nome_atendente, etapa_numero) VALUES
('Alberto Fernandes', 'Problemas com login', '11987654321', 'Suporte Técnico', 'AF123456', 'joao.silva@example.com', 'João Silva', 1),
('Mariana Costa', 'Solicitação de novo equipamento', '11912345678', 'TI', 'MC789012', 'maria.souza@example.com', 'Maria Souza', 2),
('Pedro Alves', 'Dúvidas sobre faturamento', '11955554444', 'Financeiro', 'PA456789', 'joao.silva@example.com', 'João Silva', 3)
ON CONFLICT (id) DO NOTHING;

-- Atualizar os IDs dos atendentes nos tickets (necessário fazer em etapa separada para garantir que os IDs existam)
UPDATE tickets t
SET atendente_id = a.id
FROM atendentes a
WHERE t.email_atendente = a.email;

-- Atualizar as URLs de imagem dos atendentes nos tickets
UPDATE tickets t
SET url_imagem_atendente = a.url_imagem
FROM atendentes a
WHERE t.atendente_id = a.id;

-- Configurar script para execução manual de teste do banco de dados
DO $$
BEGIN
    RAISE NOTICE '=== BANCO DE DADOS INICIALIZADO COM SUCESSO ===';
    RAISE NOTICE 'Dados padrão inseridos:';
    RAISE NOTICE '- Usuário admin: matt@slingbr.com / admin123';
    RAISE NOTICE '- Usuário admin alternativo: admin@example.com / admin123';
    RAISE NOTICE '- 3 Etapas padrão criadas';
    RAISE NOTICE '- 3 Atendentes de exemplo criados';
    RAISE NOTICE '- 3 Tickets de exemplo criados';
    RAISE NOTICE '===========================================';
END $$;

