import React, { useState } from "react";
import * as XLSX from "xlsx";
import "../styles/Consulta.css";
import { ConsultaService } from "../../services/consultaService";
import { FileSpreadsheet } from "lucide-react";

function formatDateBR(dateStr) {
  if (!dateStr) return "N/A";
  const onlyDate = dateStr.split("T")[0].split(" ")[0];
  const [yyyy, mm, dd] = onlyDate.split("-");
  if (yyyy && mm && dd) return `${dd}/${mm}/${yyyy}`;
  return dateStr;
}

const ConsultaPF = () => {
  const [activeForm, setActiveForm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);

  const [formData, setFormData] = useState({
    cpf: "",
    nome: "",
    dataNascimento: "",
    motherName: "",
    fatherName: "",
  });

  const [massConsultaMessage, setMassConsultaMessage] = useState("");
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "cpf") {
      formattedValue = value.replace(/\D/g, "").substring(0, 11);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResultado(null);
    setMassConsultaMessage("");

    let payload = {};
    let isFormValid = true;
    let validationErrorMessage = "";

    if (activeForm === "cpf") {
      if (formData.cpf.length !== 11) {
        validationErrorMessage =
          "Por favor, insira um CPF válido com 11 dígitos.";
        isFormValid = false;
      } else {
        payload = {
          tipo_consulta: "cpf",
          parametro_consulta: formData.cpf,
        };
      }
    } else if (activeForm === "chaves") {
      if (!formData.nome.trim()) {
        validationErrorMessage = "Por favor, preencha o campo Nome.";
        isFormValid = false;
      } else {
        const formattedBirthDate = formatDateBR(formData.dataNascimento)
          
        console.log(formattedBirthDate, formData.dataNascimento)
        payload = {
          tipo_consulta: "cpf_alternativa",
          parametro_consulta: JSON.stringify({
            Datasets: "basic_data",
            q: `name{${formData.nome}}, birthdate{${formattedBirthDate}},dateformat{dd/MM/yyyy}, mothername{${formData.motherName}}, fathername{${formData.fatherName}}`,
            Limit: 5,
          }),
        };
        console.log(payload);
      }
    }

    if (!isFormValid) {
      setError(validationErrorMessage);
      setLoading(false);
      return;
    }

    try {
      const response = await ConsultaService.realizarConsulta(payload);
      setResultado(response);
      console.log("Resultado da consulta PF:", response);
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Erro ao realizar consulta.";
      setError(errorMessage);
      console.error("Erro na consulta PF:", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };
  const handleMassFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      setMassConsultaMessage("Por favor, selecione um arquivo para upload.");
      return;
    }

    setLoading(true);
    setError(null);
    setResultado(null);
    setMassConsultaMessage("Lendo planilha e preparando para consulta...");

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const cpfsParaConsulta = jsonData.map((row) => ({
          CPF: String(row.CPF || "").replace(/\D/g, ""),
        }));

        const cpfsValidos = cpfsParaConsulta.filter(
          (item) => item.CPF.length === 11
        );

        if (cpfsValidos.length === 0) {
          setMassConsultaMessage(
            "Nenhum CPF válido encontrado na planilha. Verifique a coluna 'CPF'."
          );
          setLoading(false);
          if (event.target) event.target.value = null;
          return;
        }

        const requestBody = {
          cpfs: cpfsValidos,
          origem: "planilha",
        };

        setMassConsultaMessage(
          `Enviando ${cpfsValidos.length} CPFs para processamento em massa...`
        );
        const response = await ConsultaService.processarPlanilhaCPF(
          requestBody
        );
        const blob = response;
        const url = window.URL.createObjectURL(new Blob([blob]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "planilha-resultado-cpf.xlsx");
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        setMassConsultaMessage(
          "Processamento concluído! O download da planilha de resultados iniciou."
        );
      } catch (err) {
        console.error("Erro na comunicação ou processamento do arquivo:", err);
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Erro inesperado: Verifique sua conexão e o formato do arquivo.";
        setError(`Erro ao processar a planilha: ${errorMessage}`);
        setMassConsultaMessage("");
      } finally {
        setLoading(false);
        if (event.target) {
          event.target.value = null;
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };
  const handleDownloadModel = async () => {
    setLoading(true);
    setError(null);
    setMassConsultaMessage("Baixando planilha modelo de CPF...");
    try {
      const response = await ConsultaService.baixarPlanilhaModeloCPF();
      const blob = response;
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "modelo-cpf.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setMassConsultaMessage("Download do modelo concluído.");
    } catch (err) {
      console.error("Erro ao baixar modelo:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Erro na comunicação com o servidor para baixar o modelo.";
      setError(`Erro ao baixar modelo: ${errorMessage}`);
      setMassConsultaMessage("");
    } finally {
      setLoading(false);
    }
  };

  const [selectedResultIndex, setSelectedResultIndex] = useState(null);

  const handleExpandResult = (idx) => {
    setSelectedResultIndex(selectedResultIndex === idx ? null : idx);
  };

  return (
    <div className="consulta-container">
      <h2 className="titulo-pagina">Escolha a opção de consulta:</h2>

      <div className="card-options-wrapper">
        <div
          className={`card card-option ${activeForm === "cpf" ? "active" : ""}`}
          onClick={() => {
            setActiveForm("cpf");
            setFormData({ ...formData, cpf: "" });
            setError(null);
            setResultado(null);
            setMassConsultaMessage("");
          }}
        >
          <div className="icon-container">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="25"
              height="25"
              fill="white"
              className="bi bi-person-badge"
              viewBox="0 0 16 16"
            >
              <path d="M6.5 2a.5.5 0 0 0 0 1h3a.5.5 0 0 0 0-1zM11 5.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5z" />
              <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
              <path d="M11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
              <path d="M8 9.5a2.5 2.5 0 0 0-2.5 2.5V14h5v-2A2.5 2.5 0 0 0 8 9.5" />
            </svg>
          </div>
          <h5>Consulta por CPF</h5>
        </div>

        <div
          className={`card card-option ${
            activeForm === "chaves" ? "active" : ""
          }`}
          onClick={() => {
            setActiveForm("chaves");
            setFormData({
              cpf: "",
              nome: "",
              dataNascimento: "",
              motherName: "",
              fatherName: "",
            });
            setError(null);
            setResultado(null);
            setMassConsultaMessage("");
          }}
        >
          <div className="icon-container">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="white"
              viewBox="0 0 16 16"
            >
              <path d="M6.5 0A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0zm3 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5z" />
              <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1A2.5 2.5 0 0 1 9.5 5h-3A2.5 2.5 0 0 1 4 2.5zM10 8a1 1 0 1 1 2 0v5a1 1 0 1 1-2 0zm-6 4a1 1 0 1 1 2 0v1a1 1 0 1 1-2 0zm4-3a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0v-3a1 1 0 0 1 1-1" />
            </svg>
          </div>
          <h5>Chaves Alternativas</h5>
        </div>

        <div
          className={`card card-option ${
            activeForm === "massa" ? "active" : ""
          }`}
          onClick={() => {
            setActiveForm("massa");
            setError(null);
            setResultado(null);
            setMassConsultaMessage("");
          }}
        >
          <div className="icon-container">
            <FileSpreadsheet size={35} />
          </div>
          <h5>Consulta em Massa</h5>
        </div>
      </div>

      {activeForm === "cpf" && (
        <form className="form-container" onSubmit={handleSubmit}>
          <label htmlFor="cpf-input">Digite o documento</label>
          <input
            type="text"
            id="cpf-input"
            name="cpf"
            value={formData.cpf}
            onChange={handleFormChange}
            placeholder="Digite o CPF (apenas números)"
            required
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className={`consulta-btn ${loading ? "loading" : ""}`}
          >
            {loading ? "Consultando..." : "Consultar"}
          </button>

          {error && <p className="error-message">{error}</p>}
        </form>
      )}

      {activeForm === "cpf" &&
        resultado?.resultado_api?.Result &&
        resultado.resultado_api.Result.length > 0 && (
          <div className="card-resultado">
            <h4>Resultado da busca realizada</h4>
            {(() => {
              const resultItem = resultado.resultado_api.Result[0];
              const basicData = resultItem?.BasicData || {};
              return (
                <>
                  <label>Nome Completo:</label>
                  <input type="text" value={basicData.Name || "N/A"} disabled />
                  <label>CPF:</label>
                  <input
                    type="text"
                    value={basicData.TaxIdNumber || "N/A"}
                    disabled
                  />
                  <label>Situação Cadastral:</label>
                  <input
                    type="text"
                    value={basicData.TaxIdStatus || "N/A"}
                    disabled
                  />
                  <label>Data de Nascimento:</label>
                  <input
                    type="text"
                    value={formatDateBR(basicData.BirthDate)}
                    disabled
                  />
                  <label>Idade:</label>
                  <input type="text" value={basicData.Age || "N/A"} disabled />
                  <label>Nome da Mãe:</label>
                  <input
                    type="text"
                    value={basicData.MotherName || "N/A"}
                    disabled
                  />
                  <label>Nome do Pai:</label>
                  <input
                    type="text"
                    value={basicData.FatherName || "N/A"}
                    disabled
                  />
                  <label>Gênero:</label>
                  <input
                    type="text"
                    value={basicData.Gender || "N/A"}
                    disabled
                  />
                  <label>Nome Comum (Alias):</label>
                  <input
                    type="text"
                    value={basicData.Aliases?.CommonName || "N/A"}
                    disabled
                  />
                  <label>Indicação de Óbito:</label>
                  <input
                    type="text"
                    value={
                      basicData.HasObitIndication !== undefined
                        ? basicData.HasObitIndication
                          ? "Sim"
                          : "Não"
                        : "N/A"
                    }
                    disabled
                  />
                </>
              );
            })()}
          </div>
        )}

      {activeForm === "chaves" && (
        <form className="form-container" onSubmit={handleSubmit}>
          <label htmlFor="nome">
            Nome{" "}
            <span
              className="obrigatorio"
              title="Campo obrigatório para busca por chaves alternativas"
            >
              *
            </span>
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleFormChange}
            placeholder="Digite o nome"
            required
            disabled={loading}
          />
          <label htmlFor="dataNascimento">Data de Nascimento</label>
          <input
            type="date"
            id="dataNascimento"
            name="dataNascimento"
            value={formData.dataNascimento}
            onChange={handleFormChange}
            placeholder="DD/MM/AAAA"
            disabled={loading}
          />
          <label htmlFor="motherName">Nome da Mãe</label>
          <input
            type="text"
            id="motherName"
            name="motherName"
            value={formData.motherName}
            onChange={handleFormChange}
            placeholder="Digite o nome da mãe"
            disabled={loading}
          />
          <label htmlFor="fatherName">Nome do Pai</label>
          <input
            type="text"
            id="fatherName"
            name="fatherName"
            value={formData.fatherName}
            onChange={handleFormChange}
            placeholder="Digite o nome do pai"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !formData.nome.trim()}
            className={`consulta-btn ${loading ? "loading" : ""}`}
          >
            {loading ? "Consultando..." : "Consultar"}
          </button>

          {error && <p className="error-message">{error}</p>}
        </form>
      )}
      {activeForm === "massa" && (
        <div className="form-massa-container">
          <input
            type="file"
            id="input-massa"
            accept=".xlsx, .xls"
            style={{ display: "none" }}
            onChange={handleMassFileUpload}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => document.getElementById("input-massa").click()}
            disabled={loading}
          >
            Importar Planilha de CPFs
          </button>
          <button
            type="button"
            onClick={handleDownloadModel}
            disabled={loading}
          >
            Baixar Planilha Modelo
          </button>

          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>{" "}
              <p>{massConsultaMessage || "Processando..."}</p>{" "}
            </div>
          )}

          {!loading && massConsultaMessage && (
            <p className="message">{massConsultaMessage}</p>
          )}
          {error && <p className="error-message">{error}</p>}
        </div>
      )}

      {activeForm === "chaves" &&
        resultado?.resultado_api?.Result &&
        resultado.resultado_api.Result.length > 0 && (
          <div className="card-resultado">
            <h4>Resultados encontrados</h4>
            <table className="historico-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Data de Nascimento</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {resultado.resultado_api.Result.map((item, idx) => (
                  <React.Fragment key={idx}>
                    <tr
                      className={
                        selectedResultIndex === idx ? "active-row" : ""
                      }
                      onClick={() => handleExpandResult(idx)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{item.BasicData?.Name || "N/A"}</td>
                      <td>{item.BasicData?.TaxIdNumber || "N/A"}</td>
                      <td>{formatDateBR(item.BasicData?.BirthDate)}</td>
                      <td className="expand-icon">
                        <i
                          className={`bi ${
                            selectedResultIndex === idx
                              ? "bi-chevron-up"
                              : "bi-chevron-down"
                          }`}
                        ></i>
                      </td>
                    </tr>
                    {selectedResultIndex === idx && (
                      <tr>
                        <td colSpan="4">
                          <div className="detalhes-historico-panel">
                            <p>
                              <strong>Nome:</strong>{" "}
                              {item.BasicData?.Name || "N/A"}
                            </p>
                            <p>
                              <strong>CPF:</strong>{" "}
                              {item.BasicData?.TaxIdNumber || "N/A"}
                            </p>
                            <p>
                              <strong>Situação Cadastral:</strong>{" "}
                              {item.BasicData?.TaxIdStatus || "N/A"}
                            </p>
                            <p>
                              <strong>Data de Nascimento:</strong>{" "}
                              {formatDateBR(item.BasicData?.BirthDate)}
                            </p>
                            <p>
                              <strong>Nome da Mãe:</strong>{" "}
                              {item.BasicData?.MotherName || "N/A"}
                            </p>
                            <p>
                              <strong>Nome do Pai:</strong>{" "}
                              {item.BasicData?.FatherName || "N/A"}
                            </p>
                            <p>
                              <strong>Gênero:</strong>{" "}
                              {item.BasicData?.Gender || "N/A"}
                            </p>
                            <p>
                              <strong>Alias:</strong>{" "}
                              {item.BasicData?.Aliases?.CommonName || "N/A"}
                            </p>
                            <p>
                              <strong>Indicação de Óbito:</strong>{" "}
                              {item.BasicData?.HasObitIndication !== undefined
                                ? item.BasicData.HasObitIndication
                                  ? "Sim"
                                  : "Não"
                                : "N/A"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
};

export default ConsultaPF;
