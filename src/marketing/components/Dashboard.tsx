import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, CheckCircle, Clock, X } from 'lucide-react';
import { getPostStatus } from '../utils/uploadPostApi';

export default function Dashboard() {
  const [recentPosts, setRecentPosts] = useState<Array<{
    id: string;
    uploadPostId: string | null;
    title: string;
    content: string;
    platforms: string[];
    scheduledFor: string;
    status: 'pending' | 'scheduled' | 'published' | 'failed';
    createdAt: string;
  }>>([]);

  useEffect(() => {
    // Carregar posts do localStorage
    const loadPosts = () => {
      const storedPosts = JSON.parse(localStorage.getItem('marketing_posts') || '[]');
      setRecentPosts(storedPosts);
    };

    loadPosts();

    // Atualizar status dos posts
    const updateStatuses = async () => {
      const storedPosts = JSON.parse(localStorage.getItem('marketing_posts') || '[]');
      const updatedPosts = await Promise.all(
        storedPosts.map(async (post: any) => {
          if (post.uploadPostId) {
            try {
              const { status } = await getPostStatus(post.uploadPostId);
              return { ...post, status };
            } catch (error) {
              console.error('Failed to get status for post', post.id, error);
              return post;
            }
          }
          return post;
        })
      );
      setRecentPosts(updatedPosts);
      localStorage.setItem('marketing_posts', JSON.stringify(updatedPosts));
    };

    updateStatuses();
    const interval = setInterval(updateStatuses, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      name: 'Posts Agendados',
      value: '24',
      change: '+12%',
      changeType: 'increase',
      icon: Calendar,
      color: 'blue'
    },
    {
      name: 'Publicados Hoje',
      value: '8',
      change: '+3%',
      changeType: 'increase',
      icon: CheckCircle,
      color: 'green'
    },
    {
      name: 'Pendentes',
      value: '5',
      change: '-2%',
      changeType: 'decrease',
      icon: Clock,
      color: 'orange'
    },
    {
      name: 'Taxa de Sucesso',
      value: '98.5%',
      change: '+0.5%',
      changeType: 'increase',
      icon: TrendingUp,
      color: 'purple'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
        <p className="text-gray-600">Visão geral dos seus agendamentos</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-2">vs mês anterior</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Posts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Posts Recentes</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentPosts.map((post) => (
            <div key={post.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{post.title}</h4>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Plataformas:</span>
                    {post.platforms.map((platform) => (
                      <span
                        key={platform}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {platform}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Agendado para: {post.scheduledFor}</p>
                </div>
                <div className="flex items-center">
                  {post.status === 'pending' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <Clock className="w-3 h-3 mr-1" />
                      Pendente
                    </span>
                  )}
                  {post.status === 'scheduled' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      <Clock className="w-3 h-3 mr-1" />
                      Agendado
                    </span>
                  )}
                  {post.status === 'published' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Publicado
                    </span>
                  )}
                  {post.status === 'failed' && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <X className="w-3 h-3 mr-1" />
                      Falhou
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}