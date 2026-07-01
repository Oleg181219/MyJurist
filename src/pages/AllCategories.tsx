import React, { useState, useRef, useEffect, useCallback } from "react";
import { observer } from "mobx-react-lite";
import Header from "../components/Header";
import Modal from "../components/Modal";
import { useNavigate } from "react-router-dom";

const AllCategories: React.FC = () => {
  const navigate = useNavigate();
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [useTestClients, setUseTestClients] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Состояния для кастомного выпадающего списка
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Тестовые клиенты (резервные)
  const testClients = [
    { id: 1, name: "Иванов Иван Иванович" },
    { id: 2, name: "Петров Петр Петрович" },
    { id: 3, name: "Сидоров Сидор Сидорович" },
    { id: 4, name: "Трамп Дональд Фредович" },
    { id: 5, name: "Путин Владимир Владимирович" },
    { id: 6, name: "Тупенко Дятел Петрович" },
    { id: 7, name: "Долболобов Сергей Иванович" },
    { id: 8, name: "Чзооуке Петр Петрович" },
    { id: 9, name: "Шиалвуоы Иван Иванович" },
    { id: 10, name: "Ярпуклоипд Петр Петрович" },
    { id: 11, name: "Залу Иван Иванович" },
    { id: 12, name: "Цваплоитловка Петр Петрович" },
    { id: 13, name: "Щаьывкоь Иван Иванович" },
    { id: 14, name: "Щавпвкуце Петр Петрович" },
    { id: 15, name: "Иванов Хой Панкович" },
    { id: 16, name: "Идиотов Идиот Идиотович" },
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

  // Загрузка клиентов с сервера
  const fetchClients = async () => {
    setLoading(true);
    setApiError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const response = await fetch(`${apiUrl}/api/documents/getClients`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Проверяем, что данные - это массив с правильной структурой
      if (Array.isArray(data) && data.length > 0) {
        // Предполагаем, что сервер возвращает массив объектов с полями id и name
        const formattedClients = data.map((client: any) => ({
          id: client.id || client.clientId || client.userId || Math.random(),
          name:
            client.name || client.fullName || client.clientName || "Unknown",
        }));
        setClients(formattedClients);
        setUseTestClients(false);
      } else {
        // Если данные не в ожидаемом формате или пустые
        console.warn("Получены некорректные данные от сервера:", data);
        setUseTestClients(true);
        setApiError(
          "Получены некорректные данные от сервера, используем тестовых клиентов",
        );
      }
    } catch (error) {
      console.error("Ошибка при загрузке клиентов:", error);
      setApiError(
        "Не удалось загрузить список клиентов с сервера. Используем тестовых клиентов.",
      );
      setUseTestClients(true);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка клиентов при монтировании компонента
  useEffect(() => {
    fetchClients();
  }, []);

  // Фильтрация клиентов по поисковому запросу
  const currentClients = useTestClients ? testClients : clients;
  const filteredClients = currentClients.filter((client) =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Отображаемые клиенты (первые visibleCount)
  const displayedClients = filteredClients.slice(0, visibleCount);
  const hasMore = visibleCount < filteredClients.length;

  // Обработчик скролла для подгрузки следующих 10
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement;
      const bottom =
        target.scrollHeight - target.scrollTop <= target.clientHeight + 10;

      if (bottom && hasMore) {
        setVisibleCount((prev) => Math.min(prev + 10, filteredClients.length));
      }
    },
    [hasMore, filteredClients.length],
  );

  // Сброс видимого количества при изменении поиска
  useEffect(() => {
    setVisibleCount(10);
  }, [searchTerm]);

  // Закрытие дропдауна при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Фокус на поиск при открытии дропдауна
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  const handleSelectClient = (clientName: string, clientId: number) => {
    setSelectedClient(clientName);
    setSelectedClientId(clientId);
    setIsDropdownOpen(false);
    setSearchTerm("");
    if (error === "Добавьте клиента") {
      setError("");
    }
  };

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
    console.log("ID клиента:", selectedClientId);
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
          className="text-xl mb-2 cursor-pointer flex items-center hover:text-blue-600 transition-colors"
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
            {/* Выбор клиента с кастомным дропдауном */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите клиента
              </label>
              <div className="relative" ref={dropdownRef}>
                {/* Кнопка дропдауна */}
                <div
                  onClick={() => !loading && setIsDropdownOpen(!isDropdownOpen)}
                  className={`w-full md:w-96 px-4 py-2 rounded-xl border border-gray-200 bg-white cursor-pointer flex justify-between items-center hover:border-blue-300 transition-colors ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <span
                    className={
                      selectedClient ? "text-gray-800" : "text-gray-400"
                    }
                  >
                    {loading
                      ? "Загрузка клиентов..."
                      : selectedClient || "Выберите клиента..."}
                  </span>
                  <svg
                    className={`w-5 h-5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>

                {/* Выпадающий список */}
                {isDropdownOpen && !loading && (
                  <div className="absolute z-10 w-full md:w-96 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    {/* Поле поиска */}
                    <div className="p-2 border-b border-gray-200">
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Поиск по фамилии..."
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      />
                    </div>

                    {/* Список клиентов с виртуальной прокруткой */}
                    <div
                      className="max-h-80 overflow-y-auto"
                      onScroll={handleScroll}
                    >
                      {displayedClients.length > 0 ? (
                        <>
                          {displayedClients.map((client) => (
                            <div
                              key={client.id}
                              onClick={() =>
                                handleSelectClient(client.name, client.id)
                              }
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              {client.name}
                            </div>
                          ))}
                          {hasMore && (
                            <div className="px-4 py-2 text-center text-gray-400 text-sm">
                              Прокрутите для загрузки еще...
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-400">
                          Клиенты не найдены
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Информация о загрузке и ошибках */}
              <div className="mt-1">
                {loading && (
                  <p className="text-xs text-blue-500">
                    Загрузка списка клиентов...
                  </p>
                )}
                {apiError && (
                  <p className="text-xs text-yellow-600">{apiError}</p>
                )}
                {!loading && !apiError && (
                  <p className="text-xs text-gray-400">
                    Всего клиентов: {currentClients.length}. Начните вводить
                    фамилию для поиска
                  </p>
                )}
              </div>
            </div>

            {/* Блок документов - показывается только когда выбран клиент */}
            {selectedClient && (
              <div className="space-y-6">
                <div className="border-t border-gray-200 pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Выберите необходимые документы для{" "}
                    <span className="font-bold">{selectedClient}</span>
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
                  Создать и получить
                </button>
              </div>
            )}

            {/* Сообщение, если клиент не выбран */}
            {!selectedClient && !loading && (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                <svg
                  className="w-12 h-12 mx-auto mb-3 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <p>Выберите клиента, чтобы увидеть доступные документы</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default observer(AllCategories);
