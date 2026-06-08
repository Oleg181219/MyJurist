import React, { useState } from "react";
import { observer } from "mobx-react-lite";
// import store from '../store/store';
import Header from "../components/Header";
import Modal from "../components/Modal";
import { useNavigate } from "react-router-dom";

const AllCategories: React.FC = () => {
  const navigate = useNavigate();
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [error, setError] = useState("");

  const clients = [
    { id: 1, name: "Иванов Иван Иванович" },
    { id: 2, name: "Петров Петр Петрович" },
  ];

  const documents = [
    "ФССП",
    "Управление РосАвиации",
    "ОСФР",
    "МРЭО ГИБДД",
    "МЧС (маломерные суда)",
    "БТИ",
    "РостовОблГосТехНадзор",
    "РосИмущество",
    "РосПатент",
    "Управление Росгвардии",
    "МИФНС",
    "СУД",
  ];

  const handleDocToggle = (doc: string) => {
    setSelectedDocs((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc],
    );
  };

  const handleSubmit = () => {
    if (!selectedClient) {
      setError("Добавьте клиента");
      return;
    }
    setError("");
    console.log("Клиент:", selectedClient);
    console.log("Выбранные документы:", selectedDocs);
    alert(
      `Запрос создан для ${selectedClient}\nДокументы: ${selectedDocs.join(", ") || "не выбраны"}`,
    );
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-100 via-blue-100 to-indigo-100">
      <Header />
      <Modal />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div
          onClick={() => navigate("/")}
          className="text-xl mb-2 cursor-pointer flex items-center"
        >
          <svg
            className="w-6 h-6 rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 5l7 7-7 7"
            />
          </svg>
          Назад
        </div>
        <div className="bg-white rounded-2xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Категории документов
          </h1>

          <div className="space-y-6">
            {/* Выбор клиента */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите клиента
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full md:w-96 px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">Выберите клиента...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.name}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Список документов с чекбоксами */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Выберите необходимые документы
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {documents.map((doc) => (
                  <label
                    key={doc}
                    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(doc)}
                      onChange={() => handleDocToggle(doc)}
                      className="w-5 h-5 text-blue-500 rounded focus:ring-blue-300"
                    />
                    <span className="text-gray-700">{doc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Ошибка */}
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Кнопка создания */}
            <button
              onClick={handleSubmit}
              className="w-full py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-medium text-lg transition-colors"
            >
              Создать и отправить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default observer(AllCategories);
