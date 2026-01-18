import { useState, useEffect, type ChangeEvent } from 'react';
import { Upload, X, Calendar, Hash, Type, FileText, Image, Video, CheckCircle, AlertCircle, Wifi, WifiOff, User } from 'lucide-react';
import { SOCIAL_PLATFORMS } from '../utils/platforms';
import {
  uploadMedia,
  schedulePost,
  getUserSocialAccounts,
  type PostData,
  type SocialAccount
} from '../utils/uploadPostApiNew';

export default function CreatePost() {
  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string>>({}); // { "instagram": "account_id", "facebook": "account_id" }
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Carregar contas sociais conectadas
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setLoadingAccounts(true);
        const accounts = await getUserSocialAccounts();
        setConnectedAccounts(accounts);
      } catch (error) {
        console.error('Erro ao carregar contas sociais:', error);
        setSubmitStatus({
          type: 'error',
          message: 'Falha ao carregar contas sociais conectadas'
        });
      } finally {
        setLoadingAccounts(false);
      }
    };
    loadAccounts();
  }, []);

  // Agrupar contas por plataforma
  const accountsByPlatform = connectedAccounts.reduce((acc, account) => {
    if (!acc[account.platform]) {
      acc[account.platform] = [];
    }
    acc[account.platform].push(account);
    return acc;
  }, {} as Record<string, SocialAccount[]>);

  const handleAccountToggle = (platform: string, accountId: string) => {
    setSelectedAccounts(prev => {
      const newSelected = { ...prev };
      if (newSelected[platform] === accountId) {
        delete newSelected[platform];
      } else {
        newSelected[platform] = accountId;
      }
      return newSelected;
    });
  };

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const newUrls: string[] = [];
      for (const file of files) {
        // Validar tamanho do arquivo (100MB)
        if (file.size > 100 * 1024 * 1024) {
          throw new Error(`Arquivo ${file.name} é muito grande. Máximo: 100MB`);
        }

        const url = await uploadMedia(file);
        newUrls.push(url);
      }

      setUploadedFiles(prev => [...prev, ...files]);
      setUploadedUrls(prev => [...prev, ...newUrls]);

      setSubmitStatus({
        type: 'success',
        message: `${files.length} arquivo(s) enviado(s) com sucesso!`
      });
    } catch (error) {
      console.error('Upload failed:', error);
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Falha no upload. Tente novamente.'
      });
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setUploadedUrls(prev => prev.filter((_, i) => i !== index));
  };

  const getCharacterCount = () => {
    const selectedPlatforms = Object.keys(selectedAccounts);
    const totalChars = content.length + hashtags.length;
    if (selectedPlatforms.length === 0) return totalChars;

    const minLimit = Math.min(...selectedPlatforms.map(platform =>
      SOCIAL_PLATFORMS.find(p => p.id === platform)?.maxChars || 0
    ));

    return `${totalChars}/${minLimit}`;
  };

  const isOverLimit = () => {
    const selectedPlatforms = Object.keys(selectedAccounts);
    const totalChars = content.length + hashtags.length;
    if (selectedPlatforms.length === 0) return false;

    const minLimit = Math.min(...selectedPlatforms.map(platform =>
      SOCIAL_PLATFORMS.find(p => p.id === platform)?.maxChars || 0
    ));

    return totalChars > minLimit;
  };

  const validateForm = (): string | null => {
    if (Object.keys(selectedAccounts).length === 0) {
      return 'Selecione pelo menos uma conta social';
    }

    if (!content.trim()) {
      return 'Conteúdo do post é obrigatório';
    }

    if (Object.keys(selectedAccounts).includes('youtube') && !title.trim()) {
      return 'Título é obrigatório para YouTube';
    }

    if (!scheduledDate || !scheduledTime) {
      return 'Data e horário de agendamento são obrigatórios';
    }

    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
    const now = new Date();

    if (scheduledDateTime <= now) {
      return 'Data de agendamento deve ser no futuro';
    }

    if (isOverLimit()) {
      return 'Conteúdo excede o limite de caracteres para algumas plataformas';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setSubmitStatus({ type: 'error', message: validationError });
      return;
    }

    setScheduling(true);
    setSubmitStatus({ type: null, message: '' });

    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();

      const postData: PostData = {
        platforms: selectedAccounts, // Agora usa account IDs específicos
        content: content.trim(),
        title: Object.keys(selectedAccounts).includes('youtube') ? title.trim() : undefined,
        hashtags: hashtags.split(' ').filter(tag => tag.trim() && tag.startsWith('#')),
        mediaUrls: uploadedUrls,
        scheduledAt,
      };

      console.log('📤 Enviando post:', postData);

      const result = await schedulePost(postData);

      // Salvar no localStorage para persistência local
      const postDataLocal = {
        id: Date.now().toString(),
        uploadPostId: result.postId,
        title: Object.keys(selectedAccounts).includes('youtube') ? title : content.substring(0, 50) + '...',
        content,
        platforms: selectedAccounts,
        scheduledFor: scheduledAt,
        status: 'pending' as 'pending' | 'scheduled' | 'published' | 'failed',
        createdAt: new Date().toISOString(),
        mediaUrls: uploadedUrls,
        hashtags: postData.hashtags,
      };

      const existingPosts = JSON.parse(localStorage.getItem('marketing_posts') || '[]');
      existingPosts.push(postDataLocal);
      localStorage.setItem('marketing_posts', JSON.stringify(existingPosts));

      setSubmitStatus({
        type: 'success',
        message: `✅ Post agendado com sucesso! ID: ${result.postId}`
      });

      // Reset form após sucesso
      setSelectedAccounts({});
      setTitle('');
      setContent('');
      setHashtags('');
      setScheduledDate('');
      setScheduledTime('');
      setUploadedFiles([]);
      setUploadedUrls([]);

    } catch (error) {
      console.error('Scheduling failed:', error);
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Falha ao agendar post. Tente novamente.'
      });
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Criar Novo Post</h2>
            <p className="text-gray-600">Crie e agende seu conteúdo para múltiplas plataformas</p>
          </div>

          {/* Status da API */}
          <div className="flex items-center space-x-2">
            {apiConnected === null ? (
              <div className="flex items-center text-gray-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                Verificando...
              </div>
            ) : apiConnected ? (
              <div className="flex items-center text-green-600">
                <Wifi className="w-4 h-4 mr-2" />
                API Conectada
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <WifiOff className="w-4 h-4 mr-2" />
                API Offline (Modo Mock)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {submitStatus.type && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${
          submitStatus.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {submitStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-2" />
          )}
          {submitStatus.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Account Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Selecionar Contas Sociais
          </h3>

          {loadingAccounts ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Carregando contas conectadas...</span>
            </div>
          ) : connectedAccounts.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhuma conta conectada</h4>
              <p className="text-gray-600 mb-4">
                Você precisa conectar suas contas de redes sociais antes de criar posts.
              </p>
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => {
                  // Aqui você pode navegar para o gerenciador de contas sociais
                  alert('Navegue para a seção "Contas Sociais" para conectar suas contas.');
                }}
              >
                Conectar Contas
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {SOCIAL_PLATFORMS.map((platform) => {
                const platformAccounts = accountsByPlatform[platform.id] || [];
                const selectedAccountId = selectedAccounts[platform.id];

                if (platformAccounts.length === 0) return null;

                return (
                  <div key={platform.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3"
                          style={{ backgroundColor: platform.color }}
                        >
                          {platform.name.substring(0, 2)}
                        </div>
                        <span className="font-medium text-gray-900">{platform.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {platformAccounts.length} conta{platformAccounts.length !== 1 ? 's' : ''} conectada{platformAccounts.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {platformAccounts.map((account) => (
                        <button
                          key={account.id}
                          type="button"
                          onClick={() => handleAccountToggle(platform.id, account.id)}
                          className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                            selectedAccountId === account.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                {account.account_name || account.account_username || 'Conta sem nome'}
                              </div>
                              {account.account_username && (
                                <div className="text-sm text-gray-500">
                                  @{account.account_username}
                                </div>
                              )}
                            </div>
                            {selectedAccountId === account.id && (
                              <CheckCircle className="w-5 h-5 text-blue-500" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {Object.keys(accountsByPlatform).length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  Nenhuma conta social conectada para as plataformas suportadas.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Conteúdo do Post
          </h3>
          
          <div className="space-y-4">
            {/* Title (required for YouTube) */}
            {Object.keys(selectedAccounts).includes('youtube') && (
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Título (obrigatório para YouTube) *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Digite o título do vídeo..."
                  required
                />
              </div>
            )}

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Descrição/Conteúdo *
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
                required
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
              {uploading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Fazendo upload...</span>
                </div>
              ) : (
                <>
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
                      disabled={uploading}
                    />
                  </div>
                </>
              )}
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
                Data *
              </label>
              <input
                type="date"
                id="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                Horário *
              </label>
              <input
                type="time"
                id="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => {
              // Salvar como rascunho no localStorage
              const draft = {
                selectedAccounts,
                title,
                content,
                hashtags,
                scheduledDate,
                scheduledTime,
                uploadedFiles: uploadedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
                uploadedUrls,
                savedAt: new Date().toISOString(),
              };
              localStorage.setItem('marketing_post_draft', JSON.stringify(draft));
              setSubmitStatus({ type: 'success', message: 'Rascunho salvo!' });
            }}
          >
            Salvar Rascunho
          </button>
          <button
            type="submit"
            disabled={scheduling}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {scheduling ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Agendando...
              </>
            ) : (
              'Agendar Post'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}