import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserPlusIcon,
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  BuildingOfficeIcon,
  ExclamationCircleIcon,
  EyeIcon,
  EyeSlashIcon 
} from '@heroicons/react/24/outline';
import LoadingSpinner from './LoadingSpinner';

const RegisterForm = ({ onToggleMode }) => {
  const { register, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    cnpj: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Limpar erro de validação do campo
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }

    // Limpar confirmação de senha se a senha mudou
    if (name === 'password' && validationErrors.confirmPassword) {
      setValidationErrors(prev => ({
        ...prev,
        confirmPassword: '',
      }));
    }

    // Limpar erro geral
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (!formData.email) {
      errors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!formData.password) {
      errors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Senhas não conferem';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const userData = {
      name: formData.name.trim(),
      email: formData.email,
      password: formData.password,
    };

    // Adicionar dados da empresa se fornecidos
    if (formData.companyName.trim()) {
      userData.companyName = formData.companyName.trim();
    }
    if (formData.cnpj.trim()) {
      userData.cnpj = formData.cnpj.trim();
    }

    const result = await register(userData);
    
    if (result.success) {
      console.log('Registro realizado com sucesso');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlusIcon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Criar Conta</h2>
        <p className="text-gray-600 mt-2">Preencha os dados para começar</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <ExclamationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700 text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nome */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome completo
          </label>
          <div className="relative">
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 pl-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition-colors ${
                validationErrors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Seu nome"
              disabled={isLoading}
            />
            <UserIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          </div>
          {validationErrors.name && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 pl-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition-colors ${
                validationErrors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="seu@email.com"
              disabled={isLoading}
            />
            <EnvelopeIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          </div>
          {validationErrors.email && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
          )}
        </div>

        {/* Senha */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Senha
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 pl-11 pr-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition-colors ${
                validationErrors.password ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Mínimo 6 caracteres"
              disabled={isLoading}
            />
            <LockClosedIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          {validationErrors.password && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
          )}
        </div>

        {/* Confirmar Senha */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar senha
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 pl-11 pr-11 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition-colors ${
                validationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Digite a senha novamente"
              disabled={isLoading}
            />
            <LockClosedIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              disabled={isLoading}
            >
              {showConfirmPassword ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>
          )}
        </div>

        {/* Divider */}
        <div className="py-2">
          <div className="border-t border-gray-200"></div>
          <p className="text-xs text-gray-500 text-center mt-2 -mb-2">
            Dados da empresa (opcional)
          </p>
        </div>

        {/* Nome da Empresa */}
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
            Nome da empresa
          </label>
          <div className="relative">
            <input
              id="companyName"
              name="companyName"
              type="text"
              value={formData.companyName}
              onChange={handleChange}
              className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition-colors"
              placeholder="Nome da sua empresa"
              disabled={isLoading}
            />
            <BuildingOfficeIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* CNPJ */}
        <div>
          <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1">
            CNPJ
          </label>
          <input
            id="cnpj"
            name="cnpj"
            type="text"
            value={formData.cnpj}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-300 transition-colors"
            placeholder="00.000.000/0001-00"
            disabled={isLoading}
          />
        </div>

        {/* Botão de Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transform hover:scale-[1.02]'
          }`}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              Criando conta...
            </>
          ) : (
            'Criar conta'
          )}
        </button>

        {/* Link para login */}
        <div className="text-center">
          <p className="text-gray-600">
            Já tem uma conta?{' '}
            <button
              type="button"
              onClick={onToggleMode}
              className="text-blue-500 hover:text-blue-600 font-medium"
              disabled={isLoading}
            >
              Fazer login
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;