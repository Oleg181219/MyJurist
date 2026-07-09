import React, { useState, useRef, useEffect, useCallback } from "react";
import { observer } from "mobx-react-lite";
import Header from "../components/Header";
import Modal from "../components/Modal";
import { useNavigate } from "react-router-dom";
import store from "../store/store";

interface Client {
  id: string;
  ownerId: string;
  fullName: string;
  fullNameShort: string;
  region: number;
}

interface CourtDecision {
  id: string;
  courtName: string;
  decisionDate: string;
  caseNumber: string;
}

interface Organization {
  id: string;
  orgName: string;
  orgAddr: string;
}

interface ApiResponse {
  result: string;
  clientSprDto: Client[];
}

interface GenerateResponse {
  success?: boolean;
  message?: string;
  data?: any;
}

const AllCategories: React.FC = () => {
  const navigate = useNavigate();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  // Данные по выбранному клиенту
  const [courtDecisions, setCourtDecisions] = useState<CourtDecision[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Состояния для генерации
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState<GenerateResponse | null>(
    null,
  );
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Загрузка клиентов с сервера
  const fetchClients = async () => {
    setLoading(true);
    setApiError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = store.getAuthHeader();

      if (!token) {
        throw new Error("Токен авторизации не найден");
      }

      const response = await fetch(`${apiUrl}/api/documents/getClients`, {
        method: "GET",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Сессия истекла. Пожалуйста, войдите заново.");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (
        data.result === "complete" &&
        Array.isArray(data.clientSprDto) &&
        data.clientSprDto.length > 0
      ) {
        setClients(data.clientSprDto);
      } else if (
        data.result === "complete" &&
        Array.isArray(data.clientSprDto) &&
        data.clientSprDto.length === 0
      ) {
        setApiError("Список клиентов пуст");
        setClients([]);
      } else {
        setApiError("Получены некорректные данные от сервера");
        setClients([]);
      }
    } catch (error) {
      console.error("Ошибка при загрузке клиентов:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";
      setApiError(`Не удалось загрузить список клиентов: ${errorMessage}`);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка деталей по выбранному клиенту
  const fetchClientDetails = async (clientId: string, region: number) => {
    setLoadingDetails(true);
    setDetailsError(null);
    setCourtDecisions([]);
    setOrganizations([]);
    setSelectedOrgIds([]);
    setGenerateResult(null);
    setGenerateError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = store.getAuthHeader();

      if (!token) {
        throw new Error("Токен авторизации не найден");
      }

      const [courtDecisionsResponse, organizationsResponse] = await Promise.all(
        [
          fetch(`${apiUrl}/api/documents/getCourtDecisions/${clientId}`, {
            method: "GET",
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${apiUrl}/api/documents/getOrganizations/${region}`, {
            method: "GET",
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
          }),
        ],
      );

      if (courtDecisionsResponse.ok) {
        const courtData = await courtDecisionsResponse.json();
        if (Array.isArray(courtData)) {
          setCourtDecisions(courtData);
        } else {
          console.warn(
            "Некорректный формат данных судебных решений:",
            courtData,
          );
          setCourtDecisions([]);
        }
      } else {
        if (courtDecisionsResponse.status === 403) {
          setDetailsError(
            "Нет доступа к данным судебных решений. Проверьте права доступа.",
          );
        } else if (courtDecisionsResponse.status === 404) {
          setDetailsError("Судебные решения для этого клиента не найдены");
        } else {
          setDetailsError(
            `Ошибка загрузки судебных решений: ${courtDecisionsResponse.status}`,
          );
        }
        console.error(
          "Ошибка загрузки судебных решений:",
          courtDecisionsResponse.status,
        );
      }

      if (organizationsResponse.ok) {
        const orgData = await organizationsResponse.json();
        if (Array.isArray(orgData)) {
          setOrganizations(orgData);
        } else {
          console.warn("Некорректный формат данных организаций:", orgData);
          setOrganizations([]);
        }
      } else {
        if (organizationsResponse.status === 403) {
          setDetailsError((prev) =>
            prev
              ? `${prev}; Нет доступа к данным организаций`
              : "Нет доступа к данным организаций",
          );
        } else if (organizationsResponse.status === 404) {
          setDetailsError((prev) =>
            prev
              ? `${prev}; Организации для этого региона не найдены`
              : "Организации для этого региона не найдены",
          );
        } else {
          setDetailsError((prev) =>
            prev
              ? `${prev}; Ошибка загрузки организаций: ${organizationsResponse.status}`
              : `Ошибка загрузки организаций: ${organizationsResponse.status}`,
          );
        }
        console.error(
          "Ошибка загрузки организаций:",
          organizationsResponse.status,
        );
      }
    } catch (error) {
      console.error("Ошибка при загрузке деталей клиента:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";
      setDetailsError(`Ошибка загрузки данных: ${errorMessage}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Генерация запроса
  const handleGenerate = async () => {
    if (!selectedClient) {
      setError("Добавьте клиента");
      return;
    }

    if (selectedOrgIds.length === 0) {
      setError("Выберите хотя бы одну организацию");
      return;
    }

    setError("");
    setIsGenerating(true);
    setGenerateResult(null);
    setGenerateError(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = store.getAuthHeader();

      if (!token) {
        throw new Error("Токен авторизации не найден");
      }

      // Получаем ID первого судебного решения (если есть)
      const courtDecisionId =
        courtDecisions.length > 0 ? courtDecisions[0].id : null;

      const requestBody = {
        clientId: selectedClient.id,
        documentsIds: selectedOrgIds,
        courtDecisions: courtDecisionId,
      };

      console.log("Отправляемый запрос:", requestBody);

      const response = await fetch(`${apiUrl}/api/documents/generate`, {
        method: "POST",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ошибка сервера: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      setGenerateResult(result);
      console.log("Результат генерации:", result);
    } catch (error) {
      console.error("Ошибка при генерации:", error);
      setGenerateError(
        error instanceof Error ? error.message : "Неизвестная ошибка",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Обработка выбора организации (чекбокс)
  const handleOrgToggle = (orgId: string) => {
    setSelectedOrgIds((prev) =>
      prev.includes(orgId)
        ? prev.filter((id) => id !== orgId)
        : [...prev, orgId],
    );
    if (error === "Выберите хотя бы одну организацию") {
      setError("");
    }
  };

  // Загрузка клиентов при монтировании компонента
  useEffect(() => {
    if (!store.user) {
      store.openModal("login");
      return;
    }
    fetchClients();
  }, []);

  // Фильтрация клиентов по поисковому запросу
  const filteredClients = clients.filter((client) =>
    client.fullName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const displayedClients = filteredClients.slice(0, visibleCount);
  const hasMore = visibleCount < filteredClients.length;

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

  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    setIsDropdownOpen(false);
    setSearchTerm("");
    setSelectedOrgIds([]);
    setGenerateResult(null);
    setGenerateError(null);
    if (
      error === "Добавьте клиента" ||
      error === "Выберите хотя бы одну организацию"
    ) {
      setError("");
    }
    fetchClientDetails(client.id, client.region);
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
            {/* Выбор клиента */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Выберите клиента
              </label>
              <div className="relative" ref={dropdownRef}>
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
                      : selectedClient?.fullName || "Выберите клиента..."}
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

                {isDropdownOpen && !loading && (
                  <div className="absolute z-10 w-full md:w-96 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
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

                    <div
                      className="max-h-80 overflow-y-auto"
                      onScroll={handleScroll}
                    >
                      {displayedClients.length > 0 ? (
                        <>
                          {displayedClients.map((client) => (
                            <div
                              key={client.id}
                              onClick={() => handleSelectClient(client)}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium">
                                {client.fullName}
                              </div>
                              <div className="text-xs text-gray-400 flex gap-3">
                                <span>Регион: {client.region}</span>
                                <span>ID: {client.id.slice(0, 8)}...</span>
                              </div>
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

              <div className="mt-1">
                {loading && (
                  <p className="text-xs text-blue-500">
                    Загрузка списка клиентов...
                  </p>
                )}
                {apiError && (
                  <p className="text-xs text-yellow-600">{apiError}</p>
                )}
                {!loading && !apiError && clients.length > 0 && (
                  <p className="text-xs text-gray-400">
                    Всего клиентов: {clients.length}. Начните вводить фамилию
                    для поиска
                  </p>
                )}
              </div>
            </div>

            {/* Информация о загруженных данных */}
            {selectedClient && (
              <div className="space-y-4">
                {loadingDetails && (
                  <div className="text-center py-4">
                    <p className="text-blue-500">
                      Загрузка данных по клиенту...
                    </p>
                  </div>
                )}

                {detailsError && (
                  <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-xl text-sm">
                    {detailsError}
                  </div>
                )}

                {!loadingDetails && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-medium text-gray-700 mb-2">
                        Судебные решения
                      </h3>
                      <p className="text-2xl font-bold text-blue-600">
                        {courtDecisions.length}
                      </p>
                      {courtDecisions.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {courtDecisions.slice(0, 2).map((decision, idx) => (
                            <div key={idx} className="truncate">
                              {decision.caseNumber} - {decision.courtName}
                            </div>
                          ))}
                          {courtDecisions.length > 2 && (
                            <div>+ еще {courtDecisions.length - 2}</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-medium text-gray-700 mb-2">
                        Доступные организации
                      </h3>
                      <p className="text-2xl font-bold text-green-600">
                        {organizations.length}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Выберите необходимые организации
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Список организаций с чекбоксами (в 2 колонки) */}
            {selectedClient && organizations.length > 0 && !loadingDetails && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Выберите необходимые организации для{" "}
                  <span className="font-bold">{selectedClient.fullName}</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {organizations.map((org) => (
                    <label
                      key={org.id}
                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedOrgIds.includes(org.id)}
                        onChange={() => handleOrgToggle(org.id)}
                        className="w-5 h-5 text-blue-500 rounded focus:ring-blue-300 mt-0.5 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 wrap-break-word">
                          {org.orgName}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5 wrap-break-word">
                          {org.orgAddr}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {selectedOrgIds.length > 0 && (
                  <p className="text-sm text-blue-600">
                    Выбрано организаций: {selectedOrgIds.length}
                  </p>
                )}
              </div>
            )}

            {/* Сообщение, если организации не найдены */}
            {selectedClient &&
              organizations.length === 0 &&
              !loadingDetails &&
              !detailsError && (
                <div className="text-center py-6 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                  <p>Организации для этого региона не найдены</p>
                </div>
              )}

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            {/* Результат генерации */}
            {generateResult && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h4 className="font-medium text-green-800 mb-2">
                  ✅ Запрос успешно создан!
                </h4>
                <pre className="text-sm text-green-700 whitespace-pre-wrap">
                  {JSON.stringify(generateResult, null, 2)}
                </pre>
              </div>
            )}

            {generateError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h4 className="font-medium text-red-800 mb-2">
                  ❌ Ошибка при создании запроса
                </h4>
                <p className="text-sm text-red-700">{generateError}</p>
              </div>
            )}

            {/* Кнопка отправки */}
            {selectedClient && (
              <button
                onClick={handleGenerate}
                disabled={
                  loadingDetails || isGenerating || organizations.length === 0
                }
                className="w-full py-2 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium text-lg transition-colors"
              >
                {isGenerating ? "Отправка..." : "Создать и отправить"}
              </button>
            )}

            {!selectedClient && !loading && clients.length > 0 && (
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
                <p>Выберите клиента, чтобы увидеть доступные организации</p>
              </div>
            )}

            {!loading && clients.length === 0 && !apiError && (
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
                <p>Список клиентов пуст. Добавьте первого клиента</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default observer(AllCategories);
