import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import store from "../store/store";

const Modal: React.FC = () => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await store.login(login, password);

    if (result.success) {
      store.closeModal("login");
      setLogin("");
      setPassword("");
      setError("");
      // Можно добавить уведомление об успешном входе
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleClose = () => {
    store.closeModal("login");
    setLogin("");
    setPassword("");
    setError("");
    setLoading(false);
  };

  if (!store.modals.login) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Вход в аккаунт
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="example@mail.ru"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
            />
            <p className="text-xs text-gray-400 mt-1">Введите ваш email</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль
            </label>
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium transition-colors"
          >
            {loading ? "Вход..." : "Войти"}
          </button>

          <div className="text-center">
            <span className="text-gray-300">Зарегистрироваться</span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default observer(Modal);
