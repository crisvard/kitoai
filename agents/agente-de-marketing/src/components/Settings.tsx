import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Palette, Globe } from 'lucide-react';

export default function Settings() {
  const [notifications, setNotifications] = useState({
    postPublished: true,
    postFailed: true,
    scheduleReminder: false,
    weeklyReport: true
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configurações</h2>
        <p className="text-gray-600">Gerencie suas preferências e conexões</p>
      </div>

      <div className="space-y-8">
        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notificações
          </h3>
          <p className="text-gray-600 mb-6">Escolha que tipo de notificações você deseja receber</p>
          
          <div className="space-y-4">
            {[
              { key: 'postPublished', label: 'Post publicado com sucesso', description: 'Receber notificação quando um post for publicado' },
              { key: 'postFailed', label: 'Falha na publicação', description: 'Ser notificado se houver erro na publicação' },
              { key: 'scheduleReminder', label: 'Lembrete de agendamento', description: 'Receber lembrete 10 minutos antes da publicação' },
              { key: 'weeklyReport', label: 'Relatório semanal', description: 'Resumo semanal da performance dos posts' }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{item.label}</h4>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifications[item.key as keyof typeof notifications]}
                    onChange={(e) => setNotifications(prev => ({
                      ...prev,
                      [item.key]: e.target.checked
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* General Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <SettingsIcon className="w-5 h-5 mr-2" />
            Configurações Gerais
          </h3>
          
          <div className="space-y-6">
            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Globe className="w-4 h-4 mr-2" />
                Fuso Horário
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="America/Sao_Paulo">São Paulo (UTC-3)</option>
                <option value="America/New_York">New York (UTC-5)</option>
                <option value="Europe/London">London (UTC+0)</option>
              </select>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Palette className="w-4 h-4 mr-2" />
                Tema
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
                <option value="auto">Automático</option>
              </select>
            </div>

            {/* Privacy */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                Privacidade
              </label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                  <span className="ml-2 text-sm text-gray-700">Permitir coleta de dados de uso</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="ml-2 text-sm text-gray-700">Receber emails promocionais</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}