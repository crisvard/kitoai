import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MoreVertical, Eye, Trash2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getUserScheduledPosts, cancelScheduledPost, getPostStatus, type ScheduledPost } from '../utils/uploadPostApiNew';

interface ScheduledPostsListProps {
  refreshTrigger?: number;
  onPostCancelled?: (postId: string) => void;
}

const ScheduledPostsList: React.FC<ScheduledPostsListProps> = ({
  refreshTrigger,
  onPostCancelled,
}) => {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Carregar posts agendados
  const loadPosts = async () => {
    try {
      setLoading(true);
      const userPosts = await getUserScheduledPosts();
      setPosts(userPosts);
    } catch (err) {
      console.error('Erro ao carregar posts:', err);
      setError('Falha ao carregar posts agendados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [refreshTrigger]);

  // Atualizar status de um post
  const handleUpdateStatus = async (postId: string) => {
    try {
      setUpdatingStatus(postId);
      const status = await getPostStatus(postId);

      setPosts(prev => prev.map(post =>
        post.upload_post_id === postId
          ? { ...post, status: status.status as any, error_message: status.error }
          : post
      ));
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Cancelar post
  const handleCancelPost = async (postId: string) => {
    if (!confirm('Tem certeza que deseja cancelar este post?')) return;

    try {
      setCancelling(postId);
      const success = await cancelScheduledPost(postId);

      if (success) {
        setPosts(prev => prev.map(post =>
          post.upload_post_id === postId
            ? { ...post, status: 'cancelled' }
            : post
        ));
        onPostCancelled?.(postId);
      } else {
        setError('Falha ao cancelar post');
      }
    } catch (err) {
      console.error('Erro ao cancelar post:', err);
      setError('Falha ao cancelar post');
    } finally {
      setCancelling(null);
    }
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Obter ícone de status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  // Obter cor de status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'text-green-700 bg-green-100';
      case 'failed':
        return 'text-red-700 bg-red-100';
      case 'cancelled':
        return 'text-gray-700 bg-gray-100';
      default:
        return 'text-blue-700 bg-blue-100';
    }
  };

  // Obter texto de status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'scheduled':
        return 'Agendado';
      case 'published':
        return 'Publicado';
      case 'failed':
        return 'Falhou';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando posts agendados...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <div className="ml-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Posts Agendados</h3>
        <button
          onClick={loadPosts}
          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          Atualizar
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum post agendado</h4>
          <p className="text-gray-600">
            Você ainda não tem posts agendados. Crie seu primeiro post!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {getStatusIcon(post.status)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(post.status)}`}>
                      {getStatusText(post.status)}
                    </span>
                    <span className="text-sm text-gray-500">
                      ID: {post.upload_post_id}
                    </span>
                  </div>

                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    {post.title || post.content.substring(0, 100) + (post.content.length > 100 ? '...' : '')}
                  </h4>

                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <Calendar className="w-4 h-4 mr-1" />
                    Agendado para: {formatDate(post.scheduled_at)}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.keys(post.platforms).map((platform) => (
                      <span
                        key={platform}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-md capitalize"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>

                  {post.hashtags.length > 0 && (
                    <div className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Hashtags:</span> {post.hashtags.join(' ')}
                    </div>
                  )}

                  {post.error_message && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">
                        <span className="font-medium">Erro:</span> {post.error_message}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {(post.status === 'pending' || post.status === 'scheduled') && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(post.upload_post_id || '')}
                        disabled={updatingStatus === post.upload_post_id}
                        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        title="Atualizar status"
                      >
                        {updatingStatus === post.upload_post_id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleCancelPost(post.upload_post_id || '')}
                        disabled={cancelling === post.upload_post_id}
                        className="p-2 text-red-400 hover:text-red-600 disabled:opacity-50"
                        title="Cancelar post"
                      >
                        {cancelling === post.upload_post_id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ScheduledPostsList;