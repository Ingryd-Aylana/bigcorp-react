import React, { useState } from "react";
import "../styles/Comercial.css";
import "../styles/Conta.css"; // Para reutilizar estilos de modal customizado
import { ConsultaService } from "../../services/consultaService";
import { FaBuilding, FaSearch } from "react-icons/fa";

const ConsultaComercial = () => {
  // Estados individuais
  const [form, setForm] = useState({ cnpj: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal de detalhes
  const [showModal, setShowModal] = useState(false);
  const [modalPersonData, setModalPersonData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Consulta em massa
  const [file, setFile] = useState(null);
  const [bulkResults, setBulkResults] = useState([]);
  const [massConsultaMessage, setMassConsultaMessage] = useState("");
  const [massLoading, setMassLoading] = useState(false);

  // Manipuladores individuais
  const handleCnpjChange = (e) => {
    const onlyDigits = e.target.value.replace(/\D/g, "");
    setForm({ cnpj: onlyDigits.slice(0, 14) });
  };

  const handleSearch = async () => {
    setResult(null);
    setError(null);
    if (!form.cnpj) {
      setError("Por favor, digite um CNPJ.");
      return;
    }
    if (form.cnpj.length < 14) {
      setError("O CNPJ deve conter 14 dígitos.");
      return;
    }
    setLoading(true);
    try {
      const { resultado_api } = await ConsultaService.consultarComercial(form.cnpj);
      console.log(resultado_api)
      const empresa = resultado_api?.Result?.[0] || null;
      if (empresa) {
        setResult(empresa);
      } else {
        setError("Nenhum resultado de empresa encontrado para o CNPJ fornecido.");
      }
    } catch (err) {
      setError(err.message || "Ocorreu um erro ao consultar o CNPJ da empresa.");
    } finally {
      setLoading(false);
    }
  };

  // Detalhes de pessoa no modal
  const handlePersonClick = async (person) => {
    const cpf = person.RelatedEntityTaxIdNumber;
    if (!cpf || person.RelatedEntityTaxIdType !== "CPF") {
      setModalError("CPF não disponível ou tipo de documento inválido.");
      setShowModal(true);
      return;
    }
    setModalLoading(true);
    setModalError(null);
    setModalPersonData(null);
    try {
      const { resultado_api } = await ConsultaService.consultarContatoComercial(cpf);
      const regData = resultado_api?.Result?.[0]?.RegistrationData || null;
      if (regData) setModalPersonData(regData);
      else setModalError("Nenhum dado de contato encontrado para esta pessoa.");
    } catch (err) {
      setModalError(err.message || "Erro ao consultar detalhes de contato.");
    } finally {
      setModalLoading(false);
      setShowModal(true);
    }
  };

  // Renderizar relacionamentos filtrados
  const renderFilteredRelationships = (rels, title) => {
    if (!rels?.length) return null;
    const filtered = rels.filter(
      (r) =>
        r.RelationshipType === "QSA" ||
        r.RelationshipType === "Ownership" ||
        r.RelationshipType === "REPRESENTANTELEGAL"
    );
    if (!filtered.length) return null;
    return (
      <>
        <h6 className="rel-title">{title}:</h6>
        <ul className="rel-list">
          {filtered.map((p, i) => (
            <li key={`${p.RelatedEntityTaxIdNumber}-${i}`} className="rel-list-item">
              <div className="rel-info">
                <strong>{p.RelatedEntityName || "Nome N/A"}</strong><br />
                <span className="rel-type">Tipo: {p.RelationshipType}</span><br />
                <span className="rel-cpf">CPF: {p.RelatedEntityTaxIdNumber}</span>
              </div>
              <button
                className="btn-rel-details"
                onClick={() => handlePersonClick(p)}
                title="Ver Detalhes"
              >
                Ver Detalhes
              </button>
            </li>
          ))}
        </ul>
      </>
    );
  };

  // Manipuladores de upload CSV
  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
    setBulkResults([]);
    setMassConsultaMessage("");
  };

  const handleBulkSearch = () => {
    if (!file) {
      alert("Selecione um arquivo CSV com CNPJs.");
      return;
    }
    setMassLoading(true);
    setMassConsultaMessage("");
    const reader = new FileReader();
    reader.onload = async (e) => {
      const lines = e.target.result.split("\n").map((l) => l.trim()).filter(Boolean);
      const results = [];
      for (const cnpj of lines) {
        try {
          const { resultado_api } = await ConsultaService.consultarComercial(cnpj);
          const emp = resultado_api?.Result?.[0] || null;
          results.push({ cnpj, empresa: emp, erro: !emp });
        } catch {
          results.push({ cnpj, empresa: null, erro: true });
        }
      }
      setBulkResults(results);
      setMassLoading(false);
      setMassConsultaMessage("Consulta em massa concluída.");
    };
    reader.readAsText(file);
  };

  // Download de planilha modelo
  const handleDownloadModel = async () => {
    setMassLoading(true);
    setMassConsultaMessage("Baixando modelo...");
    try {
      const response = await ConsultaService.baixarPlanilhaModeloCNPJ();
      const blob = new Blob([response], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "modelo-cnpj.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMassConsultaMessage("Download do modelo concluído.");
    } catch {
      setMassConsultaMessage("Erro ao baixar modelo.");
    } finally {
      setMassLoading(false);
    }
  };

  return (
    <div className="comercial-page">
      {/* Cabeçalho */}
      <div className="card-opcoes">
        <div className="icon-container">
          <FaBuilding className="icon-opcao" />
        </div>
        <h2 className="titulo-principal">Consulta Comercial</h2>
        <p className="opcao-texto">
          Preencha o CNPJ da empresa para consultar os dados dos sócios e representantes.
        </p>
      </div>

      {/* Container Flex com dois cards */}
      <div className="form-card-container">
        {/* Card Individual */}
        <div className="form-card">
          <div className="card-body">
            <label className="form-label">CNPJ:</label>
            <input
              type="text"
              className="form-control"
              placeholder="Digite apenas os 14 dígitos do CNPJ"
              value={form.cnpj}
              onChange={handleCnpjChange}
              maxLength="18"
            />
            <button
              className="btn-primary"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? "Consultando..." : <> <FaSearch className="btn-icon" /> Consultar </>}
            </button>
            {error && <div className="alert-erro mt-3">{error}</div>}
          </div>
        </div>

        {/* Card Consulta em Massa */}
        <div className="form-card">
          <div className="card-body">
            <label className="form-label">Consulta em massa:</label>
            <input
              type="file"
              id="input-massa-cnpj"
              accept=".xlsx, .xls"
              style={{ display: "none" }}
              onChange={handleFileChange}
              disabled={massLoading}
            />
            <button
             className="btn-primary"
            type="button"
            onClick={() => document.getElementById("input-massa").click()}
            disabled={loading}
          >
            Importar Planilha de CNPJs
          </button>
          <button
           className="btn-primary mt-2"
            type="button"
            onClick={handleDownloadModel}
            disabled={loading}
          >
            Baixar Planilha Modelo
          </button>
            {massLoading && <p>Processando planilha...</p>}
            {massConsultaMessage && (
              <p className={massConsultaMessage.includes("Erro") ? "error-message" : "message"}>
                {massConsultaMessage}
              </p>
            )}
            {bulkResults.length > 0 && (
              <div className="bulk-results mt-3">
                <h5>Resultados:</h5>
                <ul>
                  {bulkResults.map((item, idx) => (
                    <li key={idx}>
                      <strong>{item.cnpj}:</strong>{" "}
                      {item.erro
                        ? "Erro ao consultar"
                        : `Empresa ${item.empresa ? "encontrada" : "não encontrada"}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resultado Individual */}
      {result && (
        <div className="form-card mt-4">
          <div className="card-body">
            {renderFilteredRelationships(
              result.Relationships.CurrentRelationships,
              "Sócios, Administradores e Representantes Legais"
            )}
            {!result.Relationships.CurrentRelationships?.length && (
              <p className="no-rel-msg">
                Nenhum sócio, administrador ou representante legal encontrado para este CNPJ.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Detalhes de Contato da Pessoa</h3>
            <button
              className="btn-icon modal-close"
              onClick={() => setShowModal(false)}
              title="Fechar"
            >
              ×
            </button>
            <div>
              {modalLoading && (
                <div className="modal-loading">
                  <div className="spinner"></div>
                  <p>Buscando detalhes de contato...</p>
                </div>
              )}
              {modalError && <div className="alert-erro">{modalError}</div>}
              {modalPersonData && !modalLoading && !modalError && (
                <div>
                  <h6>Informações Básicas:</h6>
                  <p><strong>Nome:</strong> {modalPersonData.BasicData?.Name || "N/A"}</p>
                  <p><strong>CPF:</strong> {modalPersonData.BasicData?.TaxIdNumber || "N/A"}</p>
                  <p><strong>Gênero:</strong> {modalPersonData.BasicData?.Gender || "N/A"}</p>
                  <p><strong>Data de Nascimento:</strong>{" "}
                    {modalPersonData.BasicData?.BirthDate
                      ? new Date(modalPersonData.BasicData.BirthDate).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <p><strong>Nome da Mãe:</strong> {modalPersonData.BasicData?.MotherName || "N/A"}</p>
                  <p><strong>Status do CPF:</strong> {modalPersonData.BasicData?.TaxIdStatus || "N/A"}</p>

                  {/* E-mails */}
                  {modalPersonData.Emails && (
                    <>
                      <h6 className="mt-3">E-mails:</h6>
                      {modalPersonData.Emails.Primary?.EmailAddress && (
                        <p><strong>Principal:</strong> {modalPersonData.Emails.Primary.EmailAddress}</p>
                      )}
                      {modalPersonData.Emails.Secondary?.EmailAddress && (
                        <p><strong>Secundário:</strong> {modalPersonData.Emails.Secondary.EmailAddress}</p>
                      )}
                      {!modalPersonData.Emails.Primary?.EmailAddress &&
                        !modalPersonData.Emails.Secondary?.EmailAddress && (
                          <p>Nenhum e-mail disponível.</p>
                        )}
                    </>
                  )}

                  {/* Endereços */}
                  {modalPersonData.Addresses && (
                    <>
                      <h6 className="mt-3">Endereços:</h6>
                      {modalPersonData.Addresses.Primary && (
                        <p>
                          <strong>Principal:</strong> {modalPersonData.Addresses.Primary.AddressMain}, {modalPersonData.Addresses.Primary.Number}
                        </p>
                      )}
                      {modalPersonData.Addresses.Secondary && (
                        <p>
                          <strong>Secundário:</strong> {modalPersonData.Addresses.Secondary.AddressMain}, {modalPersonData.Addresses.Secondary.Number}
                        </p>
                      )}
                      {!modalPersonData.Addresses.Primary &&
                        !modalPersonData.Addresses.Secondary && (
                          <p>Nenhum endereço disponível.</p>
                        )}
                    </>
                  )}

                  {/* Telefones */}
                  {modalPersonData.Phones && (
                    <>
                      <h6 className="mt-3">Telefones:</h6>
                      {modalPersonData.Phones.Primary?.PhoneNumber && (
                        <p><strong>Principal:</strong> {modalPersonData.Phones.Primary.PhoneNumber}</p>
                      )}
                      {modalPersonData.Phones.Secondary?.PhoneNumber && (
                        <p><strong>Secundário:</strong> {modalPersonData.Phones.Secondary.PhoneNumber}</p>
                      )}
                      {!modalPersonData.Phones.Primary?.PhoneNumber &&
                        !modalPersonData.Phones.Secondary?.PhoneNumber && (
                          <p>Nenhum telefone disponível.</p>
                        )}
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setShowModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultaComercial;
