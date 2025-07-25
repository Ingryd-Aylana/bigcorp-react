import api from "./api"; // Certifique-se de que este 'api' é a instância do Axios configurada com `withCredentials: true`

export const UserService = {
  /**
   * Realiza o login do usuário.
   * O token de acesso será definido como um cookie HttpOnly pelo backend.
   * @param {object} payload - Credenciais de login (email, password).
   * @returns {Promise<object>} - Promessa com dados do usuário (se o backend retornar algo além do token).
   */
  login: async (payload) => {
    // Certifique-se que a rota de login esteja correta.
    // Você mencionou '/token/' anteriormente para simplejwt, mas aqui está '/login/'.
    // Use a rota que está configurada em seu urls.py do Django para o CustomTokenObtainPairView.
    // Ex: Se for a rota padrão de simplejwt, use '/token/'.
    const response = await api.post("/login/", payload); 
    
    // IMPORTANTE: Se o backend estiver configurado para não retornar o token no corpo da resposta
    // (apenas via cookie), `response.data` pode estar vazio ou conter outros dados.
    // Você não precisa mais acessar `response.data.access` aqui.
    return response.data;
  },

  /**
   * Realiza o logout do usuário.
   * Não precisa de payload, pois o backend apenas instruirá o navegador a deletar o cookie.
   * @returns {Promise<any>} - Promessa indicando sucesso.
   */
  logout: async () => {
    // Para logout com cookies HttpOnly, o backend pode simplesmente enviar uma resposta
    // que instrui o navegador a deletar o cookie. O frontend apenas faz a requisição.
    // Se você não está usando refresh token, o payload não é necessário.
    const response = await api.post("/logout/");
    return response.data;
  },

  /**
   * Registra um novo usuário.
   * @param {object} payload - Detalhes do registro do usuário.
   * @returns {Promise<object>} - Promessa com os dados do novo usuário.
   */
  registerUser: async (payload) => {
    const response = await api.post("/users/", payload);
    return response.data;
  },

  /**
   * Busca todos os usuários.
   * @returns {Promise<Array<object>>} - Promessa com um array de usuários.
   */
  getAllUsers: async () => {
    const response = await api.get("/users");
    return response.data;
  },

  /**
   * Busca os detalhes do usuário atualmente autenticado.
   * O navegador enviará o cookie 'access_token' automaticamente.
   * @returns {Promise<object>} - Promessa com os detalhes do usuário.
   */
  getMe: async () => {
    const response = await api.get("/users/me/");
    return response.data;
  },

  /**
   * Atualiza um usuário por ID.
   * @param {number} userId - O ID do usuário a ser atualizado.
   * @param {object} payload - Dados parciais do usuário para atualização.
   * @returns {Promise<object>} - Promessa com os dados do usuário atualizado.
   */
  updateUser: async (userId, payload) => {
    const response = await api.patch(`/users/${userId}/`, payload);
    return response.data;
  },

  /**
   * Deleta um usuário por ID.
   * @param {number} userId - O ID do usuário a ser deletado.
   * @returns {Promise<any>} - Promessa indicando sucesso.
   */
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}/`);
    return response.data;
  },
  updatePassword: async (userId, payload) =>{
    const response = await api.post(`users/password/`, payload);
    return response.data;
  }
};