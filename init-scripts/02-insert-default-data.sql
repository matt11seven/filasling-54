
-- Inserindo dados padrão para inicialização

-- Etapas padrão do sistema
INSERT INTO etapas (nome, numero, cor) VALUES
('Aguardando', 1, '#ff0000'),
('Em Atendimento', 2, '#ffaa00'),
('Finalizado', 3, '#00aa00')
ON CONFLICT (id) DO NOTHING;

-- Admin padrão (senha: admin123)
INSERT INTO login (usuario, senha, admin, ativo) VALUES
('matt@slingbr.com', '$2a$10$kIGEi/oH.hCF4Dn4X9TKiOF7m/36bmS7JMq1KVkH7xNBo5nFbVQm6', TRUE, TRUE)
ON CONFLICT (usuario) DO NOTHING;
