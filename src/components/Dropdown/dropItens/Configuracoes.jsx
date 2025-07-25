import React, { useState, useEffect } from 'react';
import '../../styles/Config.css';
import { Link } from 'react-router-dom';
import { UserService } from '../../../services/userService'; // Certifique-se que este caminho está correto

const Config = () => {
  const [activeTab, setActiveTab] = useState('perfil');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState(''); // Estado para mensagens de erro
  const [editandoPerfil, setEditandoPerfil] = useState(false);
  const [editandoSenha, setEditandoSenha] = useState(false);

  const [userId, setUserId] = useState(null);
  const [nomeCompleto, setNomeCompleto] = useState(''); // Nome do campo correspondente ao backend
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmaSenha, setShowConfirmaSenha] = useState(false);

  // Efeito para carregar dados do usuário ao montar o componente
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Assume que UserService.getMe() busca os dados do usuário logado
        const data = await UserService.getMe();
        setUserId(data.id);
        console.log(data)
        setNomeCompleto(data.nome_completo || ''); 
        setEmail(data.email || '');
        setCpf(data.cpf || '');
      } catch (error) {
        console.error('Erro ao buscar dados do usuário logado:', error);
        setErrorMessage('Erro ao carregar seus dados. Por favor, tente novamente.');
        setTimeout(() => setErrorMessage(''), 5000);
      }
    };

    fetchUserData();
  }, []);

  const clearMessages = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleSalvarPerfil = async (e) => {
    e.preventDefault();
    clearMessages(); // Limpa mensagens anteriores

    if (!userId) {
      setErrorMessage('ID do usuário não encontrado para atualização.');
      return;
    }

    try {
      const updatedData = {
        nome_completo: nomeCompleto, 
        cpf: cpf,
        email: email,
      };


      const response = await UserService.updateUser(userId, updatedData);
      console.log(response)
      setSuccessMessage('Dados da conta atualizados com sucesso!');
      setEditandoPerfil(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
      // Extrai mensagens de erro específicas do backend para melhor feedback
      const errorDetail = error.response?.data?.detail || error.response?.data?.email || error.message || 'Erro ao atualizar os dados. Tente novamente.';
      setErrorMessage(`Erro: ${errorDetail}`);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  const handleSalvarSenha = async (e) => {
    e.preventDefault();
    clearMessages(); // Limpa mensagens anteriores

    if (!userId) {
      setErrorMessage('ID do usuário não encontrado para alteração de senha.');
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErrorMessage('A nova senha e a confirmação de senha não coincidem.');
      return;
    }

    // Validação básica de preenchimento dos campos de senha
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
        setErrorMessage('Por favor, preencha todos os campos de senha.');
        return;
    }

    try {
      await UserService.updatePassword(userId, {
        old_password: senhaAtual, 
        new_password: novaSenha,     
      });
      setSuccessMessage('Senha alterada com sucesso!');
      setEditandoSenha(false);
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      // Extrai mensagens de erro específicas do backend
      const errorDetail = error.response?.data?.detail || error.response?.data?.current_password || error.response?.data?.new_password || error.message || 'Erro ao alterar a senha. Verifique a senha atual e tente novamente.';
      setErrorMessage(`Erro: ${errorDetail}`);
      setTimeout(() => setErrorMessage(''), 5000);
    }
  };

  return (
    <div className="config-container">
      <h2 className="config-title">Configurações da Conta</h2>
      <div className="config-wrapper">
        <aside className="config-sidebar">
          <button className={`tab-button ${activeTab === 'perfil' ? 'active' : ''}`} onClick={() => setActiveTab('perfil')}>
            <i className="bi bi-person-circle"></i> Perfil
          </button>
          <button className={`tab-button ${activeTab === 'senha' ? 'active' : ''}`} onClick={() => setActiveTab('senha')}>
            <i className="bi bi-lock"></i> Alterar Senha
          </button>
          <Link to="/Home" className="tab-button voltar">
            <i className="bi bi-arrow-left-circle"></i> Voltar
          </Link>
        </aside>

        <section className="config-form">
          {successMessage && (
            <div className="success-message">
              <i className="bi bi-check-circle-fill"></i> {successMessage}
            </div>
          )}
          {errorMessage && (
            <div className="error-message"> {/* Usa uma classe dedicada para mensagens de erro */}
              <i className="bi bi-exclamation-circle-fill"></i> {errorMessage}
            </div>
          )}

          {activeTab === 'perfil' ? (
            <>
              <h3><i className="bi bi-gear"></i> Editar Conta</h3>
              <form onSubmit={handleSalvarPerfil}>
                <label>Nome Completo:</label> 
                <input
                  type="text"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  disabled={!editandoPerfil}
                  className={editandoPerfil ? 'editando' : ''}
                  placeholder="Nome do Usuário"
                />

                <label>CPF:</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  disabled={!editandoPerfil}
                  className={editandoPerfil ? 'editando' : ''}
                  placeholder="Número do CPF"
                />

                <label>E-mail:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!editandoPerfil}
                  className={editandoPerfil ? 'editando' : ''}
                  placeholder="E-mail do Usuário"
                />

                <div className="button-group">
                  <button type="button" className="btn danger" onClick={() => setEditandoPerfil(true)}>
                    <i className="bi bi-pencil"></i> Editar
                  </button>
                  {editandoPerfil && (
                    <button type="submit" className="btn primary">
                      <i className="bi bi-save"></i> Salvar
                    </button>
                  )}
                </div>
              </form>
            </>
          ) : (
            <>
              <h3><i className="bi bi-key"></i> Alterar Senha</h3>
              <form onSubmit={handleSalvarSenha}>
                <label>Senha Atual:</label>
                <div className="input-with-icon">
                  <input
                    type={showSenhaAtual ? 'text' : 'password'}
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    disabled={!editandoSenha}
                    className={editandoSenha ? 'editando' : ''}
                    placeholder="Senha Atual"
                  />
                  <i className={`bi ${showSenhaAtual ? 'bi-eye-slash' : 'bi-eye'}`} onClick={() => setShowSenhaAtual(!showSenhaAtual)} />
                </div>

                <label>Nova Senha:</label>
                <div className="input-with-icon">
                  <input
                    type={showNovaSenha ? 'text' : 'password'}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    disabled={!editandoSenha}
                    className={editandoSenha ? 'editando' : ''}
                    placeholder="Nova Senha"
                  />
                  <i className={`bi ${showNovaSenha ? 'bi-eye-slash' : 'bi-eye'}`} onClick={() => setShowNovaSenha(!showNovaSenha)} />
                </div>

                <label>Confirmar Senha:</label>
                <div className="input-with-icon">
                  <input
                    type={showConfirmaSenha ? 'text' : 'password'}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    disabled={!editandoSenha}
                    className={editandoSenha ? 'editando' : ''}
                    placeholder="Confirmar Nova Senha"
                  />
                  <i className={`bi ${showConfirmaSenha ? 'bi-eye-slash' : 'bi-eye'}`} onClick={() => setShowConfirmaSenha(!showConfirmaSenha)} />
                </div>

                <div className="button-group">
                  <button type="button" className="btn danger" onClick={() => setEditandoSenha(true)}>
                    <i className="bi bi-pencil"></i> Editar
                  </button>
                  {editandoSenha && (
                    <button type="submit" className="btn primary">
                      <i className="bi bi-save"></i> Salvar
                    </button>
                  )}
                </div>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Config;