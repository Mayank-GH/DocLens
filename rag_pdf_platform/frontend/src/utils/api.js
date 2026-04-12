import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const getApiKey = () => localStorage.getItem("groq_api_key") || "";

export const uploadDocument = (file, onProgress) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/documents/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => onProgress && onProgress(Math.round((e.loaded / e.total) * 100)),
  });
};

export const listDocuments = () => api.get("/documents/");
export const getDocument = (id) => api.get(`/documents/${id}`);
export const deleteDocument = (id) => api.delete(`/documents/${id}`);

export const sendChat = (payload) =>
  api.post("/chat/", { ...payload, api_key: getApiKey() });

export const analyzeDocuments = (doc_id_a, doc_id_b) =>
  api.post("/compare/analyze", { doc_id_a, doc_id_b, api_key: getApiKey() });

export const compareQuery = (doc_id_a, doc_id_b, query) =>
  api.post("/compare/query", { doc_id_a, doc_id_b, query, api_key: getApiKey() });

export default api;
