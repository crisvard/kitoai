import React, { useState } from 'react';
import { Upload, X, Calendar, Hash, Type, FileText, Image, Video } from 'lucide-react';
import { SOCIAL_PLATFORMS } from '../utils/platforms';

export default function CreatePost() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getCharacterCount = () => {
    const totalChars = content.length + hashtags.length;
    if (selectedPlatforms.length === 0) return totalChars;
    
    const minLimit = Math.min(...selectedPlatforms.map(id => 
      SOCIAL_PLATFORMS.find(p => p.id === id)?.maxChars || 0
    ));
    
    return `${totalChars}/${minLimit}`;
  };

  const isOverLimit = () => {
    const totalChars = content.length + hashtags.length;
    if (selectedPlatforms.length === 0) return false;
    
    const minLimit = Math.min(...selectedPlatforms.map(id => 
      SOCIAL_PLATFORMS.find(p => p.id === id)?.maxChars || 0
    ));
    
    return totalChars > minLimit;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aqui você implementaria a lógica de salvar/agendar o post
    console.log({
      title,
      content,
      hashtags: hashtags.split(' ').filter(tag => tag.startsWith('#')),
      platforms: selectedPlatforms,
      scheduledFor: `${scheduledDate} ${scheduledTime}`,
      files: uploadedFiles
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Criar Novo Post</h2>
        <p className="text-gray-600">Crie e agende seu conteúdo para múltiplas plataformas</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Platform Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Type className="w-5 h-5 mr-2" />
            Selecionar Plataformas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {SOCIAL_PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                type="button"
                onClick={() => handlePlatformToggle(platform.id)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedPlatforms.includes(platform.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div 
                    className="w-12 h-12 rounded-lg mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: platform.color }}
                  >
                    {platform.name.substring(0, 2)}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{platform.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Conteúdo do Post
          </h3>
          
          <div className="space-y-4">
            {/* Title (required for YouTube) */}
            {selectedPlatforms.includes('youtube') && (
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Título (obrigatório para YouTube)
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o título do vídeo..."
                />
              </div>
            )}

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Descrição/Conteúdo
              </label>
              <textarea
                id="content"
                rows={6}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isOverLimit() ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Escreva o conteúdo do seu post..."
              />
            </div>

            {/* Hashtags */}
            <div>
              <label htmlFor="hashtags" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Hash className="w-4 h-4 mr-1" />
                Hashtags
              </label>
              <input
                type="text"
                id="hashtags"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="#marketing #socialmedia #content"
              />
            </div>

            {/* Character Counter */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">
                Caracteres: <span className={isOverLimit() ? 'text-red-500 font-medium' : ''}>{getCharacterCount()}</span>
              </span>
              {isOverLimit() && (
                <span className="text-red-500">⚠️ Excede o limite de algumas plataformas</span>
              )}
            </div>
          </div>
        </div>

        {/* Media Upload */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Image className="w-5 h-5 mr-2" />
            Mídia
          </h3>
          
          <div className="space-y-4">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Clique para fazer upload ou arraste arquivos aqui
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    PNG, JPG, GIF, MP4 até 100MB
                  </span>
                </label>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  className="sr-only"
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      {file.type.startsWith('image/') ? (
                        <Image className="w-8 h-8 text-gray-400" />
                      ) : (
                        <Video className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="mt-2 text-xs text-gray-500 truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Agendamento
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Data
              </label>
              <input
                type="date"
                id="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                Horário
              </label>
              <input
                type="time"
                id="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Salvar Rascunho
          </button>
          <button
            type="submit"
            disabled={selectedPlatforms.length === 0 || !content || !scheduledDate || !scheduledTime}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Agendar Post
          </button>
        </div>
      </form>
    </div>
  );
}