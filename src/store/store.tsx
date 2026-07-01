import { makeAutoObservable } from "mobx";

interface User {
  login: string;
  role: string;
  name: string;
  token?: string;
}

class Store {
  user: User | null = null;
  token: string | null = null;

  modals = {
    login: false,
  };

  constructor() {
    makeAutoObservable(this);
    this.loadUserFromStorage();
  }

  // Загружаем пользователя из localStorage
  loadUserFromStorage() {
    const savedUser = localStorage.getItem("jurist_user");
    const savedToken = localStorage.getItem("jurist_token");

    if (savedUser && savedToken) {
      try {
        this.user = JSON.parse(savedUser);
        this.token = savedToken;
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("jurist_user");
        localStorage.removeItem("jurist_token");
      }
    }
  }

  // Сохраняем пользователя в localStorage
  saveUserToStorage(user: User, token: string) {
    localStorage.setItem("jurist_user", JSON.stringify(user));
    localStorage.setItem("jurist_token", token);
    this.user = user;
    this.token = token;
  }

  // Выход из аккаунта
  logout() {
    localStorage.removeItem("jurist_user");
    localStorage.removeItem("jurist_token");
    this.user = null;
    this.token = null;
  }

  // Вход в аккаунт через API
  async login(
    username: string,
    password: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const apiUrl = import.meta.env.VITE_API_URL;

      const response = await fetch(`${apiUrl}/api/auth/authenticate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { success: false, message: "Неверный логин или пароль" };
        }
        return {
          success: false,
          message: `Ошибка сервера: ${response.status}`,
        };
      }

      // Получаем токен из заголовка Authorization
      const authHeader = response.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return { success: false, message: "Токен не получен от сервера" };
      }

      const token = authHeader.substring(7); // Убираем "Bearer "

      // Парсим токен для получения информации о пользователе
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const user: User = {
          login: payload.sub || username,
          role: payload.role || "USER",
          name: payload.sub || username,
          token: token,
        };

        this.saveUserToStorage(user, token);
        return { success: true, message: "Успешный вход!" };
      } catch (parseError) {
        console.error("Error parsing token:", parseError);
        return { success: false, message: "Ошибка при обработке токена" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Ошибка подключения к серверу" };
    }
  }

  // Метод для получения токена для запросов
  getAuthHeader(): string | null {
    return this.token ? `Bearer ${this.token}` : null;
  }

  openModal(modalName: keyof typeof this.modals) {
    this.modals[modalName] = true;
  }

  closeModal(modalName: keyof typeof this.modals) {
    this.modals[modalName] = false;
  }
}

export default new Store();
