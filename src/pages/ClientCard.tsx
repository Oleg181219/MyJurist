import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import store from "../store/store";
import Header from "../components/Header";
import Modal from "../components/Modal";

interface FormErrors {
  lastName?: string;
  firstName?: string;
  patronymic?: string;
  birthDate?: string;
  passportSeries?: string;
  passportNumber?: string;
  inn?: string;
  snils?: string;
  address?: string;
  phone?: string;
  email?: string;
}

const ClientCard: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    lastName: "",
    firstName: "",
    patronymic: "",
    passportSeries: "",
    passportNumber: "",
    birthDate: "",
    inn: "",
    snils: "",
    address: "",
    phone: "",
    email: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Русские названия месяцев и дней недели
  const getRussianDateString = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const months = [
      "января",
      "февраля",
      "марта",
      "апреля",
      "мая",
      "июня",
      "июля",
      "августа",
      "сентября",
      "октября",
      "ноября",
      "декабря",
    ];
    const weekdays = [
      "воскресенье",
      "понедельник",
      "вторник",
      "среда",
      "четверг",
      "пятница",
      "суббота",
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const weekday = weekdays[date.getDay()];

    return `${day} ${month} ${year} года, ${weekday}`;
  };

  // Проверка кириллицы
  const validateCyrillic = (
    value: string,
    fieldName: string,
    required: boolean = true,
  ): string | null => {
    if (!value && !required) return null;
    if (!value && required) return `${fieldName} обязательно для заполнения`;
    const cyrillicRegex = /^[А-Яа-яЁё\-]+$/;
    if (!cyrillicRegex.test(value)) {
      return `${fieldName} должно содержать только буквы кириллицы`;
    }
    return null;
  };

  // Проверка адреса (кириллица, цифры, знаки препинания)
  const validateAddress = (value: string): string | null => {
    if (!value) return "Адрес обязателен для заполнения";
    const addressRegex = /^[А-Яа-яЁё0-9\s\.,\-№#\/\\\(\)]+$/;
    if (!addressRegex.test(value)) {
      return "Адрес может содержать только кириллицу, цифры и знаки препинания (., - № # / \ ())";
    }
    return null;
  };

  // Проверка телефона
  const validatePhone = (value: string): string | null => {
    if (!value) return "Телефон обязателен для заполнения";
    const phoneRegex = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
    if (!phoneRegex.test(value)) {
      return "Телефон должен быть в формате +7 (xxx) xxx-xx-xx";
    }
    return null;
  };

  // Проверка email
  const validateEmail = (value: string): string | null => {
    if (!value) return null; // Email необязательный
    const emailRegex =
      /^[a-zA-Z0-9][a-zA-Z0-9._%+-]*@[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) {
      return "Email должен быть в формате example@domain.com";
    }
    return null;
  };

  // Автоматическое форматирование телефона
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length === 0) return "";
    if (cleaned.length === 1) return `+7 (${cleaned}`;
    if (cleaned.length <= 4) return `+7 (${cleaned.slice(1)}`;
    if (cleaned.length <= 7)
      return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4)}`;
    if (cleaned.length <= 9)
      return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`;
  };

  // Обработка изменения полей с валидацией
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue = value;
    let error: string | null = null;

    // Применяем форматирование для телефона
    if (name === "phone") {
      newValue = formatPhoneNumber(value);
    }

    // Применяем ограничения для числовых полей
    if (name === "passportSeries") {
      newValue = value.replace(/\D/g, "").slice(0, 4);
    }
    if (name === "passportNumber") {
      newValue = value.replace(/\D/g, "").slice(0, 6);
    }
    if (name === "inn") {
      newValue = value.replace(/\D/g, "").slice(0, 12);
    }

    setFormData({
      ...formData,
      [name]: newValue,
    });

    // Валидация поля
    switch (name) {
      case "lastName":
        error = validateCyrillic(newValue, "Фамилия", true);
        break;
      case "firstName":
        error = validateCyrillic(newValue, "Имя", true);
        break;
      case "patronymic":
        error = validateCyrillic(newValue, "Отчество", false);
        break;
      case "passportSeries":
        if (newValue && newValue.length !== 4) {
          error = "Серия паспорта должна содержать 4 цифры";
        } else if (newValue && !/^\d+$/.test(newValue)) {
          error = "Серия паспорта должна содержать только цифры";
        } else {
          error = null;
        }
        break;
      case "passportNumber":
        if (newValue && newValue.length !== 6) {
          error = "Номер паспорта должен содержать 6 цифр";
        } else if (newValue && !/^\d+$/.test(newValue)) {
          error = "Номер паспорта должен содержать только цифры";
        } else {
          error = null;
        }
        break;
      case "inn":
        if (newValue && newValue.length !== 12) {
          error = "ИНН должен содержать 12 цифр";
        } else if (newValue && !/^\d+$/.test(newValue)) {
          error = "ИНН должен содержать только цифры";
        } else {
          error = null;
        }
        break;
      case "address":
        error = validateAddress(newValue);
        break;
      case "phone":
        error = validatePhone(newValue);
        break;
      case "email":
        error = validateEmail(newValue);
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error || undefined }));
  };

  // Валидация всей формы перед отправкой
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    newErrors.lastName =
      validateCyrillic(formData.lastName, "Фамилия", true) || undefined;
    newErrors.firstName =
      validateCyrillic(formData.firstName, "Имя", true) || undefined;
    newErrors.patronymic =
      validateCyrillic(formData.patronymic, "Отчество", false) || undefined;

    if (!formData.birthDate) {
      newErrors.birthDate = "Дата рождения обязательна для заполнения";
    }

    if (formData.passportSeries && formData.passportSeries.length !== 4) {
      newErrors.passportSeries = "Серия паспорта должна содержать 4 цифры";
    } else if (
      formData.passportSeries &&
      !/^\d+$/.test(formData.passportSeries)
    ) {
      newErrors.passportSeries = "Серия паспорта должна содержать только цифры";
    }

    if (formData.passportNumber && formData.passportNumber.length !== 6) {
      newErrors.passportNumber = "Номер паспорта должен содержать 6 цифр";
    } else if (
      formData.passportNumber &&
      !/^\d+$/.test(formData.passportNumber)
    ) {
      newErrors.passportNumber = "Номер паспорта должен содержать только цифры";
    }

    if (formData.inn && formData.inn.length !== 12) {
      newErrors.inn = "ИНН должен содержать 12 цифр";
    } else if (formData.inn && !/^\d+$/.test(formData.inn)) {
      newErrors.inn = "ИНН должен содержать только цифры";
    }

    newErrors.address = validateAddress(formData.address) || undefined;
    newErrors.phone = validatePhone(formData.phone) || undefined;
    newErrors.email = validateEmail(formData.email) || undefined;

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!store.user) {
      store.openModal("login");
      return;
    }

    if (validateForm()) {
      console.log("Данные клиента:", formData);
      alert("Клиент успешно добавлен!");
      navigate("/");
    } else {
      alert("Пожалуйста, исправьте ошибки в форме");
    }
  };

  // Проверяем авторизацию при загрузке
  React.useEffect(() => {
    if (!store.user) {
      store.openModal("login");
    }
  }, []);

  if (!store.user && !store.modals.login) {
    return (
      <div className="min-h-screen bg-linear-to-br from-purple-100 via-blue-100 to-indigo-100">
        <Header />
        <Modal />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-100 via-blue-100 to-indigo-100">
      <Header />
      <Modal />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Добавление клиента
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Фамилия */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Фамилия *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-xl border ${
                    errors.lastName ? "border-red-500" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-300`}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>

              {/* Имя */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Имя *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-xl border ${
                    errors.firstName ? "border-red-500" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-300`}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>

              {/* Отчество */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Отчество
                </label>
                <input
                  type="text"
                  name="patronymic"
                  value={formData.patronymic}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-xl border ${
                    errors.patronymic ? "border-red-500" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-300`}
                />
                {errors.patronymic && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.patronymic}
                  </p>
                )}
              </div>

              {/* Дата рождения */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата рождения *
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                {formData.birthDate && (
                  <p className="text-gray-500 text-xs mt-1">
                    {getRussianDateString(formData.birthDate)}
                  </p>
                )}
                {errors.birthDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.birthDate}
                  </p>
                )}
              </div>

              {/* Серия паспорта */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Серия паспорта *
                </label>
                <input
                  type="text"
                  name="passportSeries"
                  value={formData.passportSeries}
                  onChange={handleChange}
                  placeholder="1234"
                  maxLength={4}
                  className={`w-full px-4 py-2 rounded-xl border ${
                    errors.passportSeries ? "border-red-500" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-300`}
                />
                {errors.passportSeries && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.passportSeries}
                  </p>
                )}
              </div>

              {/* Номер паспорта */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Номер паспорта *
                </label>
                <input
                  type="text"
                  name="passportNumber"
                  value={formData.passportNumber}
                  onChange={handleChange}
                  placeholder="123456"
                  maxLength={6}
                  className={`w-full px-4 py-2 rounded-xl border ${
                    errors.passportNumber ? "border-red-500" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-300`}
                />
                {errors.passportNumber && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.passportNumber}
                  </p>
                )}
              </div>

              {/* ИНН */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ИНН
                </label>
                <input
                  type="text"
                  name="inn"
                  value={formData.inn}
                  onChange={handleChange}
                  placeholder="123456789012"
                  maxLength={12}
                  className={`w-full px-4 py-2 rounded-xl border ${
                    errors.inn ? "border-red-500" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-300`}
                />
                {errors.inn && (
                  <p className="text-red-500 text-xs mt-1">{errors.inn}</p>
                )}
              </div>

              {/* СНИЛС */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  СНИЛС
                </label>
                <input
                  type="text"
                  name="snils"
                  value={formData.snils}
                  onChange={handleChange}
                  placeholder="123-456-789 01"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {/* Адрес */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Адрес *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="г. Москва, ул. Примерная, д. 1, кв. 1"
                  className={`w-full px-4 py-2 rounded-xl border ${
                    errors.address ? "border-red-500" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-300`}
                />
                {errors.address && (
                  <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                )}
              </div>

              {/* Телефон */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+7 (999) 999-99-99"
                  className={`w-full px-4 py-2 rounded-xl border ${
                    errors.phone ? "border-red-500" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-300`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@domain.com"
                  className={`w-full px-4 py-2 rounded-xl border ${
                    errors.email ? "border-red-500" : "border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-300`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="px-6 py-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
              >
                Сохранить клиента
              </button>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="px-6 py-3 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default observer(ClientCard);
