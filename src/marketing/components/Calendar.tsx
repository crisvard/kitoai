import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scheduledPosts, setScheduledPosts] = useState<Array<{
    id: string;
    date: string;
    time: string;
    title: string;
    platforms: string[];
    status: 'pending' | 'scheduled' | 'published' | 'failed';
  }>>([]);

  useEffect(() => {
    // Carregar posts do localStorage e converter para formato do calendário
    const loadPosts = () => {
      const storedPosts = JSON.parse(localStorage.getItem('marketing_posts') || '[]');
      const calendarPosts = storedPosts.map((post: any) => ({
        id: post.id,
        date: post.scheduledFor.split(' ')[0],
        time: post.scheduledFor.split(' ')[1],
        title: post.title,
        platforms: post.platforms,
        status: post.status,
      }));
      setScheduledPosts(calendarPosts);
    };

    loadPosts();
    const interval = setInterval(loadPosts, 30000); // Recarregar a cada 30s
    return () => clearInterval(interval);
  }, []);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const getPostsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return scheduledPosts.filter(post => post.date === dateStr);
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calendário de Posts</h2>
        <p className="text-gray-600">Visualize e gerencie seus agendamentos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 gap-px mb-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {getDaysInMonth().map((date, index) => {
                const posts = getPostsForDate(date);
                return (
                  <div
                    key={index}
                    className={`bg-white p-2 min-h-[120px] ${
                      !isCurrentMonth(date) ? 'bg-gray-50 text-gray-400' : ''
                    } ${isToday(date) ? 'bg-blue-50' : ''}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isToday(date) ? 'text-blue-600' : ''
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {posts.slice(0, 2).map((post) => (
                        <div
                          key={post.id}
                          className="bg-blue-100 text-blue-800 text-xs p-1 rounded truncate cursor-pointer hover:bg-blue-200 transition-colors"
                          title={post.title}
                        >
                          {post.time} - {post.title}
                        </div>
                      ))}
                      {posts.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{posts.length - 2} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Posts */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximos Posts</h3>
            <div className="space-y-4">
              {scheduledPosts.map((post) => (
                <div key={post.id} className="border-l-4 border-blue-400 pl-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{post.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{post.date} às {post.time}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.platforms.map((platform) => (
                          <span
                            key={platform}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {platform}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Clock className="w-4 h-4 text-orange-500 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estatísticas Rápidas</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Posts este mês</span>
                <span className="font-semibold text-gray-900">24</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Taxa de sucesso</span>
                <span className="font-semibold text-green-600">98.5%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Plataforma mais usada</span>
                <span className="font-semibold text-gray-900">Instagram</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}